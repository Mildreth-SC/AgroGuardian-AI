from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.models.schemas import HealthResponse
from app.routers import cases, chat, diagnose, weather

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
