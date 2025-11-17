"""SQLAlchemy database models for PostgreSQL"""
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text,
    ForeignKey, Index, UniqueConstraint, ARRAY, JSON
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, timezone
import uuid

Base = declarative_base()


class User(Base):
    """User table for authentication and profile"""
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, nullable=False, unique=True, index=True)
    password = Column(String, nullable=True)  # Hashed password, nullable for OAuth users
    name = Column(String, nullable=False)
    picture = Column(String, nullable=True)
    port_type = Column(String, nullable=True)
    vehicle_type = Column(String, nullable=True)
    distance_unit = Column(String, nullable=False, default="km")
    is_guest = Column(Boolean, nullable=False, default=False)

    # Gamification fields
    shara_coins = Column(Integer, nullable=False, default=0)
    verifications_count = Column(Integer, nullable=False, default=0)
    chargers_added = Column(Integer, nullable=False, default=0)
    photos_uploaded = Column(Integer, nullable=False, default=0)
    reports_submitted = Column(Integer, nullable=False, default=0)
    coins_redeemed = Column(Integer, nullable=False, default=0)
    trust_score = Column(Float, nullable=False, default=0.0)

    # Preferences
    theme = Column(String, nullable=False, default="light")
    notifications_enabled = Column(Boolean, nullable=False, default=True)

    # Security - Account lockout
    failed_login_attempts = Column(Integer, nullable=False, default=0)
    account_locked_until = Column(DateTime(timezone=True), nullable=True)
    last_failed_login = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False,
                       default=lambda: datetime.now(timezone.utc),
                       server_default=func.now())

    # Relationships
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    chargers = relationship("Charger", back_populates="creator", foreign_keys="Charger.added_by")
    coin_transactions = relationship("CoinTransaction", back_populates="user", cascade="all, delete-orphan")
    verification_actions = relationship("VerificationAction", back_populates="user")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, name={self.name})>"


class UserSession(Base):
    """User session table for authentication"""
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_token = Column(String, nullable=False, unique=True, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False,
                       default=lambda: datetime.now(timezone.utc),
                       server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="sessions")

    def __repr__(self):
        return f"<UserSession(id={self.id}, user_id={self.user_id}, expires_at={self.expires_at})>"


class OAuthToken(Base):
    """OAuth token storage table - server-side only"""
    __tablename__ = "oauth_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String, nullable=False)  # "google", "facebook", etc.
    access_token = Column(Text, nullable=False)  # Encrypted in production
    refresh_token = Column(Text, nullable=True)  # Encrypted in production
    token_type = Column(String, nullable=False, default="Bearer")
    expires_at = Column(DateTime(timezone=True), nullable=True)
    scope = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False,
                       default=lambda: datetime.now(timezone.utc),
                       server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False,
                       default=lambda: datetime.now(timezone.utc),
                       onupdate=lambda: datetime.now(timezone.utc),
                       server_default=func.now())

    # Indexes
    __table_args__ = (
        UniqueConstraint("user_id", "provider", name="uix_user_provider"),
        Index("idx_oauth_token_user_provider", "user_id", "provider"),
    )

    def __repr__(self):
        return f"<OAuthToken(id={self.id}, user_id={self.user_id}, provider={self.provider})>"


class OAuthState(Base):
    """OAuth state storage for CSRF protection"""
    __tablename__ = "oauth_states"

    id = Column(Integer, primary_key=True, autoincrement=True)
    state = Column(String, nullable=False, unique=True, index=True)
    provider = Column(String, nullable=False)
    redirect_uri = Column(Text, nullable=True)  # Optional: store original redirect for mobile
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False,
                       default=lambda: datetime.now(timezone.utc),
                       server_default=func.now())

    def __repr__(self):
        return f"<OAuthState(id={self.id}, state={self.state}, provider={self.provider})>"


class Charger(Base):
    """Charger station table"""
    __tablename__ = "chargers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    address = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    port_types = Column(ARRAY(String), nullable=False)
    available_ports = Column(Integer, nullable=False, default=1)
    total_ports = Column(Integer, nullable=False, default=2)
    source_type = Column(String, nullable=False, default="official")  # "official" | "community_manual"
    verification_level = Column(Integer, nullable=False, default=5)  # 1-5
    added_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # Amenities
    amenities = Column(ARRAY(String), nullable=False, default=[])
    nearby_amenities = Column(ARRAY(String), nullable=False, default=[])
    photos = Column(ARRAY(Text), nullable=False, default=[])  # base64 encoded images

    # Status
    last_verified = Column(DateTime(timezone=True), nullable=True)
    uptime_percentage = Column(Float, nullable=False, default=95.0)
    verified_by_count = Column(Integer, nullable=False, default=0)

    # Additional fields
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False,
                       default=lambda: datetime.now(timezone.utc),
                       server_default=func.now())

    # Relationships
    creator = relationship("User", back_populates="chargers", foreign_keys=[added_by])
    verification_actions = relationship("VerificationAction", back_populates="charger", cascade="all, delete-orphan")

    # Indexes for geospatial and filtering
    __table_args__ = (
        Index("idx_charger_location", "latitude", "longitude"),
        Index("idx_charger_verification_level", "verification_level"),
    )

    def __repr__(self):
        return f"<Charger(id={self.id}, name={self.name}, lat={self.latitude}, lon={self.longitude})>"


