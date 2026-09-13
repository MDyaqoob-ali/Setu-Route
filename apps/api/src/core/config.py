import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

def _get_default_db_url() -> str:
    base_api_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    api_db = os.path.join(base_api_dir, "neroute.db")
    root_db = os.path.abspath(os.path.join(base_api_dir, "..", "..", "neroute.db"))
    if os.path.exists(api_db) and os.path.getsize(api_db) > 0:
        return f"sqlite+aiosqlite:///{api_db.replace(os.sep, '/')}"
    elif os.path.exists(root_db) and os.path.getsize(root_db) > 0:
        return f"sqlite+aiosqlite:///{root_db.replace(os.sep, '/')}"
    return f"sqlite+aiosqlite:///{api_db.replace(os.sep, '/')}"

class Settings(BaseSettings):
    PROJECT_NAME: str = "NE-ROUTE"
    ENVIRONMENT: str = "development"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "ne-route-super-secure-production-key-sih-2026-ner-logistics"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALGORITHM: str = "HS256"
    
    # Database
    DATABASE_URL: str = Field(default_factory=_get_default_db_url)
    
    # Redis / In-memory PubSub
    REDIS_URL: str = "redis://localhost:6379/0"
    USE_IN_MEMORY_BROKER: bool = True
    
    # Host & Ports
    HOST: str = "0.0.0.0"
    PORT: int = 8008
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8000,http://127.0.0.1:3000,http://127.0.0.1:8000,http://localhost:5173"
    
    # Uploads
    UPLOAD_DIR: str = "./uploads"
    
    # GIS Defaults (North Eastern Region Center)
    DEFAULT_MAP_CENTER_LAT: float = 25.8
    DEFAULT_MAP_CENTER_LNG: float = 93.5
    DEFAULT_MAP_ZOOM: float = 7.2

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()
