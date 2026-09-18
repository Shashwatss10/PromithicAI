# ============================================================
# NVIDIA.PY - NVIDIA NIM Provider (Direct AsyncOpenAI)
# PromithicAI v2.0
# ============================================================

from typing import AsyncIterator
from openai import AsyncOpenAI
from providers.base import BaseLLMProvider

NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"


class NVIDIAProvider(BaseLLMProvider):
    """
    NVIDIA NIM via official AsyncOpenAI SDK client.
    Points to NVIDIA NIM OpenAI-compatible endpoint.
    """

    name = "nvidia"

    def __init__(self, api_key: str, model: str):
        self.model = model or "meta/llama-3.1-70b-instruct"
        clean_key = (api_key or "").strip()
        self.client = AsyncOpenAI(
            api_key=clean_key,
            base_url=NVIDIA_BASE_URL,
        )

    def _format_messages(self, system: str, messages: list[dict]):
        msgs = [{"role": "system", "content": system}]
        for m in messages:
            msgs.append({
                "role": m.get("role", "user"),
                "content": m.get("content", "")
            })
        return msgs

    async def chat(self, system: str, messages: list[dict]) -> str:
        msgs = self._format_messages(system, messages)
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=msgs,
            max_tokens=4096,
            temperature=0.2,
        )
        return response.choices[0].message.content or ""

    async def stream(
        self, system: str, messages: list[dict]
    ) -> AsyncIterator[str]:
        msgs = self._format_messages(system, messages)
        stream_resp = await self.client.chat.completions.create(
            model=self.model,
            messages=msgs,
            max_tokens=4096,
            temperature=0.2,
            stream=True,
        )
        async for chunk in stream_resp:
            if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
