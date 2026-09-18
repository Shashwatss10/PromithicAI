# ============================================================
# SUPABASE_CLIENT.PY - Supabase Build Persistence
# PromithicAI v2.0
# Saves completed builds to Supabase using the service-role
# key (bypasses Row Level Security — safe because we verify
# the Firebase token before calling this).
# ============================================================

import os
import uuid
import httpx
from datetime import datetime, timezone


def _get_supabase_config() -> tuple[str, str]:
    """Load and validate Supabase env vars."""
    url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    key = os.getenv("SUPABASE_SERVICE_KEY", "").strip()

    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set to save builds."
        )
    return url, key


async def save_build(
    user_id:  str,
    prompt:   str,
    code:     str,
    provider: str,
    model:    str,
) -> dict:
    """
    Save a completed build to Supabase.
    Returns the saved record dict on success.
    Raises RuntimeError on failure.
    """
    supabase_url, service_key = _get_supabase_config()

    record = {
        "id":         str(uuid.uuid4()),
        "user_id":    user_id,
        "prompt":     prompt,
        "code":       code,
        "provider":   provider,
        "model":      model,
        "template":   "custom",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    headers = {
        "apikey":        service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type":  "application/json",
        "Prefer":        "return=minimal",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            f"{supabase_url}/rest/v1/builds",
            headers=headers,
            json=record,
        )

    if response.status_code not in (200, 201):
        raise RuntimeError(
            f"Supabase save failed [{response.status_code}]: {response.text}"
        )

    return record
