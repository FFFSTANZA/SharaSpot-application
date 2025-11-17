"""Charger management service"""
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import uuid
import random
from fastapi import HTTPException

from ..models.charger import Charger, VerificationAction
from ..models.user import User
from ..schemas.charger import ChargerCreateRequest, VerificationActionRequest
from ..core import get_database
from .gamification_service import award_charger_coins, award_verification_coins


def generate_mock_verification_history(level: int, verified_by_count: int, now: datetime) -> List[dict]:
    """Generate realistic mock verification history for chargers with enhanced data"""
    history = []

    # Generate history based on verification level
    history_count = verified_by_count
    action_types = ['active', 'not_working', 'partial']

    # Higher level = more "active" verifications
    if level >= 4:
        weights = [0.85, 0.05, 0.10]  # Mostly active
    elif level >= 3:
        weights = [0.70, 0.15, 0.15]
    elif level >= 2:
        weights = [0.55, 0.25, 0.20]
    else:
        weights = [0.40, 0.35, 0.25]

    notes_options = [
        'Working perfectly',
        'All ports available',
        'Quick charging confirmed',
        'One port not working',
        'Slow charging on port 2',
        'Well maintained station',
        'Station needs cleaning',
        'Charger verified working',
        'Fast charging available',
        'Good location with amenities',
        'Charging speed excellent',
        'No wait time',
        'Had to wait 15 minutes',
        'Very crowded during lunch',
        'Empty early morning',
        'Clean and well-lit',
        'Great amenities nearby'
    ]

    # Peak hours: 8-10am and 5-7pm are busier
    for i in range(history_count):
        # Distribute verifications over last 60 days
        days_ago = int((i / max(history_count - 1, 1)) * 60) if history_count > 1 else 0

        # Generate realistic time distribution (more during peak hours)
        hour = random.choices(
            range(24),
            weights=[2,1,1,1,2,3,5,8,10,8,6,7,8,7,6,7,8,10,9,7,5,4,3,2],  # Peak at 8-10am and 5-7pm
            k=1
        )[0]

        timestamp = now - timedelta(days=days_ago, hours=hour, minutes=random.randint(0, 59))

        # Weighted random selection of action
        rand = random.random()
        if rand < weights[0]:
            action = 'active'
        elif rand < weights[0] + weights[1]:
            action = 'not_working'
        else:
            action = 'partial'

        user_id = f"user_{str(uuid.uuid4())[:8]}"

        # 65% chance of having notes
        notes = random.choice(notes_options) if random.random() > 0.35 else None

        # Add detailed feedback data
        wait_time = None
        port_type_used = None
        ports_available = None
        charging_success = None
        payment_method = None
        station_lighting = None
        cleanliness_rating = None
        charging_speed_rating = None
        amenities_rating = None
        would_recommend = None
        photo_url = None

        if action == 'active':
            # Wait time based on time of day (0-30 minutes)
            if 8 <= hour <= 10 or 17 <= hour <= 19:  # Peak hours
                wait_time = random.randint(0, 30)
            else:
                wait_time = random.randint(0, 10)

            # 70% chance of providing detailed port context
            if random.random() < 0.7:
                port_type_used = random.choice(['Type 2', 'CCS', 'CHAdeMO', 'Type 1'])
                ports_available = random.randint(0, 3)
                charging_success = random.random() < 0.85  # 85% success rate

            # 70% chance of providing operational details
            if random.random() < 0.7:
                payment_method = random.choice(['App', 'Card', 'Free', 'Cash'])
                station_lighting = random.choice(['Well-lit', 'Adequate', 'Poor'])

            # 70% chance of providing quality ratings for active verifications
            if random.random() < 0.7:
                # Higher level stations get better ratings
                if level >= 4:
                    cleanliness_rating = random.randint(4, 5)
                    charging_speed_rating = random.randint(4, 5)
                    amenities_rating = random.randint(4, 5)
                    would_recommend = random.random() < 0.9
                elif level >= 3:
                    cleanliness_rating = random.randint(3, 5)
                    charging_speed_rating = random.randint(3, 5)
                    amenities_rating = random.randint(3, 5)
                    would_recommend = random.random() < 0.75
                else:
                    cleanliness_rating = random.randint(2, 4)
                    charging_speed_rating = random.randint(2, 4)
                    amenities_rating = random.randint(2, 4)
                    would_recommend = random.random() < 0.6

        elif action == 'not_working':
            # For not_working reports, 60% include photo evidence
            if random.random() < 0.6:
                photo_url = f"https://example.com/photos/station_{random.randint(1000, 9999)}.jpg"

        history.append({
            "user_id": user_id,
            "action": action,
            "timestamp": timestamp,
            "notes": notes,
            "wait_time": wait_time,
            "port_type_used": port_type_used,
            "ports_available": ports_available,
            "charging_success": charging_success,
            "payment_method": payment_method,
            "station_lighting": station_lighting,
            "cleanliness_rating": cleanliness_rating,
            "charging_speed_rating": charging_speed_rating,
            "amenities_rating": amenities_rating,
            "would_recommend": would_recommend,
            "photo_url": photo_url
        })

    # Sort by timestamp descending (newest first)
    history.sort(key=lambda x: x["timestamp"], reverse=True)
    return history


