from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # PostgreSQL configuration
    POSTGRES_USER: str = "devhub"
    POSTGRES_PASSWORD: str = "devhub_insecure_dev_password_change_in_prod"
    POSTGRES_HOST: str = "db"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "devhub_db"
    DATABASE_URL: str = ""

    # CORS origins
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:3000,http://localhost:5173,http://localhost:8080,http://127.0.0.1:3000,http://127.0.0.1:5173"

    # Optional Docker Model Runner / AI integration
    MODEL_RUNNER_ENABLED: bool = False
    MODEL_RUNNER_URL: str = "http://localhost:11434"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str, info) -> str:
        if v and isinstance(v, str) and len(v.strip()) > 0:
            return v
        data = info.data
        user = data.get("POSTGRES_USER", "devhub")
        password = data.get("POSTGRES_PASSWORD", "devhub_insecure_dev_password_change_in_prod")
        host = data.get("POSTGRES_HOST", "db")
        port = data.get("POSTGRES_PORT", 5432)
        db = data.get("POSTGRES_DB", "devhub_db")
        return f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{db}"

    @property
    def cors_origin_list(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        return ["*"]


settings = Settings()
