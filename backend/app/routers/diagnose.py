from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from app.agents.orchestrator import run_diagnosis_pipeline
from app.config import get_settings
from app.models.schemas import DiagnosisResult
from app.services.pdf import build_diagnosis_pdf

router = APIRouter(prefix="/api/diagnose", tags=["diagnose"])

# In-memory store for demo / PDF download (replace with Supabase in production)
_CASES: dict[str, DiagnosisResult] = {}


@router.post("", response_model=DiagnosisResult)
async def diagnose_plant(
    file: UploadFile = File(...),
    crop: str | None = Form(None),
    lat: float | None = Form(None),
    lon: float | None = Form(None),
) -> DiagnosisResult:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Debes subir una imagen (jpg/png/webp).")

    image_bytes = await file.read()
    if len(image_bytes) < 100:
        raise HTTPException(status_code=400, detail="Imagen vacía o inválida.")
    if len(image_bytes) > 12 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Imagen demasiado grande (máx 12MB).")

    settings = get_settings()
    result = await run_diagnosis_pipeline(
        settings,
        image_bytes,
        mime=file.content_type,
        crop_hint=crop,
        lat=lat,
        lon=lon,
    )
    _CASES[result.id] = result
    return result


@router.get("/{case_id}", response_model=DiagnosisResult)
async def get_case(case_id: str) -> DiagnosisResult:
    case = _CASES.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Caso no encontrado.")
    return case


@router.get("/{case_id}/pdf")
async def download_pdf(case_id: str) -> Response:
    case = _CASES.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Caso no encontrado.")
    pdf = build_diagnosis_pdf(case)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="agroguardian-{case_id[:8]}.pdf"'},
    )


def list_cases() -> list[DiagnosisResult]:
    return sorted(_CASES.values(), key=lambda c: c.created_at, reverse=True)
