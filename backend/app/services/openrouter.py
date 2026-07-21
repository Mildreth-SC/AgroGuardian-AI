from __future__ import annotations

import base64
import json
import re
from typing import Any

from openai import AsyncOpenAI

from app.config import Settings


def get_openrouter_client(settings: Settings) -> AsyncOpenAI | None:
    if not settings.has_openrouter:
        return None
    return AsyncOpenAI(
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
    )


async def chat_completion(
    settings: Settings,
    messages: list[dict[str, Any]],
    *,
    temperature: float = 0.2,
    max_tokens: int = 1200,
) -> str:
    client = get_openrouter_client(settings)
    if client is None:
        raise RuntimeError("OpenRouter API key not configured")

    response = await client.chat.completions.create(
        model=settings.openrouter_model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return (response.choices[0].message.content or "").strip()


async def vision_analyze(
    settings: Settings,
    image_bytes: bytes,
    prompt: str,
    *,
    mime: str = "image/jpeg",
) -> str:
    b64 = base64.b64encode(image_bytes).decode("ascii")
    data_url = f"data:{mime};base64,{b64}"
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": data_url}},
            ],
        }
    ]
    return await chat_completion(settings, messages, temperature=0.1, max_tokens=800)


def extract_json(text: str) -> dict[str, Any]:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        return json.loads(fence.group(1).strip())

    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        return json.loads(text[start : end + 1])

    raise ValueError(f"Could not parse JSON from model response: {text[:200]}")
