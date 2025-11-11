"""
Configuration constants and enums for SharaSpot API
Addresses P2 issues: Magic numbers, String-based action types
"""

from enum import Enum
from typing import Optional
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')


# ===========================
# Database Configuration
# ===========================
MONGO_URL = os.environ.get('MONGO_URL', '')
DB_NAME = os.environ.get('DB_NAME', 'sharaspot')


# ===========================
# Security Configuration
# ===========================
# Session configuration
SESSION_EXPIRY_DAYS = 7
SESSION_TOKEN_BYTES = 32

# Password requirements
MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 128
REQUIRE_UPPERCASE = True
REQUIRE_LOWERCASE = True
REQUIRE_DIGIT = True
REQUIRE_SPECIAL_CHAR = True

# Rate limiting (requests per minute)
RATE_LIMIT_AUTH_ENDPOINTS = "5/minute"  # Auth endpoints
RATE_LIMIT_WRITE_ENDPOINTS = "20/minute"  # POST/PUT/DELETE
RATE_LIMIT_READ_ENDPOINTS = "60/minute"  # GET

# CORS configuration - Add your frontend URLs here
ALLOWED_ORIGINS = [
    "http://localhost:8081",  # Expo development
    "http://localhost:19006",  # Expo web
    "exp://localhost:8081",   # Expo app
    # Add production URLs here when deployed
]

# Cookie configuration
COOKIE_SECURE = True  # Set to False for local development
COOKIE_SAMESITE = "lax"  # Changed from "none" for better security
COOKIE_HTTPONLY = True


# ===========================
# Gamification Constants
# ===========================
class CoinReward:
    """Coin reward amounts for different actions"""
    ADD_CHARGER = 5
    VERIFY_CHARGER = 2
    UPLOAD_PHOTO = 3
    REPORT_INVALID = 1
    DAILY_LOGIN = 1


class TrustScoreWeight:
    """Trust score calculation weights"""
    CHARGERS_ADDED_MULTIPLIER = 10
    VERIFICATIONS_MULTIPLIER = 2
    PHOTOS_MULTIPLIER = 3
    MAX_TRUST_SCORE = 100


# ===========================
# Verification System Constants
# ===========================
class VerificationLevel:
    """Verification level thresholds"""
    MIN_LEVEL = 1
    MAX_LEVEL = 5

    # Thresholds for level calculation (based on last 10 actions)
    LEVEL_5_ACTIVE_THRESHOLD = 8
    LEVEL_4_ACTIVE_THRESHOLD = 6
    LEVEL_3_ACTIVE_THRESHOLD = 4

    # Penalty thresholds
    NOT_WORKING_PENALTY_THRESHOLD = 3


class VerificationWeight:
    """Weights for verification calculations"""
    ACTIVE_WEIGHT = 1.0
    PARTIAL_WEIGHT = 0.5
    NOT_WORKING_WEIGHT = -1.0

    # Recent actions window
    RECENT_ACTIONS_WINDOW = 20  # Consider last 20 actions


# ===========================
# Coordinate Validation
# ===========================
class CoordinateRange:
    """Valid coordinate ranges"""
    MIN_LATITUDE = -90.0
    MAX_LATITUDE = 90.0
    MIN_LONGITUDE = -180.0
    MAX_LONGITUDE = 180.0


# ===========================
# Query Limits
# ===========================
class QueryLimits:
    """Default limits for database queries"""
    MAX_CHARGERS_RESULT = 1000
    MAX_TRANSACTIONS_RESULT = 100
    MAX_ACTIVITY_RESULT = 100
    DEFAULT_PAGE_SIZE = 50


# ===========================
# Enums for Type Safety
# ===========================
class ActionType(str, Enum):
    """Types of actions that earn/spend coins"""
    ADD_CHARGER = "add_charger"
    VERIFY_CHARGER = "verify_charger"
    UPLOAD_PHOTO = "upload_photo"
    REPORT_INVALID = "report_invalid"
    REDEEM_COUPON = "redeem_coupon"
    DAILY_LOGIN = "daily_login"


