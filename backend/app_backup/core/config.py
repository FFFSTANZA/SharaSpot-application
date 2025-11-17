"""Application configuration"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent.parent
load_dotenv(ROOT_DIR / '.env')


class Settings:
    """Application settings"""

    # ===========================
    # Database Configuration
    # ===========================
    DATABASE_URL: str = os.environ.get('DATABASE_URL', 'postgresql+asyncpg://postgres:postgres@localhost:5432/sharaspot')
    DEBUG: bool = os.environ.get('DEBUG', 'False').lower() in ('true', '1', 't')

    # ===========================
    # Mapbox API Configuration (PRIMARY - Production)
    # ===========================
    MAPBOX_API_KEY: str = os.environ.get('MAPBOX_API_KEY', '')

    # ===========================
    # HERE API Configuration (LEGACY - Deprecated)
    # ===========================
    HERE_API_KEY: str = os.environ.get('HERE_API_KEY', '')

    # ===========================
    # Weather API Configuration
    # ===========================
    OPENWEATHER_API_KEY: str = os.environ.get('OPENWEATHER_API_KEY', '')
    WEATHER_API_TIMEOUT: int = 5  # seconds

    # ===========================
    # HTTP Client Configuration
    # ===========================
    HTTP_CLIENT_TIMEOUT: int = 10  # seconds
    HTTP_CLIENT_MAX_RETRIES: int = 3  # Maximum retry attempts
    HTTP_CLIENT_RETRY_DELAY: float = 1.0  # Initial retry delay in seconds

    # ===========================
    # JWT Token Configuration
    # ===========================
    JWT_SECRET_KEY: str = os.environ.get('JWT_SECRET_KEY', 'development-secret-key-change-in-production')
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # Access token expires in 30 minutes
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # Refresh token expires in 7 days

    # Legacy session configuration (for backward compatibility during migration)
    SESSION_EXPIRE_DAYS: int = 7
    SESSION_TOKEN_BYTES: int = 32

    # ===========================
    # Google OAuth Configuration
    # ===========================
    GOOGLE_CLIENT_ID: str = os.environ.get('GOOGLE_CLIENT_ID', '')
    GOOGLE_CLIENT_SECRET: str = os.environ.get('GOOGLE_CLIENT_SECRET', '')
    GOOGLE_REDIRECT_URI: str = os.environ.get('GOOGLE_REDIRECT_URI', 'http://localhost:8000/api/auth/google/callback')
    OAUTH_STATE_EXPIRE_SECONDS: int = 600  # 10 minutes

    # ===========================
    # CORS Configuration
    # ===========================
    # Load from environment variable, fallback to development defaults
    CORS_ORIGINS: list = os.environ.get(
        'CORS_ORIGINS',
        'http://localhost:8081,http://localhost:19006,exp://localhost:8081'
    ).split(',')

    CORS_ALLOW_CREDENTIALS: bool = True

    # Restrict to only necessary HTTP methods
    CORS_ALLOW_METHODS: list = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]

    # Restrict to only necessary headers
    CORS_ALLOW_HEADERS: list = [
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "X-Requested-With",
    ]

    # ===========================
    # Cookie Configuration
    # ===========================
    COOKIE_SECURE: bool = False  # Set to True in production
    COOKIE_SAMESITE: str = "lax"
    COOKIE_HTTPONLY: bool = True

    # ===========================
    # Logging Configuration
    # ===========================
    LOG_LEVEL: str = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FORMAT: str = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_REQUEST_DETAILS: bool = True

    # ===========================
    # API Configuration
    # ===========================
    API_VERSION: str = "v1"
    API_TITLE: str = "SharaSpot API"
    API_DESCRIPTION: str = """
## SharaSpot EV Charging Aggregator API

Community-driven platform for discovering and verifying EV charging stations.

### Features
- 🔐 Secure authentication with JWT tokens
- 🗺️ Real-time charger discovery and verification
- 🎮 Gamification with SharaCoin rewards
- 🚗 Production-grade EV routing with Mapbox Directions API
- 🎯 Turn-by-turn navigation with voice guidance (Expo Speech)
- 📈 Elevation-aware energy consumption (Open-Topo-Data)
- 🔋 Real-time battery monitoring and charging alerts
- 📊 User activity tracking and trust scores

### Navigation Features
- **Mapbox Directions API**: Industry-leading route planning with 3 alternatives (Eco, Balanced, Fastest)
- **Open-Topo-Data**: Free elevation data for accurate energy consumption
- **Voice Guidance**: Turn-by-turn instructions with text-to-speech (zero additional cost)
- **Battery Intelligence**: Physics-based energy consumption modeling
- **Charger Integration**: Smart charging stop suggestions along route

### Rate Limits
- Authentication endpoints: 5 requests/minute
- Write operations: 20 requests/minute
- Read operations: 60 requests/minute
"""
    API_VERSION_STRING: str = "1.0.0"

    # ===========================
    # Session Cleanup Configuration
    # ===========================
    SESSION_CLEANUP_INTERVAL_HOURS: int = 24
    SESSION_CLEANUP_BATCH_SIZE: int = 1000

    # ===========================
    # Security Configuration
    # ===========================
    # Rate limiting
    AUTH_RATE_LIMIT: str = "5/minute"  # Login/Signup rate limit
    WRITE_RATE_LIMIT: str = "20/minute"  # Write operations rate limit
    READ_RATE_LIMIT: str = "60/minute"  # Read operations rate limit

    # Account lockout configuration
    MAX_LOGIN_ATTEMPTS: int = 5  # Max failed login attempts before lockout
    ACCOUNT_LOCKOUT_DURATION_MINUTES: int = 15  # How long to lock account

    # ===========================
    # AWS S3 Configuration
    # ===========================
    AWS_ACCESS_KEY_ID: str = os.environ.get('AWS_ACCESS_KEY_ID', '')
    AWS_SECRET_ACCESS_KEY: str = os.environ.get('AWS_SECRET_ACCESS_KEY', '')
    AWS_REGION: str = os.environ.get('AWS_REGION', 'us-east-1')
    S3_BUCKET_NAME: str = os.environ.get('S3_BUCKET_NAME', 'sharaspot-photos')
    S3_PHOTO_PREFIX: str = 'chargers/'  # Prefix for charger photos
    S3_VERIFICATION_PREFIX: str = 'verifications/'  # Prefix for verification photos
    S3_PROFILE_PREFIX: str = 'profiles/'  # Prefix for profile pictures
    S3_MAX_FILE_SIZE: int = 5 * 1024 * 1024  # 5MB max file size
    S3_ALLOWED_EXTENSIONS: list = ['.jpg', '.jpeg', '.png', '.webp']
    S3_PRESIGNED_URL_EXPIRATION: int = 3600  # 1 hour

    # ===========================
    # Database Connection Pool Configuration
    # ===========================
    DB_POOL_SIZE: int = int(os.environ.get('DB_POOL_SIZE', '20'))
    DB_MAX_OVERFLOW: int = int(os.environ.get('DB_MAX_OVERFLOW', '40'))
    DB_POOL_TIMEOUT: int = int(os.environ.get('DB_POOL_TIMEOUT', '30'))
    DB_POOL_RECYCLE: int = int(os.environ.get('DB_POOL_RECYCLE', '3600'))

    # Read replica configuration
    DATABASE_READ_REPLICA_URL: str = os.environ.get('DATABASE_READ_REPLICA_URL', '')
    USE_READ_REPLICA: bool = os.environ.get('USE_READ_REPLICA', 'False').lower() in ('true', '1', 't')


settings = Settings()
