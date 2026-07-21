export type RiskLevel = "bajo" | "medio" | "alto" | "critico";

export type DiseaseDetection = {
  disease: string;
  crop: string;
  confidence: number;
  affected_part: string;
  risk_level: RiskLevel;
  rationale: string;
  alternatives?: { disease: string; confidence: number }[];
};

export type WeatherSnapshot = {
  temperature_c: number;
  humidity_pct: number;
  rain_mm: number;
  wind_kmh: number;
  condition: string;
  climate_risk: RiskLevel;
  source: string;
  location: string;
};

export type Recommendation = {
  title: string;
  detail: string;
  priority: number;
  timeframe: string;
};

export type FollowUpPlan = {
  check_in_hours: number;
  steps: string[];
};

export type AgentTrace = {
  agent: string;
  status: string;
  summary: string;
  duration_ms: number;
  data?: Record<string, unknown>;
};

export type DiagnosisResult = {
  id: string;
  created_at: string;
  detection: DiseaseDetection;
  weather: WeatherSnapshot;
  diagnosis: string;
  recommendations: Recommendation[];
  follow_up: FollowUpPlan;
  agent_trace: AgentTrace[];
  demo: boolean;
};

export type OnboardingPayload = {
  fullName: string;
  farmName: string;
  province: string;
  hectares: number;
  crops: string[];
};