class VerificationAction(str, Enum):
    """Charger verification statuses"""
    ACTIVE = "active"
    NOT_WORKING = "not_working"
    PARTIAL = "partial"


class SourceType(str, Enum):
    """Source of charger data"""
    OFFICIAL = "official"
    COMMUNITY_MANUAL = "community_manual"


class DistanceUnit(str, Enum):
    """Distance measurement units"""
    KM = "km"
    MILES = "miles"


class Theme(str, Enum):
    """App theme options"""
    LIGHT = "light"
    DARK = "dark"


class RouteType(str, Enum):
    """Route optimization types"""
    ECO = "eco"
    BALANCED = "balanced"
    FASTEST = "fastest"
    SHORTEST = "shortest"


# ===========================
# HERE API Configuration
# ===========================
HERE_API_KEY = os.environ.get('HERE_API_KEY', None)
HERE_ROUTING_API_URL = "https://router.hereapi.com/v8/routes"
HERE_API_TIMEOUT = 10  # seconds

# HERE API parameters
HERE_MAX_ROUTE_ALTERNATIVES = 3
HERE_MAX_DETOUR_KM = 5.0


# ===========================
# Logging Configuration
# ===========================
LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
LOG_REQUEST_DETAILS = True  # Log request details (method, path, status, duration)


# ===========================
# API Configuration
# ===========================
API_VERSION = "v1"
API_TITLE = "SharaSpot API"
API_DESCRIPTION = """
## SharaSpot EV Charging Aggregator API

Community-driven platform for discovering and verifying EV charging stations.

### Features
- 🔐 Secure authentication with session-based auth
- 🗺️ Real-time charger discovery and verification
- 🎮 Gamification with SharaCoin rewards
- 🚗 Smart EV routing with HERE Maps integration
- 📊 User activity tracking and trust scores

### Rate Limits
- Authentication endpoints: 5 requests/minute
- Write operations: 20 requests/minute
- Read operations: 60 requests/minute
"""
API_VERSION_STRING = "1.0.0"


# ===========================
# Session Cleanup Configuration
# ===========================
SESSION_CLEANUP_INTERVAL_HOURS = 24  # Run cleanup every 24 hours
SESSION_CLEANUP_BATCH_SIZE = 1000  # Delete in batches


# ===========================
# Error Messages (Generic, non-verbose)
# ===========================
class ErrorMessages:
    """Generic error messages that don't leak implementation details"""
    AUTHENTICATION_FAILED = "Authentication failed"
    INVALID_CREDENTIALS = "Invalid credentials"
    UNAUTHORIZED = "Unauthorized access"
    NOT_FOUND = "Resource not found"
    INVALID_INPUT = "Invalid input data"
    INTERNAL_ERROR = "An internal error occurred"
    RATE_LIMIT_EXCEEDED = "Rate limit exceeded. Please try again later"
    FORBIDDEN = "You don't have permission to perform this action"
    INVALID_COORDINATES = "Invalid coordinate values"
    WEAK_PASSWORD = "Password does not meet security requirements"
    EMAIL_ALREADY_EXISTS = "Email already registered"


# ===========================
# Database Index Configuration
# ===========================
DATABASE_INDEXES = {
    'users': [
        ('email', 1),  # Unique index on email
        ('id', 1),     # Index on user ID
    ],
    'user_sessions': [
        ('session_token', 1),  # Unique index on token
        ('user_id', 1),        # Index on user_id
        ('expires_at', 1),     # TTL index for automatic cleanup
    ],
    'chargers': [
        ('id', 1),             # Index on charger ID
        ('added_by', 1),       # Index on user who added
        ('verification_level', 1),  # Filter by level
        ('latitude', 1),       # Geospatial queries
        ('longitude', 1),      # Geospatial queries
    ],
    'coin_transactions': [
        ('user_id', 1),        # Filter by user
        ('timestamp', -1),     # Sort by time (descending)
    ],
}
