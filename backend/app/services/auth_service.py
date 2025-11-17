"""Authentication service business logic"""
from typing import Optional
import requests
from fastapi import HTTPException

from ..models.user import User
from ..schemas.auth import SignupRequest, LoginRequest, PreferencesUpdate
from ..core import (
    get_database,
    hash_password,
    verify_password,
    create_session,
)


async def signup_user(data: SignupRequest) -> tuple[User, str]:
    """Create a new user account"""
    db = get_database()

    # Check if email already exists
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(400, "Email already registered")

    # Create new user
    user = User(
        email=data.email,
        name=data.name,
        picture=None
    )

    # Store user with hashed password
    user_dict = user.dict()
    user_dict['password'] = hash_password(data.password)
    await db.users.insert_one(user_dict)

    # Create session
    session_token = await create_session(user.id)

    return user, session_token


async def login_user(data: LoginRequest) -> tuple[User, str]:
    """Login existing user"""
    db = get_database()

    # Find user by email
    user_doc = await db.users.find_one({"email": data.email})
    if not user_doc or 'password' not in user_doc:
        raise HTTPException(401, "Invalid credentials")

    # Verify password
    if not verify_password(data.password, user_doc['password']):
        raise HTTPException(401, "Invalid credentials")

    # Create user object (excluding password)
    user = User(**{k: v for k, v in user_doc.items() if k != 'password'})

    # Create session
    session_token = await create_session(user.id)

    return user, session_token


async def process_emergent_auth_session(session_id: str) -> tuple[User, str, str]:
    """Process Emergent Auth session ID"""
    # Call Emergent Auth API
    try:
        response = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        raise HTTPException(500, f"Failed to verify session: {str(e)}")

    db = get_database()

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

    return user, session_token, data.get('session_token')


async def create_guest_user() -> tuple[User, str]:
    """Create a guest user session"""
    import uuid

    db = get_database()

    guest = User(
        email=f"guest_{uuid.uuid4().hex[:8]}@example.com",
        name="Guest User",
        is_guest=True
    )
    await db.users.insert_one(guest.dict())

    session_token = await create_session(guest.id)

    return guest, session_token


async def logout_user(session_token: Optional[str]) -> None:
    """Logout user by deleting session"""
    if not session_token:
        return

    db = get_database()
    await db.user_sessions.delete_one({"session_token": session_token})


async def update_user_preferences(user: User, data: PreferencesUpdate) -> User:
    """Update user preferences"""
    db = get_database()

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
