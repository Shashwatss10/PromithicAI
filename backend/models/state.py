# ============================================================
# STATE.PY - LangGraph AgentState Schema
# PromithicAI v2.0
# ============================================================

import operator
from typing import Annotated, TypedDict


class AgentState(TypedDict):
    """
    Shared state that flows through all agent nodes.
    The `logs` field uses operator.add as a reducer so nodes
    can append logs without overwriting previous entries.
    """

    # ── Input ──────────────────────────────────────────────
    prompt:   str             # User original prompt
    provider: str             # "claude" | "openai" | "nvidia"
    model:    str             # e.g. "claude-3-5-sonnet-20241022"
    api_key:  str | None      # BYOK key (None = use server key)
    user_id:  str             # Firebase UID of the requesting user

    # ── Agent outputs (filled progressively) ───────────────
    plan:         str         # PlannerAgent structured plan
    code:         str         # CoderAgent raw generated code
    review_notes: str         # ReviewerAgent notes on what was fixed
    final_code:   str         # Reviewed + corrected final code

    # ── Orchestration ───────────────────────────────────────
    current_step: str         # "planner" | "coder" | "reviewer"
    error:        str | None  # Set if any node hits a fatal error
    retry_count:  int         # Reviewer retry counter (max 2)

    # logs uses operator.add so each node APPENDS instead of replacing
    logs: Annotated[list[str], operator.add]
