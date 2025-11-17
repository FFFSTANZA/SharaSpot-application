"""Authentication API routes"""
from fastapi import APIRouter, Response, Cookie, Header, HTTPException
from typing import Optional

from ..schemas.auth import SignupRequest, LoginRequest, PreferencesUpdate
from ..services import auth_service
from ..core.security import get_user_from_session

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup")
async def signup(data: SignupRequest, response: Response):
    """Email/Password signup"""
    user, session_token = await auth_service.signup_user(data)

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


@router.post("/login")
async def login(data: LoginRequest, response: Response):
    """Email/Password login"""
    user, session_token = await auth_service.login_user(data)

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


@router.get("/session-data")
async def get_session_data(x_session_id: Optional[str] = Header(None)):
    """Process Emergent Auth session ID"""
    if not x_session_id:
        raise HTTPException(400, "Session ID required")

    user, session_token, emergent_token = await auth_service.process_emergent_auth_session(x_session_id)

    needs_preferences = not (user.port_type and user.vehicle_type)
    return {
        "user": user,
        "session_token": session_token,
        "emergent_session_token": emergent_token,
        "needs_preferences": needs_preferences
    }


@router.get("/me")
async def get_current_user(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Get current user from session"""
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(401, "Not authenticated")
    return user


@router.post("/guest")
async def create_guest_session(response: Response):
    """Create guest user session"""
    guest, session_token = await auth_service.create_guest_user()

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


@router.post("/logout")
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

    await auth_service.logout_user(token)
    response.delete_cookie(key="session_token", path="/")

    return {"message": "Logged out successfully"}


@router.put("/preferences")
async def update_preferences(
    data: PreferencesUpdate,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Update user preferences"""
    user = await get_user_from_session(session_token, authorization)
    if not user:
        raise HTTPException(401, "Not authenticated")

    updated_user = await auth_service.update_user_preferences(user, data)
    return updated_user
