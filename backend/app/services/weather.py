from __future__ import annotations

import httpx

from app.config import Settings
from app.models.schemas import RiskLevel, WeatherSnapshot


def _risk_from_humidity_rain(humidity: float, rain_mm: float) -> RiskLevel:
    if humidity >= 85 or rain_mm >= 15:
        return RiskLevel.ALTO
    if humidity >= 70 or rain_mm >= 5:
        return RiskLevel.MEDIO
    return RiskLevel.BAJO


async def fetch_weather(
    settings: Settings,
    lat: float | None = None,
    lon: float | None = None,
) -> WeatherSnapshot:
    lat = lat if lat is not None else settings.default_lat
    lon = lon if lon is not None else settings.default_lon

    if settings.has_openweather:
        try:
            return await _from_openweather(settings, lat, lon)
        except Exception:
            pass

    return await _from_open_meteo(lat, lon)


async def _from_openweather(settings: Settings, lat: float, lon: float) -> WeatherSnapshot:
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": settings.openweather_api_key,
        "units": "metric",
        "lang": "es",
    }
    async with httpx.AsyncClient(timeout=20) as client:
        res = await client.get(url, params=params)
        res.raise_for_status()
        data = res.json()

    temp = float(data["main"]["temp"])
    humidity = float(data["main"]["humidity"])
    rain = float((data.get("rain") or {}).get("1h", 0) or 0)
    wind = float(data.get("wind", {}).get("speed", 0)) * 3.6
    condition = (data.get("weather") or [{"description": "n/d"}])[0]["description"]

    return WeatherSnapshot(
        temperature_c=round(temp, 1),
        humidity_pct=round(humidity, 1),
        rain_mm=round(rain, 1),
        wind_kmh=round(wind, 1),
        condition=condition.capitalize(),
        climate_risk=_risk_from_humidity_rain(humidity, rain),
        source="openweather",
        location=data.get("name") or "Manabí, Ecuador",
    )


async def _from_open_meteo(lat: float, lon: float) -> WeatherSnapshot:
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code",
        "timezone": "America/Guayaquil",
    }
    async with httpx.AsyncClient(timeout=20) as client:
        res = await client.get(url, params=params)
        res.raise_for_status()
        data = res.json()

    current = data.get("current") or {}
    temp = float(current.get("temperature_2m") or 28)
    humidity = float(current.get("relative_humidity_2m") or 80)
    rain = float(current.get("precipitation") or 0)
    wind = float(current.get("wind_speed_10m") or 5)

    return WeatherSnapshot(
        temperature_c=round(temp, 1),
        humidity_pct=round(humidity, 1),
        rain_mm=round(rain, 1),
        wind_kmh=round(wind, 1),
        condition=_weather_code_label(int(current.get("weather_code") or 0)),
        climate_risk=_risk_from_humidity_rain(humidity, rain),
        source="open-meteo",
        location="Manabí, Ecuador",
    )


def _weather_code_label(code: int) -> str:
    mapping = {
        0: "Despejado",
        1: "Mayormente despejado",
        2: "Parcialmente nublado",
        3: "Nublado",
        45: "Neblina",
        51: "Llovizna ligera",
        61: "Lluvia ligera",
        63: "Lluvia moderada",
        65: "Lluvia intensa",
        80: "Chubascos",
        95: "Tormenta",
    }
    return mapping.get(code, "Condición variable")


def demo_weather() -> WeatherSnapshot:
    return WeatherSnapshot(
        temperature_c=28.4,
        humidity_pct=87.0,
        rain_mm=6.2,
        wind_kmh=12.0,
        condition="Humedad alta / chubascos",
        climate_risk=RiskLevel.ALTO,
        source="demo",
        location="Portoviejo, Manabí",
    )
