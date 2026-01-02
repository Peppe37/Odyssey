from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Odyssey"
    DEBUG: bool = True
    DATABASE_URL: Optional[str] = None
    
    # Security
    SECRET_KEY: str = "CHANGE_ME_IN_PROD"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_SERVER: str = "db"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "odyssey"
    
    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:8383/api/auth/google/callback"
    
    # Cloudflare Turnstile
    TURNSTILE_SITE_KEY: Optional[str] = None
    TURNSTILE_SECRET_KEY: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")

    @property
    def ASYNC_DATABASE_URL(self) -> str:
        if self.DEBUG:
            return "sqlite:///./dev.db" # SQLite for Dev
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

settings = Settings()

