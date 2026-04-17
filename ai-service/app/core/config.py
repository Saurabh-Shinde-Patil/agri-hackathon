from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    host: str = "0.0.0.0"
    port: int = 8000
    model_path: str = "best.pt"
    gemini_api_key: str | None = None
    grok_api_key: str | None = None
    together_api_key: str | None = None
    openweather_api_key: str | None = None
    mongodb_uri: str | None = None
    database_name: str = "agri_ai_system"

    class Config:
        env_file = ".env"

settings = Settings()
