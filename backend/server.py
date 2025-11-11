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
    # Reward user with SharaCoins
    await db.users.update_one(
        {"id": user.id},
        {"$inc": {"shara_coins": 50, "chargers_added": 1}}
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
    # Reward user with SharaCoins
    coins_reward = 10 if request.action == "active" else 5
    await db.users.update_one(
        {"id": user.id},
        {"$inc": {"shara_coins": coins_reward, "verifications_count": 1}}
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
