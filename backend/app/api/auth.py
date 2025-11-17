"""Authentication API routes"""
from fastapi import APIRouter, Response, Depends, Header, Cookie, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from ..schemas.auth import SignupRequest, LoginRequest, PreferencesUpdate
from ..services import auth_service, oauth_service
from ..core.security import get_user_from_session
from ..core.database import get_session
from ..core.middleware import limiter
from ..core.config import settings
from ..models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup")
@limiter.limit(settings.AUTH_RATE_LIMIT)
async def signup(request: Request, data: SignupRequest, response: Response, db: AsyncSession = Depends(get_session)):
    """Email/Password signup"""
    user, session_token = await auth_service.signup_user(data, db)

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
@limiter.limit(settings.AUTH_RATE_LIMIT)
async def login(request: Request, data: LoginRequest, response: Response, db: AsyncSession = Depends(get_session)):
    """Email/Password login"""
    user, session_token = await auth_service.login_user(data, db)

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


@router.get("/me")
async def get_current_user(user: User = Depends(get_user_from_session)):
    """Get current user from session"""
    if not user:
        raise HTTPException(401, "Not authenticated")
    return user


@router.post("/guest")
@limiter.limit(settings.AUTH_RATE_LIMIT)
async def create_guest_session(request: Request, response: Response, db: AsyncSession = Depends(get_session)):
    """Create guest user session"""
    guest, session_token = await auth_service.create_guest_user(db)

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
    db: AsyncSession = Depends(get_session),
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
):
    """Logout user"""
    # Extract token from Authorization header or Cookie
    token = session_token
    if not token and authorization:
        if authorization.startswith('Bearer '):
            token = authorization[7:]

    await auth_service.logout_user(token, db)
    response.delete_cookie(key="session_token", path="/")

    return {"message": "Logged out successfully"}


@router.put("/preferences")
async def update_preferences(
    data: PreferencesUpdate,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_user_from_session)
):
    """Update user preferences"""
    if not user:
        raise HTTPException(401, "Not authenticated")

    updated_user = await auth_service.update_user_preferences(user, data, db)
    return updated_user


@router.get("/google/login")
async def google_login(
    request: Request,
    redirect_uri: Optional[str] = None,
    db: AsyncSession = Depends(get_session)
):
    """Initiate Google OAuth flow"""
    oauth = oauth_service.get_oauth_client()

    # Create OAuth state for CSRF protection
    state = await oauth_service.create_oauth_state('google', redirect_uri, db)
    await db.commit()

    # Get Google OAuth client
    google = oauth.create_client('google')

    # Generate authorization URL
    redirect_url = await google.authorize_redirect(
        request,
        redirect_uri=request.url_for('google_callback'),
        state=state
    )

    return redirect_url


@router.get("/google/callback")
async def google_callback(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_session)
):
    """Handle Google OAuth callback"""
    oauth = oauth_service.get_oauth_client()
    google = oauth.create_client('google')

    try:
        # Get authorization code and exchange for token
        token = await google.authorize_access_token(request)

        # Get user info from Google
        userinfo = token.get('userinfo')
        if not userinfo:
            # If userinfo not in token, fetch it
            resp = await google.get('https://www.googleapis.com/oauth2/v3/userinfo', token=token)
            userinfo = resp.json()

        # Verify state
        state = request.query_params.get('state')
        if not state:
            raise HTTPException(400, "Missing state parameter")

        original_redirect_uri = await oauth_service.verify_oauth_state(state, 'google', db)
        if original_redirect_uri is None:
            raise HTTPException(400, "Invalid or expired state")

        # Process OAuth callback and create/update user
        user, session_token = await oauth_service.process_google_oauth_callback(token, userinfo, db)
        await db.commit()

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

        # If mobile app redirect URI provided, redirect back to app with session token
        if original_redirect_uri:
            # For mobile apps, redirect with session token in URL
            redirect_url = f"{original_redirect_uri}?session_token={session_token}&needs_preferences={str(needs_preferences).lower()}"
            return RedirectResponse(url=redirect_url)

        # For web, return JSON response with user data
        return {
            "user": user,
            "session_token": session_token,
            "needs_preferences": needs_preferences
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(500, f"OAuth authentication failed: {str(e)}")
