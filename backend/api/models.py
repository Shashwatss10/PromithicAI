# ============================================================
# MODELS.PY - GET /api/models
# PromithicAI v2.0
# Returns provider + model list for the Settings dropdown.
# Public endpoint - no auth required.
# ============================================================

import os
from fastapi import APIRouter
from providers.factory import PROVIDER_CONFIG

router = APIRouter()


@router.get("/models")
async def get_models():
    """
    Returns all configured providers, their default models,
    and full model lists for the Settings page dropdown.
    Does NOT expose API keys or secrets.
    """
    result = {}

    for provider_id, config in PROVIDER_CONFIG.items():
        env_key_name = config.get("env_key", "")
        has_server_key = bool(os.getenv(env_key_name, "").strip())

        result[provider_id] = {
            "display_name":  config["display_name"],
            "default_model": config["default_model"],
            "has_server_key": has_server_key,
            "models": config["models"],
        }

    return {
        "providers": result,
        "supported_providers": list(PROVIDER_CONFIG.keys()),
    }
