from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services import store

router = APIRouter(prefix="/api", tags=["farms"])


class FarmCreate(BaseModel):
    name: str = Field(min_length=1)
    lat: float = -1.0547
    lng: float = -80.4545
    area_ha: float = 1.0
    owner_id: str = "demo"


class CropCreate(BaseModel):
    farm_id: str
    name: str = Field(min_length=1)
    variety: str = ""
    growth_stage: str = "Desarrollo"
    health_pct: int = 90
    hectares: float = 1.0


@router.get("/farms")
async def get_farms() -> list[dict[str, Any]]:
    return store.list_farms()


@router.post("/farms", status_code=201)
async def post_farm(body: FarmCreate) -> dict[str, Any]:
    return store.create_farm(body.model_dump())


@router.get("/crops")
async def get_crops(farm_id: str | None = None) -> list[dict[str, Any]]:
    crops = store.list_crops()
    if farm_id:
        return [c for c in crops if c.get("farm_id") == farm_id]
    return crops


@router.post("/crops", status_code=201)
async def post_crop(body: CropCreate) -> dict[str, Any]:
    farms = {f["id"] for f in store.list_farms()}
    if body.farm_id not in farms:
        raise HTTPException(status_code=400, detail="farm_id no existe")
    return store.create_crop(body.model_dump())
