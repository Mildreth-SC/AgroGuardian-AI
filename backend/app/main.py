from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.models.schemas import HealthResponse
from app.routers import cases, chat, diagnose, farms, weather
from app.services.store import DATA_DIR, _ensure

settings = get_settings()

app = FastAPI(
    title="AgroGuardian AI",
    description="API de sanidad vegetal — detección temprana de plagas para Manabí",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(diagnose.router)
app.include_router(weather.router)
app.include_router(chat.router)
app.include_router(cases.router)
app.include_router(farms.router)

_ensure()
app.mount("/api/media", StaticFiles(directory=str(DATA_DIR)), name="media")


@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    s = get_settings()
    return HealthResponse(
        status="ok",
        demo_mode=s.demo_mode,
        openrouter=s.has_openrouter,
        openweather=s.has_openweather,
    )


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "name": "AgroGuardian AI",
        "tagline": "Tu agrónomo inteligente disponible 24/7",
        "docs": "/docs",
    }
