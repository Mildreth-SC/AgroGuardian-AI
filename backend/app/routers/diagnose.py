from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response, StreamingResponse

from app.agents.orchestrator import run_diagnosis_pipeline
from app.config import get_settings
from app.models.schemas import AgentTrace, DiagnosisResult
from app.services import store
from app.services.pdf import build_diagnosis_pdf

router = APIRouter(prefix="/api/diagnose", tags=["diagnose"])


def _sse(event: str, data: dict | list) -> str:
    return f"event: {event}\ndata: {json.dumps(data, default=str, ensure_ascii=False)}\n\n"


@router.post("", response_model=DiagnosisResult)
async def diagnose_plant(
    file: UploadFile = File(...),
    crop: str | None = Form(None),
    lat: float | None = Form(None),
    lon: float | None = Form(None),
    farm_id: str | None = Form(None),
    crop_id: str | None = Form(None),
) -> DiagnosisResult:
    image_bytes, mime = await _read_image(file)
    settings = get_settings()
    result = await run_diagnosis_pipeline(
        settings,
        image_bytes,
        mime=mime,
        crop_hint=crop,
        lat=lat,
        lon=lon,
    )
    image_path = store.save_image(image_bytes, mime=mime, case_id=result.id)
    return store.persist_diagnosis(result, image_path=image_path, farm_id=farm_id, crop_id=crop_id)


@router.post("/stream")
async def diagnose_plant_stream(
    file: UploadFile = File(...),
    crop: str | None = Form(None),
    lat: float | None = Form(None),
    lon: float | None = Form(None),
    farm_id: str | None = Form(None),
    crop_id: str | None = Form(None),
) -> StreamingResponse:
    image_bytes, mime = await _read_image(file)
    settings = get_settings()

    async def event_gen() -> AsyncIterator[str]:
        queue: asyncio.Queue[AgentTrace | None] = asyncio.Queue()

        async def on_progress(trace: AgentTrace) -> None:
            await queue.put(trace)

        async def run() -> DiagnosisResult:
            try:
                return await run_diagnosis_pipeline(
                    settings,
                    image_bytes,
                    mime=mime,
                    crop_hint=crop,
                    lat=lat,
                    lon=lon,
                    on_progress=on_progress,
                )
            finally:
                await queue.put(None)

        task = asyncio.create_task(run())
        while True:
            item = await queue.get()
            if item is None:
                break
            yield _sse("progress", item.model_dump(mode="json"))

        try:
            result = await task
        except Exception as exc:
            yield _sse("error", {"detail": str(exc)})
            return

        image_path = store.save_image(image_bytes, mime=mime, case_id=result.id)
        result = store.persist_diagnosis(
            result, image_path=image_path, farm_id=farm_id, crop_id=crop_id
        )
        yield _sse("result", result.model_dump(mode="json"))

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/{case_id}", response_model=DiagnosisResult)
async def get_case(case_id: str) -> DiagnosisResult:
    case = store.get_detection(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Caso no encontrado.")
    return DiagnosisResult.model_validate(case)


@router.get("/{case_id}/pdf")
async def download_pdf(case_id: str) -> Response:
    raw = store.get_detection(case_id)
    if not raw:
        raise HTTPException(status_code=404, detail="Caso no encontrado.")
    case = DiagnosisResult.model_validate(raw)
    pdf = build_diagnosis_pdf(case)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="agroguardian-{case_id[:8]}.pdf"'},
    )


async def _read_image(file: UploadFile) -> tuple[bytes, str]:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Debes subir una imagen (jpg/png/webp).")
    image_bytes = await file.read()
    if len(image_bytes) < 100:
        raise HTTPException(status_code=400, detail="Imagen vacía o inválida.")
    if len(image_bytes) > 12 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Imagen demasiado grande (máx 12MB).")
    return image_bytes, file.content_type
