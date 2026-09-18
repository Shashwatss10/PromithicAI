# ============================================================
# AUTH.PY - Firebase ID Token Verification
# PromithicAI v2.0
# FastAPI dependency that verifies the Bearer token on every
# protected request and returns the authenticated user_id.
# ============================================================

import os
import json
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from fastapi import Request, HTTPException


def _ensure_firebase_initialized():
    """
    Initialize Firebase Admin SDK if not already done.
    Priority:
      1. FIREBASE_SERVICE_ACCOUNT env var (full JSON string) - best for Railway
      2. GOOGLE_APPLICATION_CREDENTIALS env var (path to JSON file)
      3. Application Default Credentials (GCP hosted environments)
    """
    if firebase_admin._apps:
        return  # Already initialized

    project_id = os.getenv("FIREBASE_PROJECT_ID")
    if not project_id:
        raise RuntimeError("FIREBASE_PROJECT_ID env var is not set.")

    sa_json_str = os.getenv("FIREBASE_SERVICE_ACCOUNT", "").strip()

    if sa_json_str:
        # Option 1: Service account JSON as env var string (Railway recommended)
        try:
            sa_dict = json.loads(sa_json_str)
            cred = credentials.Certificate(sa_dict)
        except Exception as e:
            raise RuntimeError(f"Failed to parse FIREBASE_SERVICE_ACCOUNT: {e}")
    else:
        # Option 2/3: File path or Application Default Credentials
        cred = credentials.ApplicationDefault()

    firebase_admin.initialize_app(cred, {"projectId": project_id})


async def get_current_user(request: Request) -> str:
    """
    FastAPI dependency: verifies Firebase Bearer token.
    Returns the authenticated uid string.

    Raises:
        401 — Authorization header missing, empty, or token invalid/expired
        503 — Firebase Admin SDK not configured (missing env vars)
    """
    # ── Step 1: Check Authorization header FIRST ─────────────
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header. Expected: Bearer <Firebase ID token>",
        )

    token = auth_header.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Empty Bearer token.")

    # ── Step 2: Ensure Firebase is initialized ────────────────
    try:
        _ensure_firebase_initialized()
    except RuntimeError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Auth service not configured: {e}",
        )

    # ── Step 3: Verify the token ──────────────────────────────
    try:
        decoded = firebase_auth.verify_id_token(token)
        return decoded["uid"]
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Token has expired. Please sign in again.")
    except firebase_auth.InvalidIdTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Auth error: {e}")
