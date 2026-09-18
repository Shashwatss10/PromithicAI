# ============================================================
# BASE.PY - Abstract LLM Provider Interface
# PromithicAI v2.0
# ============================================================

from abc import ABC, abstractmethod
from typing import AsyncIterator


class BaseLLMProvider(ABC):
    """
    All LLM providers (Claude, OpenAI, NVIDIA NIM) implement
    this interface. The rest of the app only talks to this class.
    """
    name:  str   # "claude" | "openai" | "nvidia"
    model: str   # e.g. "claude-3-5-sonnet-20241022"

    @abstractmethod
    async def chat(self, system: str, messages: list[dict]) -> str:
        """
        Single-shot completion. Returns the full response string.
        Args:
            system:   System prompt for the agent role
            messages: List of dicts with 'role' and 'content'
        """
        ...

    @abstractmethod
    async def stream(
        self, system: str, messages: list[dict]
    ) -> AsyncIterator[str]:
        """
        Streaming completion. Yields token strings as they arrive.
        Args:
            system:   System prompt for the agent role
            messages: List of dicts with 'role' and 'content'
        """
        ...
