# ============================================================
# HEALTH.PY - GET /api/health
# PromithicAI v2.0
# ============================================================

from fastapi import APIRouter
from datetime import datetime, timezone
import os

router = APIRouter()

@router.get("/health")
async def health():
    """
    Public health check endpoint.
    Returns server status, version, and which providers
    have server-side keys configured.
    """
    return {
        "status":  "ok",
        "version": "2.0.0",
        "providers": {
            "claude": bool(os.getenv("ANTHROPIC_API_KEY")),
            "openai": bool(os.getenv("OPENAI_API_KEY")),
            "nvidia": bool(os.getenv("NVIDIA_API_KEY")),
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