async def get_chargers(
    user: User,
    verification_level: Optional[int] = None,
    port_type: Optional[str] = None,
    amenity: Optional[str] = None,
    max_distance: Optional[float] = None
) -> List[Charger]:
    """Get nearby chargers with optional filters"""
    # Enhanced mock chargers data - Tamil Nadu region
    now = datetime.now(timezone.utc)
    mock_chargers = [
        {
            "id": str(uuid.uuid4()),
            "name": "Ather Grid - Anna Nagar",
            "address": "Anna Nagar, Chennai, Tamil Nadu",
            "latitude": 13.0878,
            "longitude": 80.2088,
            "port_types": ["Type 2", "CCS"],
            "available_ports": 6,
            "total_ports": 8,
            "source_type": "official",
            "verification_level": 5,
            "added_by": "admin",
            "amenities": ["restroom", "cafe", "wifi", "parking"],
            "nearby_amenities": ["restaurant", "atm"],
            "photos": [],
            "verified_by_count": 25,
            "verification_history": generate_mock_verification_history(5, 25, now),
            "last_verified": now - timedelta(days=2),
            "uptime_percentage": 98.5,
            "distance": 0.5,
            "notes": None,
            "created_at": now - timedelta(days=180),
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Tata Power Charging - Phoenix Marketcity",
            "address": "Velachery, Chennai, Tamil Nadu",
            "latitude": 12.9916,
            "longitude": 80.2206,
            "port_types": ["Type 2", "CHAdeMO"],
            "available_ports": 2,
            "total_ports": 4,
            "source_type": "official",
            "verification_level": 4,
            "added_by": "admin",
            "amenities": ["restroom", "shopping", "wifi", "parking"],
            "nearby_amenities": ["bank", "food court"],
            "photos": [],
            "verified_by_count": 18,
            "verification_history": generate_mock_verification_history(4, 18, now),
            "last_verified": now - timedelta(days=5),
            "uptime_percentage": 95.2,
            "distance": 1.2,
            "notes": None,
            "created_at": now - timedelta(days=120),
        },
        {
            "id": str(uuid.uuid4()),
            "name": "ChargeZone - Coimbatore",
            "address": "RS Puram, Coimbatore, Tamil Nadu",
            "latitude": 11.0168,
            "longitude": 76.9558,
            "port_types": ["CCS", "CHAdeMO"],
            "available_ports": 0,
            "total_ports": 3,
            "source_type": "official",
            "verification_level": 3,
            "added_by": "admin",
            "amenities": ["restroom", "parking"],
            "nearby_amenities": [],
            "photos": [],
            "verified_by_count": 12,
            "verification_history": generate_mock_verification_history(3, 12, now),
            "last_verified": now - timedelta(days=15),
            "uptime_percentage": 87.3,
            "distance": 2.8,
            "notes": None,
            "created_at": now - timedelta(days=90),
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Ather Grid - T Nagar",
            "address": "T Nagar, Chennai, Tamil Nadu",
            "latitude": 13.0418,
            "longitude": 80.2341,
            "port_types": ["Type 2", "CCS"],
            "available_ports": 4,
            "total_ports": 6,
            "source_type": "official",
            "verification_level": 5,
            "added_by": "admin",
            "amenities": ["restroom", "cafe", "wifi", "parking", "shopping"],
            "nearby_amenities": ["mall", "restaurant"],
            "photos": [],
            "verified_by_count": 30,
            "verification_history": generate_mock_verification_history(5, 30, now),
            "last_verified": now - timedelta(days=1),
            "uptime_percentage": 99.1,
            "distance": 3.5,
            "notes": None,
            "created_at": now - timedelta(days=200),
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Hidden Gem - Adyar Cafe",
            "address": "Adyar, Chennai, Tamil Nadu",
            "latitude": 13.0067,
            "longitude": 80.2574,
            "port_types": ["Type 2"],
            "available_ports": 1,
            "total_ports": 2,
            "source_type": "community_manual",
            "verification_level": 2,
            "added_by": user.id if not user.is_guest else "community",
            "amenities": ["cafe", "wifi"],
            "nearby_amenities": ["cafe"],
            "photos": [],
            "verified_by_count": 5,
            "verification_history": generate_mock_verification_history(2, 5, now),
            "last_verified": now - timedelta(days=30),
            "uptime_percentage": 78.5,
            "distance": 1.8,
            "notes": "Small cafe with 2 chargers",
            "created_at": now - timedelta(days=45),
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Community Charger - Madurai Junction",
            "address": "Madurai Junction, Madurai, Tamil Nadu",
            "latitude": 9.9252,
            "longitude": 78.1198,
            "port_types": ["Type 2", "Type 1"],
            "available_ports": 3,
            "total_ports": 4,
            "source_type": "community_manual",
            "verification_level": 3,
            "added_by": "community",
            "amenities": ["parking"],
            "nearby_amenities": ["bus stop"],
            "photos": [],
            "verified_by_count": 8,
            "verification_history": generate_mock_verification_history(3, 8, now),
            "last_verified": now - timedelta(days=10),
            "uptime_percentage": 91.7,
            "distance": 2.1,
            "notes": "Free parking available",
            "created_at": now - timedelta(days=60),
        }
    ]

    # Apply filters
    filtered_chargers = mock_chargers
    if verification_level is not None:
        filtered_chargers = [c for c in filtered_chargers if c["verification_level"] >= verification_level]
    if port_type:
        filtered_chargers = [c for c in filtered_chargers if port_type in c["port_types"]]
    if amenity:
        filtered_chargers = [c for c in filtered_chargers if amenity in c["amenities"]]
    if max_distance is not None:
        filtered_chargers = [c for c in filtered_chargers if c["distance"] <= max_distance]

    return [Charger(**charger) for charger in filtered_chargers]


