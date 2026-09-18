# ============================================================
# GENERATE.PY - POST /api/generate (SSE streaming endpoint)
# PromithicAI v2.0
# Runs Planner -> Coder (streaming tokens) -> Reviewer
# and emits SSE events compatible with the frontend parser.
# ============================================================

import json
import asyncio
from fastapi import APIRouter, Request, Depends
from fastapi.responses import StreamingResponse

from models.schemas import GenerateRequest
from providers.factory import get_provider, validate_provider_model
from agents.planner  import SYSTEM_PROMPT as PLANNER_SYSTEM
from agents.coder    import SYSTEM_PROMPT as CODER_SYSTEM
from agents.reviewer import SYSTEM_PROMPT as REVIEWER_SYSTEM
from middleware.auth import get_current_user
from middleware.supabase_client import save_build

router = APIRouter()

MAX_RETRIES = 2


# ── SSE helpers ─────────────────────────────────────────────

def sse(event_type: str, data: dict) -> str:
    """Format a dict as an SSE data line."""
    payload = {"type": event_type, **data}
    return f"data: {json.dumps(payload)}\n\n"


def clean_code(code: str) -> str:
    """Strip markdown code fences if the model added them."""
    code = code.strip()
    if code.startswith("```html"):
        code = code[7:]
    if code.startswith("```"):
        code = code[3:]
    if code.endswith("```"):
        code = code[:-3]
    return code.strip()


def extract_final_code(response: str) -> tuple[str, str]:
    """
    Split reviewer response into (review_notes, final_html).
    The reviewer puts review notes before the HTML.
    """
    response = response.strip()
    html_start = response.find("<!DOCTYPE")
    if html_start == -1:
        html_start = response.find("<html")

    if html_start > 0:
        notes = response[:html_start].strip()
        code  = response[html_start:].strip()
    else:
        notes = ""
        code  = response

    return clean_code(code), notes



# ── Core pipeline generator ──────────────────────────────────


async def pipeline_generator(body: GenerateRequest, user_id: str):
    """
    Async generator that runs the full agent pipeline and
    yields SSE-formatted strings for each event.
    """
    provider_name = body.provider
    model         = body.model
    prompt        = body.prompt
    api_key       = body.api_key

    retry_count = 0
    code = ""
    plan = ""

    try:
        # -- Validate provider/model --------------------------
        valid, err = validate_provider_model(provider_name, model)
        if not valid:
            yield sse("error", {"msg": err})
            return

        # -- Get provider instance ----------------------------
        try:
            provider = get_provider(provider_name, model, api_key)
        except ValueError as e:
            yield sse("error", {"msg": str(e)})
            return

        # =====================================================
        # PLANNER
        # =====================================================
        yield sse("step_start", {"step": "planner"})
        yield sse("log", {"step": "planner", "msg": "Analyzing your request..."})
        yield sse("log", {"step": "planner", "msg": f"Using {provider_name} / {model}"})

        planner_msg = [{"role": "user", "content": prompt}]
        plan = await provider.chat(PLANNER_SYSTEM, planner_msg)

        yield sse("log", {"step": "planner", "msg": "Build plan created."})
        yield sse("step_done", {"step": "planner"})

        # =====================================================
        # CODER (with retry loop)
        # =====================================================
        while True:
            yield sse("step_start", {"step": "coder"})
            yield sse("log", {"step": "coder", "msg": "Generating code..."})

            coder_msg = [{
                "role": "user",
                "content": (
                    f"Build plan:\n{plan}\n\n"
                    f"Original request: {prompt}\n\n"
                    "Generate the complete HTML application now."
                )
            }]

            # Stream code tokens
            code = ""
            async for token in provider.stream(CODER_SYSTEM, coder_msg):
                code += token
                yield sse("code_token", {"token": token})

            code = clean_code(code)
            yield sse("log", {"step": "coder", "msg": f"Generated {len(code)} characters."})
            yield sse("step_done", {"step": "coder"})

            # =====================================================
            # REVIEWER
            # =====================================================
            yield sse("step_start", {"step": "reviewer"})
            yield sse("log", {"step": "reviewer", "msg": "Reviewing code quality..."})
            yield sse("log", {"step": "reviewer", "msg": "Checking syntax and logic..."})

            reviewer_msg = [{
                "role": "user",
                "content": (
                    f"Build plan:\n{plan}\n\n"
                    f"Generated code to review:\n{code}\n\n"
                    "Review and return the corrected complete HTML."
                )
            }]

            reviewer_response = await provider.chat(REVIEWER_SYSTEM, reviewer_msg)
            final_code, review_notes = extract_final_code(reviewer_response)

            if review_notes:
                short_note = review_notes[:150].replace("\n", " ")
                yield sse("log", {"step": "reviewer", "msg": short_note})

            yield sse("log", {"step": "reviewer", "msg": "Review complete."})
            yield sse("step_done", {"step": "reviewer"})

            # Check if we need to retry (empty final code = reviewer failed)
            if not final_code and retry_count < MAX_RETRIES:
                retry_count += 1
                yield sse("log", {
                    "step": "reviewer",
                    "msg": f"Retrying... attempt {retry_count}/{MAX_RETRIES}"
                })
                continue

            # Done
            break

        if not final_code:
            final_code = code  # fallback to unreviewed code

        yield sse("complete", {"code": final_code})

        # -- Save to Supabase (best-effort, non-blocking) -----
        try:
            await save_build(
                user_id=user_id,
                prompt=body.prompt,
                code=final_code,
                provider=body.provider,
                model=body.model,
            )
        except Exception as save_err:
            # Build delivered already — save failure is non-fatal
            print(f"[Supabase] Save failed (non-fatal): {save_err}")

    except asyncio.CancelledError:
        return
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[Generate Error] Pipeline failed: {e}", flush=True)
        yield sse("error", {"msg": f"Pipeline error: {str(e)}"})


# ── Route ────────────────────────────────────────────────────

@router.post("/generate")
async def generate(
    body: GenerateRequest,
    user_id: str = Depends(get_current_user),
):
    """
    POST /api/generate
    Runs the full Planner -> Coder -> Reviewer pipeline.
    Returns a Server-Sent Events stream.

    Auth: Required — Firebase Bearer ID token in Authorization header.
    Body: { prompt, provider, model, api_key? }
    """
    return StreamingResponse(
        pipeline_generator(body, user_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control":     "no-cache",
            "Connection":        "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
