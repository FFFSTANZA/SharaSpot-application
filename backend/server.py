from fastapi import FastAPI, APIRouter, HTTPException, Response, Cookie, Header
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import requests
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')
# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
# Pydantic Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    picture: Optional[str] = None
    port_type: Optional[str] = None
    vehicle_type: Optional[str] = None
    distance_unit: Optional[str] = "km"
    is_guest: bool = False
    shara_coins: int = 0
    verifications_count: int = 0
    chargers_added: int = 0
    photos_uploaded: int = 0
    reports_submitted: int = 0
    coins_redeemed: int = 0
    trust_score: float = 0.0
    theme: str = "light"
    notifications_enabled: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
class PreferencesUpdate(BaseModel):
    port_type: str
    vehicle_type: str
    distance_unit: str
class VerificationAction(BaseModel):
    user_id: str
    action: str  # "active", "not_working", "partial"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    notes: Optional[str] = None
class Charger(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str
    latitude: float
    longitude: float
    port_types: List[str]
    available_ports: int = 1
    total_ports: int = 2
    source_type: str = "official"  # "official" | "community_manual"
    verification_level: int = 5  # 1-5
    added_by: Optional[str] = None  # user_id or "admin"
    amenities: List[str] = []  # ["restroom", "cafe", "wifi", "parking", "shopping"]
    nearby_amenities: List[str] = []  # amenities within 500m
    photos: List[str] = []  # base64 encoded images
    last_verified: Optional[datetime] = None
    uptime_percentage: float = 95.0
    verified_by_count: int = 0
    verification_history: List[VerificationAction] = []
    distance: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
class ChargerCreateRequest(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    port_types: List[str]
    total_ports: int
    amenities: List[str] = []
    nearby_amenities: List[str] = []
    photos: List[str] = []
    notes: Optional[str] = None
class VerificationActionRequest(BaseModel):
    action: str  # "active", "not_working", "partial"
    notes: Optional[str] = None
class CoinTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    action: str  # "add_charger", "verify_charger", "upload_photo", "report_invalid", "redeem_coupon"
    amount: int  # positive for earning, negative for spending
    description: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSettings(BaseModel):
    theme: str = "light"  # "light" or "dark"
    notifications_enabled: bool = True

class UserProfile(BaseModel):
    shara_coins: int = 0
    verifications_count: int = 0
    chargers_added: int = 0
    photos_uploaded: int = 0
    reports_submitted: int = 0
    coins_redeemed: int = 0
    trust_score: float = 0.0
    settings: UserSettings = Field(default_factory=UserSettings)
# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
async def get_user_from_session(session_token: Optional[str] = None, authorization: Optional[str] = None) -> Optional[User]:
    """Get user from session token (cookie or header)"""
    token = session_token
    if not token and authorization:
        if authorization.startswith('Bearer '):
            token = authorization[7:]
    if not token:
        return None
    session = await db.user_sessions.find_one({"session_token": token})
    if not session:
        return None
    # Make sure expires_at is timezone-aware
    expires_at = session['expires_at']
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"session_token": token})
        return None
    user_doc = await db.users.find_one({"id": session['user_id']})
    if not user_doc:
        return None
    return User(**user_doc)
async def create_session(user_id: str) -> str:
    """Create a new session for user"""
    session_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session = UserSession(
        user_id=user_id,
        session_token=session_token,
        expires_at=expires_at
    )
    await db.user_sessions.insert_one(session.dict())
    return session_token
# Auth Routes
@api_router.post("/auth/signup")
async def signup(data: SignupRequest, response: Response):
    """Email/Password signup"""
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(400, "Email already registered")
    user = User(
        email=data.email,
        name=data.name,
        picture=None
    )
    # Store user
    user_dict = user.dict()
    user_dict['password'] = hash_password(data.password)
    await db.users.insert_one(user_dict)
    # Create session
    session_token = await create_session(user.id)
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    return {"user": user, "session_token": session_token, "needs_preferences": True}
@api_router.post("/auth/login")
async def login(data: LoginRequest, response: Response):
    """Email/Password login"""
    user_doc = await db.users.find_one({"email": data.email})
    if not user_doc or 'password' not in user_doc:
        raise HTTPException(401, "Invalid credentials")
    if not verify_password(data.password, user_doc['password']):
        raise HTTPException(401, "Invalid credentials")
    user = User(**{k: v for k, v in user_doc.items() if k != 'password'})
    # Create session
    session_token = await create_session(user.id)
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    needs_preferences = not (user.port_type and user.vehicle_type)
    return {"user": user, "session_token": session_token, "needs_preferences": needs_preferences}
