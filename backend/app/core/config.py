from typing import List, Union
from pydantic import Field, AnyHttpUrl, validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "Concentra API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_PREFIX: str = "/api/v1"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://concentra:concentra_dev_2024@localhost:5432/concentra_dev"
    DATABASE_URL_SYNC: str = "postgresql://concentra:concentra_dev_2024@localhost:5432/concentra_dev"

    # Authentication & Security
    USE_LOCAL_AUTH: bool = True
    LOCAL_JWT_SECRET: str = "concentra_dev_secret_key_change_in_production"
    SUPABASE_URL: str = "https://your-project.supabase.co"
    SUPABASE_ANON_KEY: str = "your-supabase-anon-key"
    SUPABASE_JWT_SECRET: str = "your-supabase-jwt-secret"
    JWT_ALGORITHM: str = "HS256"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "chrome-extension://*",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
