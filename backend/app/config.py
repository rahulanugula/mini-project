import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "SENTINEL: AI-Powered Consumer Scam Prevention Platform"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = "sqlite:///./sentinel.db"
    GEMINI_API_KEY: str | None = None
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    
    # Allows loading from .env file
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Post-processing helper to see if GEMINI_API_KEY is available in environment directly
if not settings.GEMINI_API_KEY:
    settings.GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