class VerificationAction(Base):
    """Verification action table for charger verifications"""
    __tablename__ = "verification_actions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    charger_id = Column(String, ForeignKey("chargers.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String, nullable=False)  # "active", "not_working", "partial"
    timestamp = Column(DateTime(timezone=True), nullable=False,
                      default=lambda: datetime.now(timezone.utc),
                      server_default=func.now())
    notes = Column(Text, nullable=True)

    # Wait time and port context
    wait_time = Column(Integer, nullable=True)  # in minutes
    port_type_used = Column(String, nullable=True)  # "Type 1", "Type 2", "CCS", "CHAdeMO"
    ports_available = Column(Integer, nullable=True)
    charging_success = Column(Boolean, nullable=True)

    # Operational details
    payment_method = Column(String, nullable=True)  # "App", "Card", "Cash", "Free"
    station_lighting = Column(String, nullable=True)  # "Well-lit", "Adequate", "Poor"

    # Quality ratings
    cleanliness_rating = Column(Integer, nullable=True)  # 1-5 stars
    charging_speed_rating = Column(Integer, nullable=True)  # 1-5 stars
    amenities_rating = Column(Integer, nullable=True)  # 1-5 stars
    would_recommend = Column(Boolean, nullable=True)

    # Photo evidence
    photo_url = Column(Text, nullable=True)

    # Relationships
    charger = relationship("Charger", back_populates="verification_actions")
    user = relationship("User", back_populates="verification_actions")

    # Indexes
    __table_args__ = (
        Index("idx_verification_charger_timestamp", "charger_id", "timestamp"),
        Index("idx_verification_user_timestamp", "user_id", "timestamp"),
    )

    def __repr__(self):
        return f"<VerificationAction(id={self.id}, charger_id={self.charger_id}, action={self.action})>"


class CoinTransaction(Base):
    """Coin transaction table for gamification"""
    __tablename__ = "coin_transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String, nullable=False)  # "add_charger", "verify_charger", "upload_photo", "report_invalid", "redeem_coupon"
    amount = Column(Integer, nullable=False)  # positive for earning, negative for spending
    description = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False,
                      default=lambda: datetime.now(timezone.utc),
                      server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="coin_transactions")

    # Indexes
    __table_args__ = (
        Index("idx_coin_transaction_user_timestamp", "user_id", "timestamp"),
    )

    def __repr__(self):
        return f"<CoinTransaction(id={self.id}, user_id={self.user_id}, action={self.action}, amount={self.amount})>"


class AnalyticsSnapshot(Base):
    """Analytics snapshot table for caching aggregated metrics"""
    __tablename__ = "analytics_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    snapshot_date = Column(DateTime(timezone=True), nullable=False, index=True)
    metric_type = Column(String, nullable=False, index=True)  # "user_growth", "engagement", "charger_metrics", etc.

    # Aggregated metrics stored as JSON
    metrics = Column(JSON, nullable=False)

    # Metadata
    created_at = Column(DateTime(timezone=True), nullable=False,
                       default=lambda: datetime.now(timezone.utc),
                       server_default=func.now())

    # Indexes
    __table_args__ = (
        Index("idx_analytics_snapshot_date_type", "snapshot_date", "metric_type"),
        UniqueConstraint("snapshot_date", "metric_type", name="uix_snapshot_date_type"),
    )

    def __repr__(self):
        return f"<AnalyticsSnapshot(id={self.id}, date={self.snapshot_date}, type={self.metric_type})>"


class UserActivityEvent(Base):
    """User activity event tracking for detailed analytics"""
    __tablename__ = "user_activity_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)  # Nullable for guest tracking
    session_id = Column(String, nullable=True)  # For session tracking
    event_type = Column(String, nullable=False, index=True)  # "login", "logout", "view_charger", "search", "route_plan", etc.
    event_data = Column(JSON, nullable=True)  # Additional event metadata

    # Context
    platform = Column(String, nullable=True)  # "ios", "android", "web"
    app_version = Column(String, nullable=True)

    # Timestamps
    timestamp = Column(DateTime(timezone=True), nullable=False,
                      default=lambda: datetime.now(timezone.utc),
                      server_default=func.now(), index=True)

    # Indexes
    __table_args__ = (
        Index("idx_user_activity_event_user_timestamp", "user_id", "timestamp"),
        Index("idx_user_activity_event_type_timestamp", "event_type", "timestamp"),
    )

    def __repr__(self):
        return f"<UserActivityEvent(id={self.id}, user_id={self.user_id}, event_type={self.event_type})>"
