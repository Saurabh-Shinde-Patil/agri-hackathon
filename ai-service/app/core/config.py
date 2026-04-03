from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    host: str = "0.0.0.0"
    port: int = 8000
    model_path: str = "best.pt"

    class Config:
        env_file = ".env"

settings = Settings()
