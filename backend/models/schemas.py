# ============================================================
# SCHEMAS.PY - Pydantic Request / Response Models
# PromithicAI v2.0
# ============================================================

from pydantic import BaseModel, Field
from typing import Optional


class GenerateRequest(BaseModel):
    """Request body for POST /api/generate"""

    prompt: str = Field(
        ...,
        min_length=10,
        max_length=2000,
        description="User app description",
        examples=["Build me a Pomodoro timer with dark mode"],
    )
    provider: str = Field(
        ...,
        description="LLM provider: claude | openai | nvidia",
        examples=["claude"],
    )
    model: str = Field(
        ...,
        description="Model ID from the provider allowlist",
        examples=["claude-3-5-sonnet-20241022"],
    )
    api_key: Optional[str] = Field(
        default=None,
        description="Optional BYOK API key. Uses server key if omitted.",
    )
