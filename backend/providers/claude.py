# ============================================================
# CLAUDE.PY - Anthropic Claude Provider
# PromithicAI v2.0
# ============================================================

from typing import AsyncIterator
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage

from providers.base import BaseLLMProvider


class AnthropicProvider(BaseLLMProvider):
    """Anthropic Claude via langchain-anthropic."""

    name = "claude"

    def __init__(self, api_key: str, model: str):
        self.model = model
        self._client = ChatAnthropic(
            api_key=api_key,
            model=model,
            max_tokens=8192,
        )

    def _build_messages(self, system: str, messages: list[dict]):
        """Convert raw dicts to LangChain message objects."""
        lc_messages = [SystemMessage(content=system)]
        for m in messages:
            lc_messages.append(HumanMessage(content=m["content"]))
        return lc_messages

    async def chat(self, system: str, messages: list[dict]) -> str:
        result = await self._client.ainvoke(
            self._build_messages(system, messages)
        )
        return result.content

    async def stream(
        self, system: str, messages: list[dict]
    ) -> AsyncIterator[str]:
        async for chunk in self._client.astream(
            self._build_messages(system, messages)
        ):
            if chunk.content:
                yield chunk.content
