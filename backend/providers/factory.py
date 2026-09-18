# ============================================================
# FACTORY.PY - Provider Factory + Model Allowlist
# PromithicAI v2.0
# Single source of truth for all provider/model configuration.
# ============================================================

import os
from providers.base import BaseLLMProvider
from providers.claude import AnthropicProvider
from providers.openai_provider import OpenAIProvider
from providers.nvidia import NVIDIAProvider


# ── Model configuration (authoritative server-side allowlist) ──
PROVIDER_CONFIG: dict = {
    "claude": {
        "display_name":  "Anthropic - Claude",
        "default_model": "claude-3-5-sonnet-20241022",
        "env_key":       "ANTHROPIC_API_KEY",
        "models": [
            {"id": "claude-3-5-sonnet-20241022", "display": "Claude 3.5 Sonnet"},
            {"id": "claude-3-5-haiku-20241022",  "display": "Claude 3.5 Haiku"},
            {"id": "claude-3-opus-20240229",      "display": "Claude 3 Opus"},
        ],
    },
    "openai": {
        "display_name":  "OpenAI - GPT",
        "default_model": "gpt-4o-mini",
        "env_key":       "OPENAI_API_KEY",
        "models": [
            {"id": "gpt-4o-mini",  "display": "GPT-4o Mini"},
            {"id": "gpt-4o",       "display": "GPT-4o"},
            {"id": "gpt-4-turbo",  "display": "GPT-4 Turbo"},
        ],
    },
    "nvidia": {
        "display_name":  "NVIDIA - NIM",
        "default_model": "meta/llama-3.1-70b-instruct",
        "env_key":       "NVIDIA_API_KEY",
        "models": [
            {"id": "meta/llama-3.1-70b-instruct",      "display": "Llama 3.1 70B"},
            {"id": "nvidia/nemotron-4-340b-instruct",   "display": "Nemotron 4 340B"},
            {"id": "meta/llama-3.1-405b-instruct",      "display": "Llama 3.1 405B"},
            {"id": "mistralai/mixtral-8x22b-instruct",  "display": "Mixtral 8x22B"},
        ],
    },
}


def get_allowed_model_ids(provider: str) -> list[str]:
    """Return all valid model IDs for a given provider."""
    config = PROVIDER_CONFIG.get(provider)
    if not config:
        return []
    return [m["id"] for m in config["models"]]


def validate_provider_model(provider: str, model: str) -> tuple[bool, str]:
    """
    Validate that a provider/model pair is supported.
    Returns (is_valid, error_message).
    """
    if provider not in PROVIDER_CONFIG:
        return False, f"Unknown provider '{provider}'. Supported: {list(PROVIDER_CONFIG.keys())}"

    return True, ""


def resolve_api_key(provider: str, user_key: str | None) -> str:
    """
    Resolve which API key to use.
    Priority: user BYOK key > server env key > raise error.
    """
    if user_key and user_key.strip():
        return user_key.strip()

    config = PROVIDER_CONFIG.get(provider, {})
    env_key_name = config.get("env_key", "")
    server_key = os.getenv(env_key_name, "").strip()

    if server_key:
        return server_key

    raise ValueError(
        f"No API key available for provider '{provider}'. "
        f"Please connect your {provider.upper()} API key in Settings."
    )


def get_provider(
    provider: str,
    model: str,
    user_key: str | None = None,
) -> BaseLLMProvider:
    """
    Factory function. Returns the correct provider instance.

    Args:
        provider: "claude" | "openai" | "nvidia"
        model:    Must be in the provider allowlist
        user_key: Optional BYOK key from request
    
    Raises:
        ValueError: If provider/model is invalid or no key available
    """
    # Validate
    valid, err = validate_provider_model(provider, model)
    if not valid:
        raise ValueError(err)

    # Default model if empty
    if not model:
        model = PROVIDER_CONFIG[provider]["default_model"]

    # Resolve key
    api_key = resolve_api_key(provider, user_key)

    # Instantiate
    if provider == "claude":
        return AnthropicProvider(api_key=api_key, model=model)
    elif provider == "openai":
        return OpenAIProvider(api_key=api_key, model=model)
    elif provider == "nvidia":
        return NVIDIAProvider(api_key=api_key, model=model)
    else:
        raise ValueError(f"No provider class for '{provider}'")
