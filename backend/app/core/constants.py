"""
Constants and enums for SharaSpot API
Provides type-safe constants for the modular monolith architecture
"""

from enum import Enum


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
# Security Constants
# ===========================
class PasswordRequirements:
    """Password validation requirements"""
    MIN_LENGTH = 8
    MAX_LENGTH = 128
    REQUIRE_UPPERCASE = True
    REQUIRE_LOWERCASE = True
    REQUIRE_DIGIT = True
    REQUIRE_SPECIAL_CHAR = True


class SessionConfig:
    """Session configuration"""
    EXPIRY_DAYS = 7
    TOKEN_BYTES = 32


class RateLimits:
    """Rate limiting configuration"""
    AUTH_ENDPOINTS = "5/minute"  # Authentication endpoints
    WRITE_ENDPOINTS = "20/minute"  # POST/PUT/DELETE
    READ_ENDPOINTS = "60/minute"  # GET


# ===========================
# HERE API Configuration
# ===========================
class HEREConfig:
    """HERE API configuration constants"""
    ROUTING_API_URL = "https://router.hereapi.com/v8/routes"
    API_TIMEOUT = 10  # seconds
    MAX_ROUTE_ALTERNATIVES = 3
    MAX_DETOUR_KM = 5.0


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
# Valid Options
# ===========================
class ValidPortTypes:
    """Valid EV charger port types"""
    TYPES = {
        "Type 1",
        "Type 2",
        "CCS",
        "CHAdeMO",
        "Tesla",
        "GB/T",
        "Type 3"
    }


class ValidAmenities:
    """Valid amenity types"""
    TYPES = {
        "restroom",
        "cafe",
        "wifi",
        "parking",
        "shopping",
        "restaurant",
        "atm",
        "hotel",
        "rest_area"
    }


# ===========================
# Error Messages
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