@api_router.get("/auth/session-data")
async def get_session_data(x_session_id: Optional[str] = Header(None)):
    """Process Emergent Auth session ID"""
    if not x_session_id:
        raise HTTPException(400, "Session ID required")
    # Call Emergent Auth API
    try:
        response = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": x_session_id}
        )
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        raise HTTPException(500, f"Failed to verify session: {str(e)}")
    # Check if user exists
    user_doc = await db.users.find_one({"email": data['email']})
    if user_doc:
        user = User(**user_doc)
    else:
        # Create new user
        user = User(
            email=data['email'],
            name=data['name'],
            picture=data.get('picture')
        )
        await db.users.insert_one(user.dict())
    # Create our session
    session_token = await create_session(user.id)
    needs_preferences = not (user.port_type and user.vehicle_type)
    return {
        "user": user,
        "session_token": session_token,
        "emergent_session_token": data.get('session_token'),
        "needs_preferences": needs_preferences
    }
@api_router.get("/auth/me")
async def get_current_user(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get current user from session"""
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(401, "Not authenticated")
    return user
@api_router.post("/auth/guest")
async def create_guest_session(response: Response):
    """Create guest user session"""
    guest = User(
        email=f"guest_{uuid.uuid4().hex[:8]}@example.com",
        name="Guest User",
        is_guest=True
    )
    await db.users.insert_one(guest.dict())
    session_token = await create_session(guest.id)
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    return {"user": guest, "session_token": session_token}
@api_router.post("/auth/logout")
async def logout(
    response: Response,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Logout user"""
    token = session_token
    if not token and authorization:
        if authorization.startswith('Bearer '):
            token = authorization[7:]
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}
@api_router.put("/auth/preferences")
async def update_preferences(
    data: PreferencesUpdate,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Update user preferences"""
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(401, "Not authenticated")
    if user.is_guest:
        raise HTTPException(403, "Guests cannot save preferences")
    await db.users.update_one(
        {"id": user.id},
        {"$set": {
            "port_type": data.port_type,
            "vehicle_type": data.vehicle_type,
            "distance_unit": data.distance_unit
        }}
    )
    user.port_type = data.port_type
    user.vehicle_type = data.vehicle_type
    user.distance_unit = data.distance_unit
    return user
# Chargers Routes
@api_router.get("/chargers", response_model=List[Charger])
async def get_chargers(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
    verification_level: Optional[int] = None,
    port_type: Optional[str] = None,
    amenity: Optional[str] = None,
    max_distance: Optional[float] = None
):
    """Get nearby chargers with optional filters"""
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(401, "Not authenticated")
    # Enhanced mock chargers data with all new fields
    now = datetime.now(timezone.utc)
    mock_chargers = [
        {
            "id": str(uuid.uuid4()),
            "name": "Tesla Supercharger - Downtown",
            "address": "123 Main St, City Center",
            "latitude": 37.7749,
            "longitude": -122.4194,
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
            "verification_history": [],
            "last_verified": now - timedelta(days=2),
            "uptime_percentage": 98.5,
            "distance": 0.5,
            "notes": None,
            "created_at": now - timedelta(days=180),
        },
        {
            "id": str(uuid.uuid4()),
            "name": "ChargePoint Station - Mall",
            "address": "456 Shopping Blvd",
            "latitude": 37.7849,
            "longitude": -122.4094,
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
            "verification_history": [],
            "last_verified": now - timedelta(days=5),
            "uptime_percentage": 95.2,
            "distance": 1.2,
            "notes": None,
            "created_at": now - timedelta(days=120),
        },
        {
            "id": str(uuid.uuid4()),
            "name": "EVgo Fast Charging",
            "address": "789 Highway Exit 15",
            "latitude": 37.7649,
            "longitude": -122.4294,
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
            "verification_history": [],
            "last_verified": now - timedelta(days=15),
            "uptime_percentage": 87.3,
            "distance": 2.8,
            "notes": None,
            "created_at": now - timedelta(days=90),
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Electrify America",
            "address": "321 Park Avenue",
            "latitude": 37.7549,
            "longitude": -122.4394,
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
            "verification_history": [],
            "last_verified": now - timedelta(days=1),
            "uptime_percentage": 99.1,
            "distance": 3.5,
            "notes": None,
            "created_at": now - timedelta(days=200),
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Hidden Gem Charging - Local Cafe",
            "address": "789 Quiet Street",
            "latitude": 37.7599,
            "longitude": -122.4144,
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
            "verification_history": [],
            "last_verified": now - timedelta(days=30),
            "uptime_percentage": 78.5,
            "distance": 1.8,
            "notes": "Small cafe with 2 chargers",
            "created_at": now - timedelta(days=45),
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Community Charger - Park & Ride",
            "address": "555 Transit Way",
            "latitude": 37.7699,
            "longitude": -122.4244,
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
            "verification_history": [],
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
@api_router.post("/chargers")
async def add_charger(
    request: ChargerCreateRequest,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Add new charger (restricted for guests)"""
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(401, "Not authenticated")
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
    
    # Reward user with SharaCoins (5 for adding charger)
    coins_earned = 5
    await db.users.update_one(
        {"id": user.id},
        {"$inc": {"shara_coins": coins_earned, "chargers_added": 1}}
    )
    
    # Log coin transaction
    await log_coin_transaction(
        user.id,
        "add_charger",
        coins_earned,
        f"Added charger: {charger.name}"
    )
    
    # Award additional coins for photos
    if request.photos and len(request.photos) > 0:
        photo_coins = len(request.photos) * 3
        await db.users.update_one(
            {"id": user.id},
            {"$inc": {"shara_coins": photo_coins, "photos_uploaded": len(request.photos)}}
        )
        await log_coin_transaction(
            user.id,
            "upload_photo",
            photo_coins,
            f"Uploaded {len(request.photos)} photo(s) for {charger.name}"
        )
    
    return charger
@api_router.get("/chargers/{charger_id}")
async def get_charger_detail(
    charger_id: str,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get detailed charger information"""
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(401, "Not authenticated")
    charger = await db.chargers.find_one({"id": charger_id})
    if not charger:
        raise HTTPException(404, "Charger not found")
    return Charger(**charger)
@api_router.post("/chargers/{charger_id}/verify")
async def verify_charger(
    charger_id: str,
    request: VerificationActionRequest,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Add verification action to charger"""
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(401, "Not authenticated")
    if user.is_guest:
        raise HTTPException(403, "Please sign in to verify chargers")
    charger = await db.chargers.find_one({"id": charger_id})
    if not charger:
        raise HTTPException(404, "Charger not found")
    # Create verification action
    action = VerificationAction(
        user_id=user.id,
        action=request.action,
        notes=request.notes
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
    # Reward user with SharaCoins (2 for verification)
    coins_reward = 2
    await db.users.update_one(
        {"id": user.id},
        {"$inc": {"shara_coins": coins_reward, "verifications_count": 1}}
    )
    
    # Log coin transaction
    await log_coin_transaction(
        user.id,
        "verify_charger",
        coins_reward,
        f"Verified charger as {request.action}: {charger['name']}"
    )
    
    return {
        "message": "Verification recorded",
        "coins_earned": coins_reward,
        "new_level": new_level
    }
# Include router
app.include_router(api_router)
# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Helper function to log coin transactions
async def log_coin_transaction(user_id: str, action: str, amount: int, description: str):
    """Log a coin transaction"""
    transaction = CoinTransaction(
        user_id=user_id,
        action=action,
        amount=amount,
        description=description
    )
    await db.coin_transactions.insert_one(transaction.dict())
    return transaction

# Helper function to calculate trust score
async def calculate_trust_score(user_id: str) -> float:
    """Calculate user's trust score based on contributions"""
    user_doc = await db.users.find_one({"id": user_id})
    if not user_doc:
        return 0.0
    
    chargers_added = user_doc.get('chargers_added', 0)
    verifications_count = user_doc.get('verifications_count', 0)
    photos_uploaded = user_doc.get('photos_uploaded', 0)
    
    # Simple trust score formula (max 100)
    score = min(100, (chargers_added * 10) + (verifications_count * 2) + (photos_uploaded * 3))
    return round(score, 1)

# Profile & Wallet Routes
@api_router.get("/profile/activity")
async def get_user_activity(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get user's activity (submissions, verifications, reports)"""
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(401, "Not authenticated")
    
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

@api_router.get("/wallet/transactions")
async def get_coin_transactions(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get user's coin transaction history"""
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(401, "Not authenticated")
    
    transactions = await db.coin_transactions.find({"user_id": user.id}).sort("timestamp", -1).to_list(100)
    
    return {
        "total_coins": user.shara_coins,
        "coins_earned": user.shara_coins + user.coins_redeemed,
        "coins_redeemed": user.coins_redeemed,
        "transactions": transactions
    }

@api_router.put("/settings")
async def update_settings(
    theme: Optional[str] = None,
    notifications_enabled: Optional[bool] = None,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Update user settings"""
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(401, "Not authenticated")
    
    update_data = {}
    if theme is not None:
        update_data["theme"] = theme
    if notifications_enabled is not None:
        update_data["notifications_enabled"] = notifications_enabled
    
    if update_data:
        await db.users.update_one({"id": user.id}, {"$set": update_data})
    
    return {"message": "Settings updated successfully"}

@api_router.get("/profile/stats")
async def get_profile_stats(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get user profile statistics"""
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(401, "Not authenticated")
    
    trust_score = await calculate_trust_score(user.id)
    await db.users.update_one({"id": user.id}, {"$set": {"trust_score": trust_score}})
    
    return {
        "shara_coins": user.shara_coins,
        "chargers_added": user.chargers_added,
        "verifications_count": user.verifications_count,
        "photos_uploaded": user.photos_uploaded,
        "reports_submitted": user.reports_submitted,
        "trust_score": trust_score
    }


# Eco-Routing Models
class RouteSegment(BaseModel):
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    distance: float  # km
    elevation_gain: float  # meters
    traffic_factor: float  # 0-1
    speed_profile: str  # "slow", "moderate", "fast"

class EnergyPrediction(BaseModel):
    base_wh_per_km: float = 150.0  # Base consumption
    total_energy_kwh: float
    estimated_range_km: float
    factors: dict  # {"elevation": X, "traffic": Y, "temperature": Z}

class EcoRoute(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    origin: dict  # {"lat": X, "lng": Y, "address": "..."}
    destination: dict
    distance_km: float
    duration_minutes: float
    energy_prediction: EnergyPrediction
    eco_score: float  # 0-100
    reliability_score: float  # 0-100
    suggested_chargers: List[dict]  # Chargers along route
    weather_conditions: Optional[dict] = None
    terrain_summary: Optional[dict] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Eco-Routing Helper Functions
def calculate_energy_cost(segment: RouteSegment, temperature: float = 20.0) -> float:
    """Calculate energy cost for a route segment"""
    base_wh_per_km = 150.0
    
    # Elevation impact (20-30% increase per 100m gain)
    elevation_impact = (segment.elevation_gain / 100) * 0.25
    
    # Traffic impact (15% increase in heavy traffic)
    traffic_impact = segment.traffic_factor * 0.15
    
    # Temperature deviation impact (10% per 10°C deviation from 20°C)
    temp_deviation = abs(temperature - 20) / 10
    temp_impact = temp_deviation * 0.1
    
    # Speed profile impact
    speed_impact = {
        "slow": 0.05,  # AC overhead
        "moderate": 0.0,  # Optimal
        "fast": 0.2  # High speed inefficiency
    }.get(segment.speed_profile, 0.0)
    
    total_factor = 1.0 + elevation_impact + traffic_impact + temp_impact + speed_impact
    energy_wh = base_wh_per_km * segment.distance * total_factor
    
    return energy_wh

def calculate_eco_score(
    distance: float,
    energy_cost: float,
    reliability: float,
    weather_advantage: float
) -> float:
    """Calculate composite EcoScore (0-100, higher is better)"""
    # Normalize scores
    distance_score = max(0, 100 - (distance * 2))  # Prefer shorter routes
    energy_score = max(0, 100 - (energy_cost / 10))  # Lower energy = better
    reliability_score = reliability * 100  # Already 0-1
    weather_score = weather_advantage * 100
    
    # Weighted combination
    eco_score = (
        distance_score * 0.3 +
        energy_score * 0.4 +
        reliability_score * 0.2 +
        weather_score * 0.1
    )
    
    return round(eco_score, 1)

# Eco-Routing Endpoints
@api_router.post("/routing/calculate")
async def calculate_eco_route(
    origin_lat: float,
    origin_lng: float,
    destination_lat: float,
    destination_lng: float,
    battery_capacity_kwh: float = 60.0,
    current_battery_percent: float = 80.0,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Calculate eco-optimized route with energy predictions"""
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(401, "Not authenticated")
    
    # Mock route calculation (will integrate with Mapbox later)
    # For now, return a sample route
    
    # Calculate distance (simplified)
    from math import radians, sin, cos, sqrt, atan2
    R = 6371  # Earth radius in km
    lat1, lon1 = radians(origin_lat), radians(origin_lng)
    lat2, lon2 = radians(destination_lat), radians(destination_lng)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    distance_km = R * c
    
    # Mock energy calculation
    avg_wh_per_km = 160.0  # With some elevation/traffic
    total_energy_kwh = (distance_km * avg_wh_per_km) / 1000
    current_battery_kwh = battery_capacity_kwh * (current_battery_percent / 100)
    estimated_range = (current_battery_kwh / avg_wh_per_km) * 1000
    
    # Find chargers along route
    all_chargers = await db.chargers.find().to_list(100)
    suggested_chargers = []
    for charger in all_chargers[:3]:  # Mock: suggest first 3
        suggested_chargers.append({
            "id": charger.get("id"),
            "name": charger.get("name"),
            "distance_from_route": round(distance_km * 0.1, 2),
            "verification_level": charger.get("verification_level"),
            "available_ports": charger.get("available_ports", 0)
        })
    
    # Calculate eco score
    eco_score = calculate_eco_score(
        distance=distance_km,
        energy_cost=total_energy_kwh,
        reliability=0.85,  # Mock
        weather_advantage=0.7  # Mock
    )
    
    route = EcoRoute(
        name="Eco-Optimized Route",
        origin={"lat": origin_lat, "lng": origin_lng, "address": "Origin"},
        destination={"lat": destination_lat, "lng": destination_lng, "address": "Destination"},
        distance_km=round(distance_km, 2),
        duration_minutes=round(distance_km * 1.2, 0),  # Mock: ~50 km/h avg
        energy_prediction=EnergyPrediction(
            total_energy_kwh=round(total_energy_kwh, 2),
            estimated_range_km=round(estimated_range, 2),
            factors={
                "elevation": 0.15,
                "traffic": 0.10,
                "temperature": 0.05,
                "speed": 0.08
            }
        ),
        eco_score=eco_score,
        reliability_score=85.0,
        suggested_chargers=suggested_chargers,
        weather_conditions={"temp": 22, "condition": "clear"},
        terrain_summary={"elevation_gain": 120, "max_slope": 8}
    )
    
    return route

@api_router.get("/routing/chargers-along-route")
async def get_chargers_along_route(
    origin_lat: float,
    origin_lng: float,
    destination_lat: float,
    destination_lng: float,
    max_detour_km: float = 5.0,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get chargers along a route within specified detour distance"""
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(401, "Not authenticated")
    
    # Mock implementation - will add proper route-based filtering
    all_chargers = await db.chargers.find().to_list(100)
    
    # Return chargers with mock distance from route
    chargers_on_route = []
    for charger in all_chargers[:5]:
        chargers_on_route.append({
            **charger,
            "detour_km": round(max_detour_km * 0.6, 2),
            "time_detour_min": round(max_detour_km * 0.6 * 1.2, 0)
        })
    
    return chargers_on_route

