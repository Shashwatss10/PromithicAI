# ============================================================
# CODER.PY - CoderAgent Node
# PromithicAI v2.0
# Generates complete single-file HTML app from the plan.
# ============================================================

from models.state import AgentState
from providers.factory import get_provider

SYSTEM_PROMPT = """You are the Coder agent of PromithicAI, a multi-agent web app builder.

You receive a structured build plan and produce a complete, working web application.

REQUIREMENTS:
- Output ONE complete HTML file only
- All CSS must be inside a <style> tag in <head>
- All JavaScript must be inside a <script> tag before </body>
- No external JS frameworks (React, Vue, etc.)
- CDN links for icons (Lucide, Font Awesome) or fonts (Google Fonts) are allowed
- Must be fully functional and production-quality
- Must be mobile responsive with a proper viewport meta tag
- Use modern CSS (variables, flexbox, grid)
- Include proper semantic HTML5 elements

OUTPUT FORMAT:
Return ONLY the complete HTML code starting with <!DOCTYPE html>.
Do not add any explanation, markdown code blocks, or text before/after the HTML.
The very first character of your response must be < and the last must be >"""


async def coder_node(state: AgentState) -> dict:
    """
    LangGraph node: Coder Agent.
    Takes the build plan and generates complete HTML/CSS/JS.
    """
    logs = ["[Coder] Starting code generation..."]

    try:
        provider = get_provider(
            provider=state["provider"],
            model=state["model"],
            user_key=state.get("api_key"),
        )

        logs.append(f"[Coder] Using {state['provider']} / {state['model']}")
        logs.append("[Coder] Writing HTML structure...")

        user_message = (
            f"Build plan:\n{state['plan']}\n\n"
            f"Original request: {state['prompt']}\n\n"
            "Generate the complete HTML application now."
        )

        code = await provider.chat(
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )

        # Strip markdown code fences if model added them
        code = code.strip()
        if code.startswith("```html"):
            code = code[7:]
        if code.startswith("```"):
            code = code[3:]
        if code.endswith("```"):
            code = code[:-3]
        code = code.strip()

        logs.append("[Coder] Code generation complete.")
        logs.append(f"[Coder] Generated {len(code)} characters.")

        return {
            "code":         code,
            "current_step": "coder_done",
            "logs":         logs,
            "error":        None,
        }

    except Exception as e:
        error_msg = f"[Coder] Error: {str(e)}"
        return {
            "code":         "",
            "current_step": "error",
            "logs":         logs + [error_msg],
            "error":        str(e),
        }
