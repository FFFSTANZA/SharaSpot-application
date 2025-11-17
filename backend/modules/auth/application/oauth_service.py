"""Google OAuth service"""
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from authlib.integrations.starlette_client import OAuth
from fastapi import HTTPException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db_models import User, OAuthToken, OAuthState
from modules.user.domain.user import User as UserModel
from app.core.config import settings
from app.core.security import create_session


def get_oauth_client():
    """Initialize OAuth client for Google"""
    oauth = OAuth()
    oauth.register(
        name='google',
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={
            'scope': 'openid email profile'
        }
    )
    return oauth


async def create_oauth_state(provider: str, redirect_uri: Optional[str], db: AsyncSession) -> str:
    """Create OAuth state for CSRF protection"""
    state = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.OAUTH_STATE_EXPIRE_SECONDS)

    oauth_state = OAuthState(
        state=state,
        provider=provider,
        redirect_uri=redirect_uri,
        expires_at=expires_at
    )

    db.add(oauth_state)
    await db.flush()

    return state


async def verify_oauth_state(state: str, provider: str, db: AsyncSession) -> Optional[str]:
    """Verify OAuth state and return redirect_uri if valid"""
    result = await db.execute(
        select(OAuthState).where(
            OAuthState.state == state,
            OAuthState.provider == provider
        )
    )
    oauth_state = result.scalar_one_or_none()

    if not oauth_state:
        return None

    # Check if expired
    if oauth_state.expires_at < datetime.now(timezone.utc):
        await db.delete(oauth_state)
        return None

    redirect_uri = oauth_state.redirect_uri

    # Delete used state
    await db.delete(oauth_state)

    return redirect_uri


async def cleanup_expired_oauth_states(db: AsyncSession):
    """Clean up expired OAuth states"""
    await db.execute(
        delete(OAuthState).where(
            OAuthState.expires_at < datetime.now(timezone.utc)
        )
    )


async def store_oauth_token(
    user_id: str,
    provider: str,
    access_token: str,
    refresh_token: Optional[str],
    expires_in: Optional[int],
    scope: Optional[str],
    db: AsyncSession
):
    """Store OAuth tokens securely server-side"""
    # Calculate expiration
    expires_at = None
    if expires_in:
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

    # Check if token already exists
    result = await db.execute(
        select(OAuthToken).where(
            OAuthToken.user_id == user_id,
            OAuthToken.provider == provider
        )
    )
    existing_token = result.scalar_one_or_none()

    if existing_token:
        # Update existing token
        existing_token.access_token = access_token
        existing_token.refresh_token = refresh_token
        existing_token.expires_at = expires_at
        existing_token.scope = scope
        existing_token.updated_at = datetime.now(timezone.utc)
    else:
        # Create new token
        oauth_token = OAuthToken(
            user_id=user_id,
            provider=provider,
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=expires_at,
            scope=scope
        )
        db.add(oauth_token)

    await db.flush()


async def process_google_oauth_callback(
    token: dict,
    userinfo: dict,
    db: AsyncSession
) -> tuple[UserModel, str]:
    """Process Google OAuth callback and create/update user"""
    email = userinfo.get('email')
    name = userinfo.get('name')
    picture = userinfo.get('picture')

    if not email:
        raise HTTPException(400, "Email not provided by Google")

    # Check if user exists
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        # Create new user (password is NULL for OAuth users)
        user = User(
            email=email,
            name=name or email.split('@')[0],
            picture=picture,
            password=None  # OAuth users don't have passwords
        )
        db.add(user)
        await db.flush()
    else:
        # Update user info if changed
        if name and user.name != name:
            user.name = name
        if picture and user.picture != picture:
            user.picture = picture
        await db.flush()

    # Store OAuth tokens securely server-side
    await store_oauth_token(
        user_id=user.id,
        provider='google',
        access_token=token.get('access_token'),
        refresh_token=token.get('refresh_token'),
        expires_in=token.get('expires_in'),
        scope=token.get('scope'),
        db=db
    )

    # Create session
    session_token = await create_session(user.id, db)

    # Convert to Pydantic model
    user_model = UserModel(
        id=user.id,
        email=user.email,
        name=user.name,
        picture=user.picture,
        port_type=user.port_type,
        vehicle_type=user.vehicle_type,
        distance_unit=user.distance_unit,
        is_guest=user.is_guest,
        shara_coins=user.shara_coins,
        verifications_count=user.verifications_count,
        chargers_added=user.chargers_added,
        photos_uploaded=user.photos_uploaded,
        reports_submitted=user.reports_submitted,
        coins_redeemed=user.coins_redeemed,
        trust_score=user.trust_score,
        theme=user.theme,
        notifications_enabled=user.notifications_enabled,
        created_at=user.created_at
    )

    return user_model, session_token
