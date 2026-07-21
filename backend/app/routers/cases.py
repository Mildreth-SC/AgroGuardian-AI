from __future__ import annotations

from fastapi import APIRouter

from app.models.schemas import DiagnosisResult
from app.services import store

router = APIRouter(prefix="/api/cases", tags=["cases"])


@router.get("", response_model=list[DiagnosisResult])
async def get_cases() -> list[DiagnosisResult]:
    out: list[DiagnosisResult] = []
    for raw in store.list_detections():
        try:
            out.append(DiagnosisResult.model_validate(raw))
        except Exception:
            continue
    return out
