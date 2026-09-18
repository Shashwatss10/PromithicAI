# ============================================================
# MAIN.PY - FastAPI Application Entry Point
# PromithicAI v2.0
# ============================================================

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load .env file (local dev only; Railway uses env vars directly)
load_dotenv()

# -- Firebase Admin init ------------------------------------
import firebase_admin
from firebase_admin import credentials

def init_firebase():
    """Initialize Firebase Admin SDK using project ID from env."""
    if not firebase_admin._apps:
        project_id = os.getenv("FIREBASE_PROJECT_ID")
        if not project_id:
            raise RuntimeError("FIREBASE_PROJECT_ID env var is not set.")
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {"projectId": project_id})

# -- Lifespan (startup / shutdown) --------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup tasks before accepting requests."""
    print("[PromithicAI] Starting backend v2.0...")
    try:
        init_firebase()
        print("[PromithicAI] Firebase Admin initialized.")
    except Exception as e:
        print(f"[PromithicAI] WARNING: Firebase init failed: {e}")
    yield
    print("[PromithicAI] Shutting down.")

# -- App ----------------------------------------------------
app = FastAPI(
    title="PromithicAI Backend",
    version="2.0.0",
    description="FastAPI + LangGraph backend for PromithicAI",
    lifespan=lifespan,
)

# -- CORS ---------------------------------------------------
raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5500,http://127.0.0.1:5500"
)
origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# -- Routers ------------------------------------------------
from api.health    import router as health_router
from api.models    import router as models_router
from api.generate  import router as generate_router

app.include_router(health_router,  prefix="/api")
app.include_router(models_router,  prefix="/api")
app.include_router(generate_router, prefix="/api")

# -- Root ---------------------------------------------------
@app.get("/")
async def root():
    return {
        "name":    "PromithicAI Backend",
        "version": "2.0.0",
        "docs":    "/docs",
        "health":  "/api/health",
    }
