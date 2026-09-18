# ============================================================
# PLANNER.PY - PlannerAgent Node
# PromithicAI v2.0
# Converts user prompt into a structured build plan.
# ============================================================

from models.state import AgentState
from providers.factory import get_provider

SYSTEM_PROMPT = """You are the Planner agent of PromithicAI, a multi-agent web app builder.

Your job is to analyze the user's app request and produce a clear, structured build plan.

Output your plan in this exact format:

APP NAME: <name>
DESCRIPTION: <one sentence description>

FEATURES:
- <feature 1>
- <feature 2>
- <feature 3>
(3-6 features)

UI COMPONENTS:
- <component 1>
- <component 2>
(key UI elements needed)

COLOR SCHEME: <describe the visual style>

TECHNICAL NOTES:
- Single HTML file (inline CSS + JS, no frameworks)
- Mobile responsive
- <any specific technical requirements>

Be concise and precise. The Coder agent will use this plan directly."""


async def planner_node(state: AgentState) -> dict:
    """
    LangGraph node: Planner Agent.
    Takes the user prompt and produces a structured build plan.
    """
    logs = ["[Planner] Starting analysis..."]

    try:
        provider = get_provider(
            provider=state["provider"],
            model=state["model"],
            user_key=state.get("api_key"),
        )

        logs.append(f"[Planner] Using {state['provider']} / {state['model']}")
        logs.append("[Planner] Analyzing prompt and identifying features...")

        plan = await provider.chat(
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": state["prompt"]}],
        )

        logs.append("[Planner] Build plan created.")

        return {
            "plan":         plan,
            "current_step": "planner_done",
            "logs":         logs,
            "error":        None,
        }

    except Exception as e:
        error_msg = f"[Planner] Error: {str(e)}"
        return {
            "plan":         "",
            "current_step": "error",
            "logs":         logs + [error_msg],
            "error":        str(e),
        }
