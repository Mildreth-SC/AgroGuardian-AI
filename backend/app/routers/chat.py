from fastapi import APIRouter

from app.config import get_settings
from app.models.schemas import ChatRequest, ChatResponse
from app.services import openrouter, weather as weather_service

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat_assistant(body: ChatRequest) -> ChatResponse:
    settings = get_settings()
    climate = weather_service.demo_weather()
    try:
        climate = await weather_service.fetch_weather(settings)
    except Exception:
        pass

    sources = [f"Clima ({climate.source})", "Historial de finca (demo)"]

    if settings.demo_mode and not settings.has_openrouter:
        reply = (
            f"Respecto a «{body.message}»: con humedad del {climate.humidity_pct}% y "
            f"condición «{climate.condition}» en {climate.location}, el riesgo climático "
            f"es {climate.climate_risk.value}. "
            "Si planeas fertilizar o sembrar, espera 48h si se esperan lluvias intensas "
            "para evitar lavado de nutrientes y estrés en plántulas. "
            "(Modo demo — configura OPENROUTER_API_KEY para respuestas GPT-4o.)"
        )
        return ChatResponse(reply=reply, sources=sources, demo=True)

    system = (
        "Eres AgroGuardian AI, el copiloto del agricultor en Manabí, Ecuador. "
        "Responde en español, claro y práctico. Usa el clima y contexto dados. "
        "Si hay incertidumbre, dilo. No inventes pesticidas ilegales."
    )
    context = (
        f"Provincia: {body.province}. Cultivo: {body.crop or 'no especificado'}. "
        f"Clima: {climate.model_dump_json()}"
    )
    messages = [{"role": "system", "content": system + "\n" + context}]
    for m in body.history[-8:]:
        messages.append({"role": m.role, "content": m.content})
    messages.append({"role": "user", "content": body.message})

    reply = await openrouter.chat_completion(settings, messages)
    sources.append("GPT-4o vía OpenRouter")
    return ChatResponse(reply=reply, sources=sources, demo=False)
