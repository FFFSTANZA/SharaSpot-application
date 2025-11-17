"""Application configuration"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent.parent
load_dotenv(ROOT_DIR / '.env')


class Settings:
    """Application settings"""
    # MongoDB
    MONGO_URL: str = os.environ.get('MONGO_URL', '')
    DB_NAME: str = os.environ.get('DB_NAME', 'sharaspot')

    # HERE API
    HERE_API_KEY: str = os.environ.get('HERE_API_KEY', '')

    # Session
    SESSION_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: list = ["*"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list = ["*"]
    CORS_ALLOW_HEADERS: list = ["*"]


settings = Settings()