async def add_charger(user: User, request: ChargerCreateRequest) -> Charger:
    """Add new charger (restricted for guests)"""
    db = get_database()

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
        verification_history=[VerificationAction(
            user_id=user.id,
            action="active",
            notes="Initial submission"
        )],
        last_verified=datetime.now(timezone.utc),
        uptime_percentage=100.0
    )
    await db.chargers.insert_one(charger.dict())

    # Reward user with SharaCoins
    await award_charger_coins(user.id, charger.name, len(request.photos))

    return charger


async def get_charger_detail(charger_id: str) -> Charger:
    """Get detailed charger information"""
    db = get_database()

    charger = await db.chargers.find_one({"id": charger_id})
    if not charger:
        raise HTTPException(404, "Charger not found")

    return Charger(**charger)


async def verify_charger(user: User, charger_id: str, request: VerificationActionRequest) -> dict:
    """Add verification action to charger"""
    db = get_database()

    if user.is_guest:
        raise HTTPException(403, "Please sign in to verify chargers")

    charger = await db.chargers.find_one({"id": charger_id})
    if not charger:
        raise HTTPException(404, "Charger not found")

    # Create verification action with enhanced feedback
    action = VerificationAction(
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

    # Update charger
    verification_history = charger.get("verification_history", [])
    verification_history.append(action.dict())

    # Calculate new verification level based on recent actions
    recent_actions = verification_history[-10:]  # Last 10 actions
    active_count = sum(1 for a in recent_actions if a.get("action") == "active")
    not_working_count = sum(1 for a in recent_actions if a.get("action") == "not_working")

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
    total_actions = len(verification_history)
    active_actions = sum(1 for a in verification_history if a.get("action") == "active")
    uptime = (active_actions / total_actions * 100) if total_actions > 0 else 100.0

    await db.chargers.update_one(
        {"id": charger_id},
        {"$set": {
            "verification_history": verification_history,
            "verification_level": new_level,
            "verified_by_count": len(set(a.get("user_id") for a in verification_history)),
            "last_verified": datetime.now(timezone.utc),
            "uptime_percentage": uptime
        }}
    )

    # Reward user with SharaCoins
    coin_result = await award_verification_coins(
        user.id,
        charger['name'],
        request.action,
        request.dict()
    )

    return {
        "message": "Verification recorded",
        "coins_earned": coin_result['total_coins'],
        "base_coins": coin_result['base_coins'],
        "bonus_coins": coin_result['bonus_coins'],
        "bonus_reasons": coin_result['bonus_reasons'],
        "new_level": new_level
    }


async def get_user_activity(user: User):
    """Get user's activity (submissions, verifications, reports)"""
    db = get_database()

    # Get user's submissions
    submissions = await db.chargers.find({"added_by": user.id}).to_list(100)

    # Get user's verifications
    verified_chargers = []
    all_chargers = await db.chargers.find().to_list(1000)
    for charger in all_chargers:
        verification_history = charger.get('verification_history', [])
        user_verifications = [v for v in verification_history if v.get('user_id') == user.id]
        if user_verifications:
            verified_chargers.append({
                "charger": charger,
                "verifications": user_verifications
            })

    return {
        "submissions": submissions,
        "verifications": verified_chargers,
        "reports": []  # Future implementation
    }
