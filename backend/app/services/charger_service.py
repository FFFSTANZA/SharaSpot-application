"""Charger management service"""
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import math
import logging

from ..models.charger import Charger as ChargerModel, VerificationAction as VerificationModel
from ..models.user import User as UserModel
from ..core.db_models import Charger, VerificationAction, User
from ..schemas.charger import ChargerCreateRequest, VerificationActionRequest
from .gamification_service import award_charger_coins, award_verification_coins, calculate_trust_score
from .s3_service import s3_service

logger = logging.getLogger(__name__)


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates using Haversine formula (in km)"""
    R = 6371  # Earth radius in kilometers

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))

    return R * c


def calculate_time_decay_weight(timestamp: datetime, current_time: datetime, half_life_days: float = 30.0) -> float:
    """
    Calculate time-decay weight using exponential decay.
    Recent verifications have weight closer to 1.0, older ones decay exponentially.

    Args:
        timestamp: When the verification was made
        current_time: Current time
        half_life_days: Number of days for weight to decay to 0.5 (default 30 days)

    Returns:
        Weight between 0.0 and 1.0
    """
    age_days = (current_time - timestamp).total_seconds() / 86400.0  # Convert to days

    # Exponential decay: weight = 0.5^(age / half_life)
    decay_weight = math.pow(0.5, age_days / half_life_days)

    return max(0.0, min(1.0, decay_weight))


def normalize_trust_score(trust_score: float) -> float:
    """
    Normalize trust score to a weight multiplier (0.5 to 2.0).
    - Trust score 0: weight 0.5 (low trust)
    - Trust score 50: weight 1.0 (average trust)
    - Trust score 100: weight 2.0 (high trust)

    Args:
        trust_score: User's trust score (0-100)

    Returns:
        Weight multiplier (0.5-2.0)
    """
    # Linear scaling: 0 -> 0.5, 50 -> 1.0, 100 -> 2.0
    normalized = 0.5 + (trust_score / 100.0) * 1.5
    return max(0.5, min(2.0, normalized))


def calculate_weighted_verification_score(
    action: str,
    timestamp: datetime,
    user_trust_score: float,
    current_time: datetime
) -> float:
    """
    Calculate weighted verification score combining:
    1. Action value (active=1.0, partial=0.5, not_working=-1.0)
    2. Time decay weight (recent verifications matter more)
    3. User trust score (high-trust users count more)

    Args:
        action: Verification action type
        timestamp: When verification was made
        user_trust_score: User's trust score (0-100)
        current_time: Current time

    Returns:
        Weighted score (can be negative for not_working)
    """
    # Base action value
    action_values = {
        "active": 1.0,
        "partial": 0.5,
        "not_working": -1.0
    }
    base_value = action_values.get(action, 0.0)

    # Apply time decay
    time_weight = calculate_time_decay_weight(timestamp, current_time)

    # Apply trust score multiplier
    trust_multiplier = normalize_trust_score(user_trust_score)

    # Calculate final weighted score
    weighted_score = base_value * time_weight * trust_multiplier

    return weighted_score


async def check_rate_limit(
    user_id: str,
    charger_id: str,
    db: AsyncSession,
    rate_limit_minutes: int = 5
) -> bool:
    """
    Check if user has verified this charger within the rate limit window.

    Args:
        user_id: User ID
        charger_id: Charger ID
        db: Database session
        rate_limit_minutes: Minimum minutes between verifications (default 5)

    Returns:
        True if rate limit is violated (too soon), False if allowed
    """
    cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=rate_limit_minutes)

    result = await db.execute(
        select(VerificationAction)
        .where(
            and_(
                VerificationAction.user_id == user_id,
                VerificationAction.charger_id == charger_id,
                VerificationAction.timestamp >= cutoff_time
            )
        )
        .order_by(VerificationAction.timestamp.desc())
        .limit(1)
    )

    recent_verification = result.scalar_one_or_none()
    return recent_verification is not None


async def detect_spam_velocity(
    user_id: str,
    db: AsyncSession,
    time_window_minutes: int = 60,
    max_verifications: int = 12
) -> bool:
    """
    Detect if user is submitting verifications too quickly (spam detection).

    Args:
        user_id: User ID
        db: Database session
        time_window_minutes: Time window to check (default 60 minutes)
        max_verifications: Maximum allowed verifications in window (default 12 = 1 per 5 min avg)

    Returns:
        True if spam detected, False otherwise
    """
    cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=time_window_minutes)

    result = await db.execute(
        select(VerificationAction)
        .where(
            and_(
                VerificationAction.user_id == user_id,
                VerificationAction.timestamp >= cutoff_time
            )
        )
    )

    recent_verifications = result.scalars().all()
    return len(recent_verifications) >= max_verifications


async def get_chargers(
    user: UserModel,
    verification_level: Optional[int] = None,
    port_type: Optional[str] = None,
    amenity: Optional[str] = None,
    max_distance: Optional[float] = None,
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None,
    page: int = 1,
    page_size: int = 100,
    db: Optional[AsyncSession] = None
) -> List[ChargerModel]:
    """
    Get chargers from database with optional filters and pagination

    Args:
        user: Current user
        verification_level: Minimum verification level filter
        port_type: Port type filter
        amenity: Amenity filter
        max_distance: Maximum distance in km (requires user_lat and user_lng)
        user_lat: User latitude for distance calculation
        user_lng: User longitude for distance calculation
        page: Page number (1-indexed)
        page_size: Items per page (max 500)
        db: Database session

    Returns:
        List of charger models (paginated)
    """
    if db is None:
        raise HTTPException(500, "Database session required")

    # Validate pagination params
    page = max(1, page)
    page_size = min(500, max(1, page_size))
    offset = (page - 1) * page_size

    # Build query with filters
    query = select(Charger).options(selectinload(Charger.verification_actions))

    # Apply geospatial bounding box filter FIRST (uses idx_charger_location index)
    # This significantly reduces the dataset before other filters
    if user_lat is not None and user_lng is not None and max_distance is not None:
        # Calculate bounding box for efficient database-level filtering
        # Approximate: 1 degree latitude ≈ 111 km
        # 1 degree longitude ≈ 111 km * cos(latitude)
        lat_delta = max_distance / 111.0
        lng_delta = max_distance / (111.0 * math.cos(math.radians(user_lat)))

        # Apply bounding box filter - this uses the composite index on (latitude, longitude)
        query = query.where(
            and_(
                Charger.latitude.between(user_lat - lat_delta, user_lat + lat_delta),
                Charger.longitude.between(user_lng - lng_delta, user_lng + lng_delta)
            )
        )

    # Apply verification level filter
    if verification_level is not None:
        query = query.where(Charger.verification_level >= verification_level)

    # Apply port type filter (check if port_type is in the array)
    if port_type:
        query = query.where(Charger.port_types.contains([port_type]))

    # Apply amenity filter (check if amenity is in the array)
    if amenity:
        query = query.where(Charger.amenities.contains([amenity]))

    # Apply pagination and ordering
    query = query.order_by(Charger.created_at.desc()).limit(page_size).offset(offset)

    # Execute query
    result = await db.execute(query)
    chargers = result.scalars().all()

    # Convert to Pydantic models with distance calculation
    charger_models = []
    for charger in chargers:
        # Calculate precise distance if user location provided
        distance = None
        if user_lat is not None and user_lng is not None:
            distance = calculate_distance(user_lat, user_lng, charger.latitude, charger.longitude)

            # Apply precise distance filter (refines the bounding box approximation)
            # The bounding box got us close, now we filter with precise Haversine distance
            if max_distance is not None and distance > max_distance:
                continue

        # Convert verification actions to Pydantic models
        verification_history = [
            VerificationModel(
                user_id=v.user_id,
                action=v.action,
                timestamp=v.timestamp,
                notes=v.notes,
                wait_time=v.wait_time,
                port_type_used=v.port_type_used,
                ports_available=v.ports_available,
                charging_success=v.charging_success,
                payment_method=v.payment_method,
                station_lighting=v.station_lighting,
                cleanliness_rating=v.cleanliness_rating,
                charging_speed_rating=v.charging_speed_rating,
                amenities_rating=v.amenities_rating,
                would_recommend=v.would_recommend,
                photo_url=v.photo_url
            )
            for v in charger.verification_actions
        ]

        charger_model = ChargerModel(
            id=charger.id,
            name=charger.name,
            address=charger.address,
            latitude=charger.latitude,
            longitude=charger.longitude,
            port_types=charger.port_types,
            available_ports=charger.available_ports,
            total_ports=charger.total_ports,
            source_type=charger.source_type,
            verification_level=charger.verification_level,
            added_by=charger.added_by,
            amenities=charger.amenities,
            nearby_amenities=charger.nearby_amenities,
            photos=charger.photos,
            last_verified=charger.last_verified,
            uptime_percentage=charger.uptime_percentage,
            verified_by_count=charger.verified_by_count,
            verification_history=verification_history,
            distance=distance,
            notes=charger.notes,
            created_at=charger.created_at
        )
        charger_models.append(charger_model)

    # Sort by distance if available
    if user_lat is not None and user_lng is not None:
        charger_models.sort(key=lambda c: c.distance if c.distance is not None else float('inf'))

    return charger_models


async def add_charger(user: UserModel, request: ChargerCreateRequest, db: AsyncSession) -> ChargerModel:
    """Add new charger (restricted for guests)"""
    if user.is_guest:
        raise HTTPException(403, "Please sign in to add chargers")

    # Upload photos to S3 if provided
    photo_urls = []
    photo_errors = []

    if request.photos:
        logger.info(f"Uploading {len(request.photos)} photos to S3 for new charger")
        photo_urls, photo_errors = s3_service.upload_multiple_photos(
            request.photos,
            prefix=f"chargers/"
        )

        # Log any upload errors but don't fail the entire request
        if photo_errors:
            logger.warning(f"Photo upload errors: {photo_errors}")

        logger.info(f"Successfully uploaded {len(photo_urls)} photos to S3")

    # Create charger with community source
    charger = Charger(
        name=request.name,
        address=request.address,
        latitude=request.latitude,
        longitude=request.longitude,
        port_types=request.port_types,
        total_ports=request.total_ports,
        available_ports=request.total_ports,  # Initially all available
        amenities=request.amenities,
        nearby_amenities=request.nearby_amenities,
        photos=photo_urls,  # Store S3 URLs instead of base64
        notes=request.notes,
        source_type="community_manual",
        verification_level=1,
        added_by=user.id,
        verified_by_count=1,
        last_verified=datetime.now(timezone.utc),
        uptime_percentage=100.0
    )
    db.add(charger)
    await db.flush()

    # Add initial verification action
    verification = VerificationAction(
        charger_id=charger.id,
        user_id=user.id,
        action="active",
        notes="Initial submission"
    )
    db.add(verification)
    await db.flush()

    # Reward user with SharaCoins (use actual uploaded photo count)
    await award_charger_coins(user.id, charger.name, len(photo_urls), db)

    # Convert to Pydantic model
    charger_model = ChargerModel(
        id=charger.id,
        name=charger.name,
        address=charger.address,
        latitude=charger.latitude,
        longitude=charger.longitude,
        port_types=charger.port_types,
        available_ports=charger.available_ports,
        total_ports=charger.total_ports,
        source_type=charger.source_type,
        verification_level=charger.verification_level,
        added_by=charger.added_by,
        amenities=charger.amenities,
        nearby_amenities=charger.nearby_amenities,
        photos=charger.photos,
        last_verified=charger.last_verified,
        uptime_percentage=charger.uptime_percentage,
        verified_by_count=charger.verified_by_count,
        verification_history=[VerificationModel(
            user_id=verification.user_id,
            action=verification.action,
            timestamp=verification.timestamp,
            notes=verification.notes
        )],
        distance=None,
        notes=charger.notes,
        created_at=charger.created_at
    )

    return charger_model


async def get_charger_detail(charger_id: str, db: AsyncSession) -> ChargerModel:
    """Get detailed charger information"""
    result = await db.execute(
        select(Charger).options(selectinload(Charger.verification_actions)).where(Charger.id == charger_id)
    )
    charger = result.scalar_one_or_none()
    if not charger:
        raise HTTPException(404, "Charger not found")

    # Convert verification actions to Pydantic models
    verification_history = [
        VerificationModel(
            user_id=v.user_id,
            action=v.action,
            timestamp=v.timestamp,
            notes=v.notes,
            wait_time=v.wait_time,
            port_type_used=v.port_type_used,
            ports_available=v.ports_available,
            charging_success=v.charging_success,
            payment_method=v.payment_method,
            station_lighting=v.station_lighting,
            cleanliness_rating=v.cleanliness_rating,
            charging_speed_rating=v.charging_speed_rating,
            amenities_rating=v.amenities_rating,
            would_recommend=v.would_recommend,
            photo_url=v.photo_url
        )
        for v in charger.verification_actions
    ]

    return ChargerModel(
        id=charger.id,
        name=charger.name,
        address=charger.address,
        latitude=charger.latitude,
        longitude=charger.longitude,
        port_types=charger.port_types,
        available_ports=charger.available_ports,
        total_ports=charger.total_ports,
        source_type=charger.source_type,
        verification_level=charger.verification_level,
        added_by=charger.added_by,
        amenities=charger.amenities,
        nearby_amenities=charger.nearby_amenities,
        photos=charger.photos,
        last_verified=charger.last_verified,
        uptime_percentage=charger.uptime_percentage,
        verified_by_count=charger.verified_by_count,
        verification_history=verification_history,
        distance=None,
        notes=charger.notes,
        created_at=charger.created_at
    )


async def verify_charger(user: UserModel, charger_id: str, request: VerificationActionRequest, db: AsyncSession) -> dict:
    """
    Add verification action to charger with advanced algorithm.

    Features:
    - Rate limiting: One verification per 5 minutes per user per charger
    - Spam detection: Velocity checks to prevent abuse
    - Time-decay weighting: Recent verifications matter more
    - Trust score influence: High-trust users' verifications count more
    - Age filtering: Verifications older than 3 months have minimal impact
    """
    if user.is_guest:
        raise HTTPException(403, "Please sign in to verify chargers")

    # Check rate limit (5 minutes per charger per user)
    is_rate_limited = await check_rate_limit(user.id, charger_id, db, rate_limit_minutes=5)
    if is_rate_limited:
        raise HTTPException(
            429,
            "You can only verify this charger once every 5 minutes. Please wait before verifying again."
        )

    # Check for spam velocity (max 12 verifications per hour across all chargers)
    is_spamming = await detect_spam_velocity(user.id, db, time_window_minutes=60, max_verifications=12)
    if is_spamming:
        raise HTTPException(
            429,
            "Too many verifications in a short time. Please slow down to prevent spam."
        )

    result = await db.execute(
        select(Charger).options(selectinload(Charger.verification_actions)).where(Charger.id == charger_id)
    )
    charger = result.scalar_one_or_none()
    if not charger:
        raise HTTPException(404, "Charger not found")

    # Upload verification photo to S3 if provided
    photo_url = None
    if request.photo_url:
        logger.info(f"Uploading verification photo to S3 for charger {charger_id}")
        photo_url, error = s3_service.upload_photo(
            request.photo_url,
            prefix=f"verifications/"
        )
        if error:
            logger.warning(f"Verification photo upload failed: {error}")
            # Continue without photo if upload fails
        else:
            logger.info(f"Successfully uploaded verification photo to S3: {photo_url}")

    # Create verification action with enhanced feedback
    action = VerificationAction(
        charger_id=charger_id,
        user_id=user.id,
        action=request.action,
        notes=request.notes,
        wait_time=request.wait_time,
        port_type_used=request.port_type_used,
        ports_available=request.ports_available,
        charging_success=request.charging_success,
        payment_method=request.payment_method,
        station_lighting=request.station_lighting,
        cleanliness_rating=request.cleanliness_rating,
        charging_speed_rating=request.charging_speed_rating,
        amenities_rating=request.amenities_rating,
        would_recommend=request.would_recommend,
        photo_url=photo_url  # Use S3 URL instead of base64
    )
    db.add(action)
    await db.flush()

    # Get all verification history for this charger
    verification_history = charger.verification_actions
    current_time = datetime.now(timezone.utc)

    # Filter verifications to only recent ones (last 3 months)
    cutoff_date = current_time - timedelta(days=90)
    recent_verifications = [v for v in verification_history if v.timestamp >= cutoff_date]

    # Calculate weighted verification scores
    weighted_scores = []

    # Get trust scores for all users who verified (batch query for efficiency)
    user_ids = list(set(v.user_id for v in recent_verifications))
    result = await db.execute(select(User).where(User.id.in_(user_ids)))
    users_dict = {u.id: u for u in result.scalars().all()}

    # Calculate weighted score for each verification
    for verification in recent_verifications:
        verifier = users_dict.get(verification.user_id)
        if not verifier:
            continue

        # Get or calculate user's trust score
        trust_score = verifier.trust_score
        if trust_score == 0.0:
            trust_score = await calculate_trust_score(verification.user_id, db)

        # Calculate weighted score
        weighted_score = calculate_weighted_verification_score(
            verification.action,
            verification.timestamp,
            trust_score,
            current_time
        )

        weighted_scores.append({
            'action': verification.action,
            'weighted_score': weighted_score,
            'timestamp': verification.timestamp
        })

    # Add current verification with user's trust score
    current_trust_score = user.trust_score
    if current_trust_score == 0.0:
        current_trust_score = await calculate_trust_score(user.id, db)

    current_weighted_score = calculate_weighted_verification_score(
        request.action,
        current_time,
        current_trust_score,
        current_time
    )

    weighted_scores.append({
        'action': request.action,
        'weighted_score': current_weighted_score,
        'timestamp': current_time
    })

    # Calculate aggregate weighted scores
    total_weighted_score = sum(s['weighted_score'] for s in weighted_scores)
    active_weighted_score = sum(s['weighted_score'] for s in weighted_scores if s['action'] == 'active')
    not_working_weighted_score = abs(sum(s['weighted_score'] for s in weighted_scores if s['action'] == 'not_working'))

    # Determine verification level based on weighted scores
    # Level 5: Strong positive score (>= 6.0 weighted points)
    # Level 4: Good positive score (>= 4.0 weighted points)
    # Level 3: Moderate positive score (>= 2.0 weighted points)
    # Level 2: Neutral or low positive score (>= 0.0 weighted points)
    # Level 1: Negative score (not_working reports outweigh active) or >= 2.0 not_working weighted

    if not_working_weighted_score >= 2.0 or total_weighted_score < 0:
        new_level = 1
    elif active_weighted_score >= 6.0:
        new_level = 5
    elif active_weighted_score >= 4.0:
        new_level = 4
    elif active_weighted_score >= 2.0:
        new_level = 3
    else:
        new_level = 2

    # Calculate uptime percentage based on weighted scores
    # Use ratio of positive to total absolute scores
    positive_score = max(0, active_weighted_score)
    total_absolute_score = positive_score + not_working_weighted_score

    if total_absolute_score > 0:
        uptime = (positive_score / total_absolute_score * 100)
    else:
        uptime = 100.0 if request.action == "active" else 0.0

    uptime = max(0.0, min(100.0, uptime))  # Clamp between 0-100

    # Count unique users who have verified
    unique_users = len(set(v.user_id for v in verification_history)) + (1 if user.id not in [v.user_id for v in verification_history] else 0)

    # Update charger
    charger.verification_level = new_level
    charger.verified_by_count = unique_users
    charger.last_verified = current_time
    charger.uptime_percentage = round(uptime, 1)
    await db.flush()

    # Reward user with SharaCoins
    coin_result = await award_verification_coins(
        user.id,
        charger.name,
        request.action,
        request.dict(),
        db
    )

    return {
        "message": "Verification recorded",
        "coins_earned": coin_result['total_coins'],
        "base_coins": coin_result['base_coins'],
        "bonus_coins": coin_result['bonus_coins'],
        "bonus_reasons": coin_result['bonus_reasons'],
        "new_level": new_level
    }


async def get_user_activity(user: UserModel, db: AsyncSession):
    """Get user's activity (submissions, verifications, reports)"""
    # Get user's submissions
    result = await db.execute(select(Charger).where(Charger.added_by == user.id))
    submissions = result.scalars().all()

    # Get user's verifications
    result = await db.execute(
        select(VerificationAction)
        .options(selectinload(VerificationAction.charger))
        .where(VerificationAction.user_id == user.id)
    )
    verifications = result.scalars().all()

    # Group verifications by charger
    verified_chargers = {}
    for v in verifications:
        charger_id = v.charger_id
        if charger_id not in verified_chargers:
            verified_chargers[charger_id] = {
                "charger": v.charger,
                "verifications": []
            }
        verified_chargers[charger_id]["verifications"].append(v)

    return {
        "submissions": submissions,
        "verifications": list(verified_chargers.values()),
        "reports": []  # Future implementation
    }
