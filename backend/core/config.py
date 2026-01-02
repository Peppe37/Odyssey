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
    # These are the raw env values - use the properties below for actual keys
    TURNSTILE_SITE_KEY: Optional[str] = None
    TURNSTILE_SECRET_KEY: Optional[str] = None
    
    # Cloudflare Turnstile test keys for development
    # See: https://developers.cloudflare.com/turnstile/troubleshooting/testing/
    _DEV_TURNSTILE_SITE_KEY: str = "1x00000000000000000000AA"  # Always passes
    _DEV_TURNSTILE_SECRET_KEY: str = "1x0000000000000000000000000000000AA"  # Always passes

    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")
    
    @property
    def ACTIVE_TURNSTILE_SITE_KEY(self) -> str | None:
        """Returns the Turnstile site key - dev key if DEBUG, otherwise configured key."""
        if self.DEBUG:
            return self._DEV_TURNSTILE_SITE_KEY
        return self.TURNSTILE_SITE_KEY
    
    @property
    def ACTIVE_TURNSTILE_SECRET_KEY(self) -> str | None:
        """Returns the Turnstile secret key - dev key if DEBUG, otherwise configured key."""
        if self.DEBUG:
            return self._DEV_TURNSTILE_SECRET_KEY
        return self.TURNSTILE_SECRET_KEY

    @property
    def ASYNC_DATABASE_URL(self) -> str:
        if self.DEBUG:
            return "sqlite:///./dev.db" # SQLite for Dev
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

settings = Settings()

