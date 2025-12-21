from secrets import token_urlsafe

from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file="../.env.dev", env_ignore_empty=True, extra="ignore"
    )

    APP_NAME: str = "Faraalkhata"
    DEBUG: bool = True
    SECRET_KEY: str = token_urlsafe(32)
    DATABASE_URL: str = "sqlite://aiosqlite:///faraalkhata.db"
    ACCESS_TOKEN_EXPIRES_MINUTES: int = 60 * 24  # 1 day
    BASE_URL: AnyHttpUrl | None = None
    ALGORITHM: str = "HS256"

    STATIC_DIR: str = "app/static"
    TEMPLATES_DIR: str = "app/templates"


# NOTE: Singleton Instance
settings = Settings()
