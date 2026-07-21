from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    BAJO = "bajo"
    MEDIO = "medio"
    ALTO = "alto"
    CRITICO = "critico"


class DiseaseDetection(BaseModel):
    disease: str
    crop: str = "Plátano"
    confidence: float = Field(ge=0, le=1)
    affected_part: str = "hoja"
    risk_level: RiskLevel = RiskLevel.MEDIO
    rationale: str = ""


class WeatherSnapshot(BaseModel):
    temperature_c: float
    humidity_pct: float
    rain_mm: float
    wind_kmh: float
    condition: str
    climate_risk: RiskLevel
    source: str = "open-meteo"
    location: str = "Manabí, Ecuador"


class Recommendation(BaseModel):
    title: str
    detail: str
    priority: int = 1
    timeframe: str = "inmediato"


class FollowUpPlan(BaseModel):
    check_in_hours: int = 72
    steps: list[str] = Field(default_factory=list)


class AgentTrace(BaseModel):
    agent: str
    status: str
    summary: str
    duration_ms: int = 0
    data: dict[str, Any] = Field(default_factory=dict)


class DiagnosisResult(BaseModel):
    id: str
    created_at: datetime
    detection: DiseaseDetection
    weather: WeatherSnapshot
    diagnosis: str
    recommendations: list[Recommendation]
    follow_up: FollowUpPlan
    agent_trace: list[AgentTrace]
    demo: bool = False


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = Field(default_factory=list)
    crop: str | None = None
    province: str = "Manabí"


class ChatResponse(BaseModel):
    reply: str
    sources: list[str] = Field(default_factory=list)
    demo: bool = False


class HealthResponse(BaseModel):
    status: str
    demo_mode: bool
    openrouter: bool
    openweather: bool
