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


# HERE API Integration Models
class HERERouteRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    destination_lat: float
    destination_lng: float
    battery_capacity_kwh: float = 60.0
    current_battery_percent: float = 80.0
    vehicle_type: str = "sedan"
    port_type: str = "Type 2"

class RouteAlternative(BaseModel):
    id: str
    type: str  # "eco", "balanced", "fastest", "shortest"
    distance_m: int
    duration_s: int
    base_time_s: int  # Without traffic
    polyline: str  # Encoded polyline
    coordinates: List[dict]  # Decoded coordinates
    energy_consumption_kwh: float
    elevation_gain_m: int
    elevation_loss_m: int
    eco_score: float
    reliability_score: float
    summary: dict

class HERERouteResponse(BaseModel):
    routes: List[RouteAlternative]
    chargers_along_route: List[dict]
    weather_data: Optional[dict] = None
    traffic_incidents: List[dict] = []

# HERE API Helper Functions
async def call_here_routing_api(request: HERERouteRequest) -> dict:
    """
    Call HERE Routing API v8 for EV routing
    Returns mock data until API key is provided
    """
    here_api_key = os.environ.get('HERE_API_KEY', None)
    
    if not here_api_key:
        # Return mock HERE-style response
        return generate_mock_here_response(request)
    
    # Real HERE API call (when key is available)
    try:
        here_url = "https://router.hereapi.com/v8/routes"
        
        # HERE API parameters for EV routing
        params = {
            "apiKey": here_api_key,
            "transportMode": "car",
            "origin": f"{request.origin_lat},{request.origin_lng}",
            "destination": f"{request.destination_lat},{request.destination_lng}",
            "return": "polyline,summary,elevation,routeHandle,actions",
            "alternatives": "3",  # Get 3 route alternatives
            "ev[freeFlowSpeedTable]": "0,0.239,27,0.239,45,0.259,60,0.196,75,0.207,90,0.238,100,0.26,110,0.296,120,0.337,130,0.351",
            "ev[trafficSpeedTable]": "0,0.349,27,0.319,45,0.329,60,0.266,75,0.287,90,0.318,100,0.33,110,0.335,120,0.35,130,0.36",
            "ev[ascent]": "9",
            "ev[descent]": "4.3",
            "ev[makeReachable]": "true",
            "spans": "names,length,duration,baseDuration,elevation,consumption",
        }
        
        response = requests.get(here_url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
        
    except Exception as e:
        logging.error(f"HERE API error: {str(e)}")
        # Fallback to mock data
        return generate_mock_here_response(request)

def generate_mock_here_response(request: HERERouteRequest) -> dict:
    """Generate mock HERE API response for testing"""
    from math import radians, sin, cos, sqrt, atan2
    
    # Calculate straight-line distance
    R = 6371000  # Earth radius in meters
    lat1, lon1 = radians(request.origin_lat), radians(request.origin_lng)
    lat2, lon2 = radians(request.destination_lat), radians(request.destination_lng)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    distance_m = int(R * c)
    
    # Generate 3 route alternatives with different characteristics
    routes = []
    
    # Route 1: Eco-Optimized (lowest energy)
    eco_distance = distance_m * 1.08  # Slightly longer for energy efficiency
    eco_duration = int(eco_distance / 13.9)  # ~50 km/h average
    eco_energy = (eco_distance / 1000) * 0.145  # 145 Wh/km (efficient)
    routes.append({
        "id": "route_eco",
        "sections": [{
            "type": "vehicle",
            "transport": {"mode": "car"},
            "summary": {
                "duration": eco_duration,
                "length": int(eco_distance),
                "baseDuration": int(eco_duration * 0.85),
                "consumption": int(eco_energy * 1000)  # Wh
            },
            "polyline": generate_mock_polyline(request.origin_lat, request.origin_lng, 
                                               request.destination_lat, request.destination_lng, 8),
            "spans": [
                {
                    "offset": 0,
                    "elevation": {"rise": 85, "fall": 45},
                    "consumption": int(eco_energy * 1000)
                }
            ]
        }]
    })
    
    # Route 2: Balanced (good mix)
    balanced_distance = distance_m * 1.03
    balanced_duration = int(balanced_distance / 15.3)  # ~55 km/h average
    balanced_energy = (balanced_distance / 1000) * 0.165  # 165 Wh/km
    routes.append({
        "id": "route_balanced",
        "sections": [{
            "type": "vehicle",
            "transport": {"mode": "car"},
            "summary": {
                "duration": balanced_duration,
                "length": int(balanced_distance),
                "baseDuration": int(balanced_duration * 0.88),
                "consumption": int(balanced_energy * 1000)
            },
            "polyline": generate_mock_polyline(request.origin_lat, request.origin_lng,
                                               request.destination_lat, request.destination_lng, 6),
            "spans": [
                {
                    "offset": 0,
                    "elevation": {"rise": 120, "fall": 65},
                    "consumption": int(balanced_energy * 1000)
                }
            ]
        }]
    })
    
    # Route 3: Fastest (shortest time)
    fastest_distance = distance_m * 0.98
    fastest_duration = int(fastest_distance / 18.1)  # ~65 km/h average
    fastest_energy = (fastest_distance / 1000) * 0.195  # 195 Wh/km (high speed)
    routes.append({
        "id": "route_fastest",
        "sections": [{
            "type": "vehicle",
            "transport": {"mode": "car"},
            "summary": {
                "duration": fastest_duration,
                "length": int(fastest_distance),
                "baseDuration": int(fastest_duration * 0.92),
                "consumption": int(fastest_energy * 1000)
            },
            "polyline": generate_mock_polyline(request.origin_lat, request.origin_lng,
                                               request.destination_lat, request.destination_lng, 4),
            "spans": [
                {
                    "offset": 0,
                    "elevation": {"rise": 180, "fall": 95},
                    "consumption": int(fastest_energy * 1000)
                }
            ]
        }]
    })
    
    return {"routes": routes}

def generate_mock_polyline(start_lat: float, start_lng: float, 
                           end_lat: float, end_lng: float, points: int = 5) -> str:
    """Generate a mock polyline between two points"""
    # Simple linear interpolation
    coords = []
    for i in range(points + 1):
        t = i / points
        lat = start_lat + (end_lat - start_lat) * t
        lng = start_lng + (end_lng - start_lng) * t
        coords.append({"lat": lat, "lng": lng})
    
    # Return as simplified encoded string (for mock)
    return f"mock_polyline_{points}_points"

def decode_polyline_coordinates(polyline: str, start_lat: float, start_lng: float,
                                end_lat: float, end_lng: float) -> List[dict]:
    """Decode polyline to coordinates (simplified for mock)"""
    if polyline.startswith("mock_polyline"):
        points = int(polyline.split("_")[2])
        coords = []
        for i in range(points + 1):
            t = i / points
            lat = start_lat + (end_lat - start_lat) * t
            lng = start_lng + (end_lng - start_lng) * t
            coords.append({"latitude": lat, "longitude": lng})
        return coords
    
    # Real HERE polyline decoding would go here
    return []

def calculate_route_scores(route_data: dict, chargers_count: int, 
                          avg_charger_reliability: float) -> tuple:
    """Calculate eco score and reliability score for a route"""
    section = route_data["sections"][0]
    summary = section["summary"]
    
    distance_km = summary["length"] / 1000
    duration_min = summary["duration"] / 60
    energy_kwh = summary["consumption"] / 1000  # Convert Wh to kWh
    
    # Get elevation data
    elevation_rise = 0
    elevation_fall = 0
    if "spans" in section and len(section["spans"]) > 0:
        elev_data = section["spans"][0].get("elevation", {})
        elevation_rise = elev_data.get("rise", 0)
        elevation_fall = elev_data.get("fall", 0)
    
    # Calculate Eco Score (0-100, higher is better)
    # Factors: energy efficiency (50%), distance efficiency (30%), elevation (20%)
    energy_efficiency = max(0, 100 - (energy_kwh / distance_km - 0.14) * 500)  # Baseline 140 Wh/km
    distance_efficiency = max(0, 100 - distance_km)
    elevation_penalty = max(0, 100 - (elevation_rise / 10))
    
    eco_score = (
        energy_efficiency * 0.5 +
        distance_efficiency * 0.3 +
        elevation_penalty * 0.2
    )
    
    # Calculate Reliability Score based on chargers along route
    reliability_score = min(100, avg_charger_reliability * 100 + chargers_count * 2)
    
    return round(eco_score, 1), round(reliability_score, 1)

async def find_chargers_along_route(coordinates: List[dict], max_detour_km: float = 5.0) -> List[dict]:
    """Find SharaSpot chargers along the route"""
    all_chargers = await db.chargers.find().to_list(1000)
    
    route_chargers = []
    for charger in all_chargers:
        # Calculate minimum distance from charger to any point on route
        min_distance = float('inf')
        for coord in coordinates[::max(1, len(coordinates) // 20)]:  # Sample every ~5% of route
            distance = calculate_distance(
                charger["latitude"], charger["longitude"],
                coord["latitude"], coord["longitude"]
            )
            min_distance = min(min_distance, distance)
        
        # If charger is within max detour distance, include it
        if min_distance <= max_detour_km:
            route_chargers.append({
                "id": charger["id"],
                "name": charger["name"],
                "address": charger["address"],
                "latitude": charger["latitude"],
                "longitude": charger["longitude"],
                "port_types": charger["port_types"],
                "available_ports": charger["available_ports"],
                "total_ports": charger["total_ports"],
                "verification_level": charger["verification_level"],
                "uptime_percentage": charger["uptime_percentage"],
                "distance_from_route_km": round(min_distance, 2),
                "amenities": charger.get("amenities", [])
            })
    
    # Sort by distance from route
    route_chargers.sort(key=lambda x: x["distance_from_route_km"])
    
    return route_chargers[:10]  # Return top 10 closest chargers

def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two points in km"""
    from math import radians, sin, cos, sqrt, atan2
    R = 6371  # Earth radius in km
    
    lat1, lon1 = radians(lat1), radians(lng1)
    lat2, lon2 = radians(lat2), radians(lng2)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c

# HERE Routing Endpoints
@api_router.post("/routing/here/calculate")
async def calculate_here_routes(
    request: HERERouteRequest,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Calculate EV routes using HERE API with SharaSpot charger integration"""
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(401, "Not authenticated")
    
    try:
        # Call HERE API
        here_response = await call_here_routing_api(request)
        
        if "routes" not in here_response:
            raise HTTPException(500, "Invalid response from routing service")
        
        # Process routes
        processed_routes = []
        route_types = ["eco", "balanced", "fastest"]
        
        for idx, route_data in enumerate(here_response["routes"][:3]):
            section = route_data["sections"][0]
            summary = section["summary"]
            
            # Decode polyline to coordinates
            coordinates = decode_polyline_coordinates(
                section.get("polyline", ""),
                request.origin_lat, request.origin_lng,
                request.destination_lat, request.destination_lng
            )
            
            # Find chargers along this route
            chargers = await find_chargers_along_route(coordinates, max_detour_km=5.0)
            
            # Calculate average charger reliability
            avg_reliability = sum(c["uptime_percentage"] for c in chargers) / len(chargers) if chargers else 0.75
            
            # Calculate scores
            eco_score, reliability_score = calculate_route_scores(
                route_data, len(chargers), avg_reliability / 100
            )
            
            # Get elevation data
            elevation_rise = 0
            elevation_fall = 0
            if "spans" in section and len(section["spans"]) > 0:
                elev_data = section["spans"][0].get("elevation", {})
                elevation_rise = elev_data.get("rise", 0)
                elevation_fall = elev_data.get("fall", 0)
            
            route_type = route_types[idx] if idx < len(route_types) else "alternative"
            
            processed_route = RouteAlternative(
                id=route_data.get("id", f"route_{idx}"),
                type=route_type,
                distance_m=summary["length"],
                duration_s=summary["duration"],
                base_time_s=summary.get("baseDuration", summary["duration"]),
                polyline=section.get("polyline", ""),
                coordinates=coordinates,
                energy_consumption_kwh=summary["consumption"] / 1000,  # Convert Wh to kWh
                elevation_gain_m=elevation_rise,
                elevation_loss_m=elevation_fall,
                eco_score=eco_score,
                reliability_score=reliability_score,
                summary={
                    "distance_km": round(summary["length"] / 1000, 2),
                    "duration_min": round(summary["duration"] / 60, 1),
                    "avg_speed_kmh": round((summary["length"] / 1000) / (summary["duration"] / 3600), 1),
                    "chargers_available": len(chargers),
                    "traffic_delay_min": round((summary["duration"] - summary.get("baseDuration", summary["duration"])) / 60, 1)
                }
            )
            
            processed_routes.append({
                "route": processed_route,
                "chargers": chargers[:5]  # Top 5 chargers for each route
            })
        
        # Mock weather data (until HERE weather integration)
        weather_data = {
            "temperature_c": 22,
            "condition": "Clear",
            "wind_speed_kmh": 12,
            "humidity_percent": 65
        }
        
        return HERERouteResponse(
            routes=[item["route"] for item in processed_routes],
            chargers_along_route=processed_routes[0]["chargers"] if processed_routes else [],
            weather_data=weather_data,
            traffic_incidents=[]
        )
        
    except Exception as e:
        logging.error(f"Route calculation error: {str(e)}")
        raise HTTPException(500, f"Failed to calculate routes: {str(e)}")

