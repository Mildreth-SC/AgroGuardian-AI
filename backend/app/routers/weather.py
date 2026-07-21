from fastapi import APIRouter, Query

from app.config import get_settings
from app.models.schemas import WeatherSnapshot
from app.services import weather as weather_service

router = APIRouter(prefix="/api/weather", tags=["weather"])


@router.get("", response_model=WeatherSnapshot)
async def get_weather(
    lat: float | None = Query(None),
    lon: float | None = Query(None),
) -> WeatherSnapshot:
    settings = get_settings()
    try:
        return await weather_service.fetch_weather(settings, lat, lon)
    except Exception:
        return weather_service.demo_weather()
