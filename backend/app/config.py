from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    openrouter_api_key: str = ""
    openrouter_model: str = "openai/gpt-4o"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    openweather_api_key: str = ""
    default_lat: float = -1.0547
    default_lon: float = -80.4545

    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_anon_key: str = ""

    demo_mode: bool = True
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def has_openrouter(self) -> bool:
        return bool(self.openrouter_api_key.strip())

    @property
    def has_openweather(self) -> bool:
        return bool(self.openweather_api_key.strip())


@lru_cache
def get_settings() -> Settings:
    return Settings()
