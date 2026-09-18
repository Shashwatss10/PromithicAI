# ============================================================
# GRAPH.PY - LangGraph StateGraph Definition
# PromithicAI v2.0
# Wires Planner -> Coder -> Reviewer with retry logic.
# ============================================================

from langgraph.graph import StateGraph, START, END

from models.state import AgentState
from agents.planner  import planner_node
from agents.coder    import coder_node
from agents.reviewer import reviewer_node

MAX_RETRIES = 2


def should_retry(state: AgentState) -> str:
    """
    Conditional edge after Reviewer.
    - If reviewer hit an error AND retries remain -> retry from Coder
    - Otherwise -> done
    """
    if state.get("error") and state.get("retry_count", 0) < MAX_RETRIES:
        return "retry"
    return "done"


async def increment_retry(state: AgentState) -> dict:
    """
    Helper node: increments retry_count before sending back to Coder.
    """
    count = state.get("retry_count", 0) + 1
    return {
        "retry_count":  count,
        "error":        None,
        "current_step": "retrying",
        "logs":         [f"[Graph] Retry attempt {count}/{MAX_RETRIES}..."],
    }


def build_graph() -> StateGraph:
    """Build and compile the PromithicAI agent graph."""

    builder = StateGraph(AgentState)

    # -- Add nodes ------------------------------------------
    builder.add_node("planner",        planner_node)
    builder.add_node("coder",          coder_node)
    builder.add_node("reviewer",       reviewer_node)
    builder.add_node("increment_retry", increment_retry)

    # -- Entry point ----------------------------------------
    builder.add_edge(START, "planner")

    # -- Linear flow ----------------------------------------
    builder.add_edge("planner", "coder")
    builder.add_edge("coder",   "reviewer")

    # -- Conditional retry after reviewer -------------------
    builder.add_conditional_edges(
        "reviewer",
        should_retry,
        {
            "retry": "increment_retry",
            "done":  END,
        },
    )
    builder.add_edge("increment_retry", "coder")

    return builder.compile()


# Singleton compiled graph (imported by the generate endpoint)
compiled_graph = build_graph()
