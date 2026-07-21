from fastapi import APIRouter

from app.models.schemas import DiagnosisResult
from app.routers.diagnose import list_cases

router = APIRouter(prefix="/api/cases", tags=["cases"])


@router.get("", response_model=list[DiagnosisResult])
async def get_cases() -> list[DiagnosisResult]:
    return list_cases()
