from __future__ import annotations

import asyncio
import time
import uuid
from collections.abc import Awaitable, Callable
from datetime import datetime, timezone

from app.config import Settings
from app.models.schemas import (
    AgentTrace,
    DiagnosisResult,
    DiseaseDetection,
    FollowUpPlan,
    Recommendation,
    RiskLevel,
    WeatherSnapshot,
)
from app.services import openrouter, weather as weather_service

ProgressCallback = Callable[[AgentTrace], Awaitable[None]]

VISION_PROMPT = """Eres un detector de enfermedades vegetales para cultivos de Manabí, Ecuador
(plátano, cacao, maíz, café, arroz). Analiza la imagen de la hoja/planta.

Responde SOLO JSON válido con esta forma:
{
  "disease": "nombre de la enfermedad o 'Sano'",
  "crop": "cultivo probable",
  "confidence": 0.0 a 1.0,
  "affected_part": "hoja|tallo|fruto|raiz",
  "risk_level": "bajo|medio|alto|critico",
  "rationale": "explicación breve en español de señales visuales"
}
"""


async def run_diagnosis_pipeline(
    settings: Settings,
    image_bytes: bytes,
    *,
    mime: str = "image/jpeg",
    crop_hint: str | None = None,
    lat: float | None = None,
    lon: float | None = None,
    on_progress: ProgressCallback | None = None,
) -> DiagnosisResult:
    traces: list[AgentTrace] = []
    use_demo = settings.demo_mode and not settings.has_openrouter

    async def emit(trace: AgentTrace) -> None:
        traces.append(trace)
        if on_progress:
            await on_progress(trace)

    # Agent 1 — Disease Detector
    if on_progress:
        await on_progress(
            AgentTrace(
                agent="Disease Detector",
                status="running",
                summary="Analizando imagen con visión IA…",
                duration_ms=0,
            )
        )
    t0 = time.perf_counter()
    if use_demo:
        await asyncio.sleep(0.45)
        detection = _demo_detection(crop_hint)
        await emit(
            AgentTrace(
                agent="Disease Detector",
                status="demo",
                summary=f"Detección simulada: {detection.disease} ({detection.confidence:.0%})",
                duration_ms=int((time.perf_counter() - t0) * 1000),
                data=detection.model_dump(),
            )
        )
    else:
        prompt = VISION_PROMPT
        if crop_hint:
            prompt += f"\nEl agricultor indica que el cultivo es: {crop_hint}."
        raw = await openrouter.vision_analyze(settings, image_bytes, prompt, mime=mime)
        payload = openrouter.extract_json(raw)
        detection = DiseaseDetection(
            disease=str(payload.get("disease", "Desconocido")),
            crop=str(payload.get("crop") or crop_hint or "Desconocido"),
            confidence=float(payload.get("confidence", 0.5)),
            affected_part=str(payload.get("affected_part", "hoja")),
            risk_level=RiskLevel(str(payload.get("risk_level", "medio")).lower()),
            rationale=str(payload.get("rationale", "")),
        )
        await emit(
            AgentTrace(
                agent="Disease Detector",
                status="ok",
                summary=f"{detection.disease} · {detection.confidence:.0%}",
                duration_ms=int((time.perf_counter() - t0) * 1000),
                data=detection.model_dump(),
            )
        )

    # Agent 2 — Climate Agent
    if on_progress:
        await on_progress(
            AgentTrace(
                agent="Climate Agent",
                status="running",
                summary="Consultando clima local…",
                duration_ms=0,
            )
        )
    t1 = time.perf_counter()
    try:
        climate = await weather_service.fetch_weather(settings, lat, lon)
        status = "ok"
    except Exception:
        climate = weather_service.demo_weather()
        status = "fallback-demo"
    if use_demo:
        await asyncio.sleep(0.35)
    await emit(
        AgentTrace(
            agent="Climate Agent",
            status=status,
            summary=(
                f"{climate.condition} · {climate.humidity_pct}% humedad · "
                f"riesgo {climate.climate_risk.value}"
            ),
            duration_ms=int((time.perf_counter() - t1) * 1000),
            data=climate.model_dump(),
        )
    )

    # Agent 3 — Agronomist
    if on_progress:
        await on_progress(
            AgentTrace(
                agent="Agronomist",
                status="running",
                summary="Generando diagnóstico y plan de acción…",
                duration_ms=0,
            )
        )
    t2 = time.perf_counter()
    if use_demo:
        await asyncio.sleep(0.4)
        diagnosis, recommendations, follow_up = _demo_agronomist(detection, climate)
        await emit(
            AgentTrace(
                agent="Agronomist",
                status="demo",
                summary="Diagnóstico y plan de acción generados en modo demo",
                duration_ms=int((time.perf_counter() - t2) * 1000),
            )
        )
    else:
        diagnosis, recommendations, follow_up = await _llm_agronomist(
            settings, detection, climate
        )
        await emit(
            AgentTrace(
                agent="Agronomist",
                status="ok",
                summary="Diagnóstico contextualizado con clima e historial local",
                duration_ms=int((time.perf_counter() - t2) * 1000),
            )
        )

    # Agent 4 — Report Agent
    if on_progress:
        await on_progress(
            AgentTrace(
                agent="Report Agent",
                status="running",
                summary="Empaquetando caso y preparando PDF…",
                duration_ms=0,
            )
        )
    if use_demo:
        await asyncio.sleep(0.25)
    await emit(
        AgentTrace(
            agent="Report Agent",
            status="ok",
            summary="Caso empaquetado para historial y PDF",
            duration_ms=5,
            data={"recommendations": len(recommendations)},
        )
    )

    # Keep only final traces (drop intermediate "running" from result)
    final_traces = [t for t in traces if t.status != "running"]

    return DiagnosisResult(
        id=str(uuid.uuid4()),
        created_at=datetime.now(timezone.utc),
        detection=detection,
        weather=climate,
        diagnosis=diagnosis,
        recommendations=recommendations,
        follow_up=follow_up,
        agent_trace=final_traces,
        demo=use_demo,
    )


