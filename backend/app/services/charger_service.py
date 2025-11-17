"""Charger management service"""
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import math

from ..models.charger import Charger as ChargerModel, VerificationAction as VerificationModel
from ..models.user import User as UserModel
from ..core.db_models import Charger, VerificationAction, User
from ..schemas.charger import ChargerCreateRequest, VerificationActionRequest
from .gamification_service import award_charger_coins, award_verification_coins


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


async def get_chargers(
    user: UserModel,
    verification_level: Optional[int] = None,
    port_type: Optional[str] = None,
    amenity: Optional[str] = None,
    max_distance: Optional[float] = None,
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None,
    db: Optional[AsyncSession] = None
) -> List[ChargerModel]:
    """Get chargers from database with optional filters"""
    if db is None:
        raise HTTPException(500, "Database session required")

    # Build query with filters
    query = select(Charger).options(selectinload(Charger.verification_actions))

    # Apply verification level filter
    if verification_level is not None:
        query = query.where(Charger.verification_level >= verification_level)

    # Apply port type filter (check if port_type is in the array)
    if port_type:
        query = query.where(Charger.port_types.contains([port_type]))

    # Apply amenity filter (check if amenity is in the array)
    if amenity:
        query = query.where(Charger.amenities.contains([amenity]))

    # Execute query
    result = await db.execute(query)
    chargers = result.scalars().all()

    # Convert to Pydantic models with distance calculation
    charger_models = []
    for charger in chargers:
        # Calculate distance if user location provided
        distance = None
        if user_lat is not None and user_lng is not None:
            distance = calculate_distance(user_lat, user_lng, charger.latitude, charger.longitude)

            # Apply distance filter
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
        photos=request.photos,
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

    # Reward user with SharaCoins
    await award_charger_coins(user.id, charger.name, len(request.photos), db)

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
    """Add verification action to charger"""
    if user.is_guest:
        raise HTTPException(403, "Please sign in to verify chargers")

    result = await db.execute(
        select(Charger).options(selectinload(Charger.verification_actions)).where(Charger.id == charger_id)
    )
    charger = result.scalar_one_or_none()
    if not charger:
        raise HTTPException(404, "Charger not found")

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
        photo_url=request.photo_url
    )
    db.add(action)
    await db.flush()

    # Get all verification history for this charger
    verification_history = charger.verification_actions

    # Calculate new verification level based on recent actions
    recent_actions = verification_history[-10:] if len(verification_history) >= 10 else verification_history
    active_count = sum(1 for a in recent_actions if a.action == "active")
    not_working_count = sum(1 for a in recent_actions if a.action == "not_working")

    # Determine new level
    if not_working_count >= 3:
        new_level = 1
    elif active_count >= 8:
        new_level = 5
    elif active_count >= 6:
        new_level = 4
    elif active_count >= 4:
        new_level = 3
    else:
        new_level = 2

    # Calculate uptime
    total_actions = len(verification_history) + 1  # +1 for the new action
    active_actions = sum(1 for a in verification_history if a.action == "active")
    if request.action == "active":
        active_actions += 1
    uptime = (active_actions / total_actions * 100) if total_actions > 0 else 100.0

    # Count unique users who have verified
    unique_users = len(set(v.user_id for v in verification_history)) + (1 if user.id not in [v.user_id for v in verification_history] else 0)

    # Update charger
    charger.verification_level = new_level
    charger.verified_by_count = unique_users
    charger.last_verified = datetime.now(timezone.utc)
    charger.uptime_percentage = uptime
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
