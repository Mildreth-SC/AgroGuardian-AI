from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.config import get_settings
from app.models.schemas import DiagnosisResult

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
STORE_PATH = DATA_DIR / "store.json"

DEFAULT_STORE: dict[str, Any] = {
    "farms": [
        {
            "id": "f1",
            "name": "Finca El Guabo",
            "lat": -1.0547,
            "lng": -80.4545,
            "area_ha": 6.5,
            "health_status": "riesgo",
            "owner_id": "demo",
            "created_at": "2026-07-01T10:00:00Z",
        },
        {
            "id": "f2",
            "name": "Lote Río Chico",
            "lat": -1.072,
            "lng": -80.42,
            "area_ha": 3.2,
            "health_status": "sano",
            "owner_id": "demo",
            "created_at": "2026-07-01T10:00:00Z",
        },
        {
            "id": "f3",
            "name": "Parcela Calceta",
            "lat": -0.845,
            "lng": -80.163,
            "area_ha": 2.1,
            "health_status": "infectado",
            "owner_id": "demo",
            "created_at": "2026-07-01T10:00:00Z",
        },
    ],
    "crops": [
        {
            "id": "c1",
            "farm_id": "f1",
            "name": "Plátano Barraganete",
            "variety": "Barraganete",
            "growth_stage": "Floración",
            "health_pct": 72,
            "status": "riesgo",
            "hectares": 3.2,
        },
        {
            "id": "c2",
            "farm_id": "f1",
            "name": "Cacao Nacional",
            "variety": "Nacional",
            "growth_stage": "Producción",
            "health_pct": 91,
            "status": "sano",
            "hectares": 2.0,
        },
        {
            "id": "c3",
            "farm_id": "f2",
            "name": "Maíz duro",
            "variety": "INIAP",
            "growth_stage": "Vegetativo",
            "health_pct": 88,
            "status": "sano",
            "hectares": 1.5,
        },
        {
            "id": "c4",
            "farm_id": "f3",
            "name": "Café arábiga",
            "variety": "Arábiga",
            "growth_stage": "Crecimiento",
            "health_pct": 64,
            "status": "infectado",
            "hectares": 0.8,
        },
    ],
    "detections": [],
}


def _ensure() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    if not STORE_PATH.exists():
        STORE_PATH.write_text(json.dumps(DEFAULT_STORE, indent=2, ensure_ascii=False), encoding="utf-8")


def load_store() -> dict[str, Any]:
    _ensure()
    return json.loads(STORE_PATH.read_text(encoding="utf-8"))


def save_store(store: dict[str, Any]) -> None:
    _ensure()
    STORE_PATH.write_text(json.dumps(store, indent=2, ensure_ascii=False, default=str), encoding="utf-8")


def save_image(image_bytes: bytes, *, mime: str = "image/jpeg", case_id: str | None = None) -> str:
    _ensure()
    ext = "jpg" if "jpeg" in mime else mime.split("/")[-1] or "jpg"
    name = f"{case_id or uuid.uuid4()}.{ext}"
    path = UPLOADS_DIR / name
    path.write_bytes(image_bytes)
    return str(path.relative_to(DATA_DIR)).replace("\\", "/")


def persist_diagnosis(
    result: DiagnosisResult,
    *,
    image_path: str | None = None,
    farm_id: str | None = None,
    crop_id: str | None = None,
) -> DiagnosisResult:
    store = load_store()
    record = result.model_dump(mode="json")
    record["image_path"] = image_path
    record["farm_id"] = farm_id
    record["crop_id"] = crop_id
    store.setdefault("detections", []).insert(0, record)

    # Update farm/crop health from risk
    risk = result.detection.risk_level.value
    status = "sano"
    if risk in ("alto", "critico"):
        status = "infectado"
    elif risk == "medio":
        status = "riesgo"

    if farm_id:
        for f in store.get("farms", []):
            if f["id"] == farm_id:
                f["health_status"] = status
    if crop_id:
        for c in store.get("crops", []):
            if c["id"] == crop_id:
                c["status"] = status
                c["health_pct"] = max(40, int(100 - result.detection.confidence * 45))

    save_store(store)

    # Best-effort Supabase sync
    try:
        _sync_supabase(record)
    except Exception:
        pass

    return DiagnosisResult.model_validate(record)


def list_detections() -> list[dict[str, Any]]:
    return load_store().get("detections", [])


def get_detection(case_id: str) -> dict[str, Any] | None:
    for d in list_detections():
        if d.get("id") == case_id:
            return d
    return None


def list_farms() -> list[dict[str, Any]]:
    return load_store().get("farms", [])


def list_crops() -> list[dict[str, Any]]:
    return load_store().get("crops", [])


def create_farm(payload: dict[str, Any]) -> dict[str, Any]:
    store = load_store()
    farm = {
        "id": str(uuid.uuid4()),
        "name": payload["name"],
        "lat": float(payload.get("lat", -1.0547)),
        "lng": float(payload.get("lng", -80.4545)),
        "area_ha": float(payload.get("area_ha", 1)),
        "health_status": "sano",
        "owner_id": payload.get("owner_id", "demo"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    store.setdefault("farms", []).append(farm)
    save_store(store)
    return farm


def create_crop(payload: dict[str, Any]) -> dict[str, Any]:
    store = load_store()
    crop = {
        "id": str(uuid.uuid4()),
        "farm_id": payload["farm_id"],
        "name": payload["name"],
        "variety": payload.get("variety", ""),
        "growth_stage": payload.get("growth_stage", "Desarrollo"),
        "health_pct": int(payload.get("health_pct", 90)),
        "status": "sano",
        "hectares": float(payload.get("hectares", 1)),
    }
    store.setdefault("crops", []).append(crop)
    save_store(store)
    return crop


def _sync_supabase(record: dict[str, Any]) -> None:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        return
    from supabase import create_client

    client = create_client(settings.supabase_url, settings.supabase_service_role_key)
    client.table("detections").upsert(
        {
            "id": record["id"],
            "owner_id": "demo",
            "disease": record["detection"]["disease"],
            "confidence": record["detection"]["confidence"],
            "risk_level": record["detection"]["risk_level"],
            "affected_part": record["detection"].get("affected_part"),
            "rationale": record["detection"].get("rationale"),
            "agent_trace": record.get("agent_trace", []),
        }
    ).execute()