def _demo_detection(crop_hint: str | None) -> DiseaseDetection:
    return DiseaseDetection(
        disease="Sigatoka Negra",
        crop=crop_hint or "Plátano",
        confidence=0.94,
        affected_part="hoja",
        risk_level=RiskLevel.ALTO,
        rationale=(
            "Manchas necróticas alargadas con borde amarillo en el limbo foliar, "
            "patrón típico de Mycosphaerella fijiensis en plátano."
        ),
    )


def _demo_agronomist(
    detection: DiseaseDetection,
    climate: WeatherSnapshot,
) -> tuple[str, list[Recommendation], FollowUpPlan]:
    diagnosis = (
        f"Encontramos una alta probabilidad de {detection.disease} "
        f"({detection.confidence:.0%}) en {detection.crop}. "
        f"Las señales visuales indican afectación en {detection.affected_part}. "
        f"Debido a la humedad registrada ({climate.humidity_pct}%) y la condición "
        f"«{climate.condition}», existe un alto riesgo de propagación en las próximas 48–72 h."
    )
    recommendations = [
        Recommendation(
            title="Eliminar hojas afectadas",
            detail="Retirar y destruir hojas con lesiones activas fuera del lote.",
            priority=1,
            timeframe="hoy",
        ),
        Recommendation(
            title="Evitar riego por aspersión",
            detail="La humedad foliar favorece la esporulación; suspender riego aéreo hoy.",
            priority=1,
            timeframe="24h",
        ),
        Recommendation(
            title="Aplicar fungicida recomendado",
            detail="Aplicar en focos afectados según etiqueta local (consulta técnica MAG).",
            priority=2,
            timeframe="48h",
        ),
        Recommendation(
            title="Monitorear lote vecino",
            detail="Inspeccionar plantas adyacentes y registrar nuevos síntomas.",
            priority=2,
            timeframe="72h",
        ),
    ]
    follow_up = FollowUpPlan(
        check_in_hours=72,
        steps=[
            "Tomar nueva foto de la misma planta en 72 horas",
            "Registrar si aparecen manchas nuevas",
            "Actualizar clima y ajustar tratamiento",
        ],
    )
    return diagnosis, recommendations, follow_up


async def _llm_agronomist(
    settings: Settings,
    detection: DiseaseDetection,
    climate: WeatherSnapshot,
) -> tuple[str, list[Recommendation], FollowUpPlan]:
    prompt = f"""Eres un agrónomo experto en Manabí, Ecuador. Genera un diagnóstico accionable.

Detección:
{detection.model_dump_json()}

Clima actual:
{climate.model_dump_json()}

Responde SOLO JSON:
{{
  "diagnosis": "texto en español (3-5 oraciones) explicando hallazgo + clima + riesgo",
  "recommendations": [
    {{"title": "...", "detail": "...", "priority": 1, "timeframe": "hoy|24h|48h|72h"}}
  ],
  "follow_up": {{
    "check_in_hours": 72,
    "steps": ["...", "..."]
  }}
}}
Máximo 4 recomendaciones, concretas y seguras para pequeños productores.
"""
    raw = await openrouter.chat_completion(
        settings,
        [
            {"role": "system", "content": "Eres AgroGuardian, agrónomo IA. Responde solo JSON."},
            {"role": "user", "content": prompt},
        ],
    )
    data = openrouter.extract_json(raw)
    recommendations = [Recommendation(**r) for r in data.get("recommendations", [])]
    follow = FollowUpPlan(**(data.get("follow_up") or {}))
    return str(data.get("diagnosis", "")), recommendations, follow
