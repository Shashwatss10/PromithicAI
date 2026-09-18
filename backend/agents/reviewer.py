# ============================================================
# REVIEWER.PY - ReviewerAgent Node
# PromithicAI v2.0
# Reviews and fixes the generated code for quality and bugs.
# ============================================================

from models.state import AgentState
from providers.factory import get_provider

SYSTEM_PROMPT = """You are the Reviewer agent of PromithicAI, a multi-agent web app builder.

You receive generated HTML/CSS/JS code and a build plan. Your job is to:

1. CHECK for issues:
   - Unclosed HTML tags or missing brackets
   - JavaScript syntax errors or broken logic
   - CSS that prevents rendering or layout issues
   - Missing features that were in the plan
   - Non-responsive or broken mobile layout

2. FIX any issues found

3. OUTPUT the corrected complete HTML

REVIEW NOTES FORMAT:
Start your response with a brief review summary in this format:
REVIEW: <one line summary of what was checked and fixed>
CHANGES: <bullet list of specific fixes, or "None - code is clean">

Then output the complete corrected HTML starting on a new line with <!DOCTYPE html>.

If the code is already perfect, still output the full HTML unchanged after the review header."""


async def reviewer_node(state: AgentState) -> dict:
    """
    LangGraph node: Reviewer Agent.
    Reviews generated code, fixes issues, returns final code.
    """
    logs = ["[Reviewer] Starting code review..."]

    try:
        provider = get_provider(
            provider=state["provider"],
            model=state["model"],
            user_key=state.get("api_key"),
        )

        logs.append(f"[Reviewer] Using {state['provider']} / {state['model']}")
        logs.append("[Reviewer] Checking syntax and logic...")

        user_message = (
            f"Build plan:\n{state['plan']}\n\n"
            f"Generated code to review:\n{state['code']}\n\n"
            "Review and return the corrected complete HTML."
        )

        response = await provider.chat(
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )

        response = response.strip()

        # Split review notes from final HTML
        review_notes = ""
        final_code = response

        if "<!DOCTYPE" in response or "<html" in response:
            # Find where the HTML starts
            html_start = response.find("<!DOCTYPE")
            if html_start == -1:
                html_start = response.find("<html")

            if html_start > 0:
                review_notes = response[:html_start].strip()
                final_code = response[html_start:].strip()
            else:
                final_code = response.strip()

        # Strip markdown code fences if present
        if final_code.startswith("```html"):
            final_code = final_code[7:]
        if final_code.startswith("```"):
            final_code = final_code[3:]
        if final_code.endswith("```"):
            final_code = final_code[:-3]
        final_code = final_code.strip()

        logs.append("[Reviewer] Review complete.")
        if review_notes:
            logs.append(f"[Reviewer] {review_notes[:200]}")

        return {
            "final_code":   final_code,
            "review_notes": review_notes,
            "current_step": "reviewer_done",
            "logs":         logs,
            "error":        None,
        }

    except Exception as e:
        error_msg = f"[Reviewer] Error: {str(e)}"
        # On reviewer failure, use the unreviewed code as fallback
        return {
            "final_code":   state.get("code", ""),
            "review_notes": "",
            "current_step": "error",
            "logs":         logs + [error_msg],
            "error":        str(e),
        }
