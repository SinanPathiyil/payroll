# backend/app/core/config.py

import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Required MongoDB settings
    MONGODB_URL: str
    DATABASE_NAME: str
    
    # Required JWT settings
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    class Config:
        env_file = ".env"
        case_sensitive = False  # Allow lowercase in .env
        extra = "ignore"  # Ignore extra fields in .env (this fixes your error!)

settings = Settings()

