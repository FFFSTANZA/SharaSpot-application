"""
Tests for authentication endpoints and services
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import patch, AsyncMock

from app.core.db_models import User
from app.services.auth_service import create_user, authenticate_user, create_guest_user
from app.core.security import verify_password, hash_password


class TestAuthService:
    """Test authentication service functions"""

    @pytest.mark.asyncio
    async def test_create_user(self, db_session: AsyncSession):
        """Test user creation"""
        user = await create_user(
            email="service@example.com",
            password="ServicePassword123!",
            name="Service Test User",
            db=db_session
        )

        assert user is not None
        assert user.email == "service@example.com"
        assert user.name == "Service Test User"
        assert user.password != "ServicePassword123!"  # Should be hashed
        assert verify_password("ServicePassword123!", user.password)
        assert user.is_guest is False
        assert user.shara_coins == 0
        assert user.trust_score == 0

    @pytest.mark.asyncio
    async def test_create_duplicate_user(self, db_session: AsyncSession, test_user: User):
        """Test that duplicate email raises error"""
        with pytest.raises(Exception):  # Should raise ValueError or similar
            await create_user(
                email=test_user.email,
                password="AnotherPassword123!",
                name="Duplicate User",
                db=db_session
            )

    @pytest.mark.asyncio
    async def test_authenticate_user_success(self, db_session: AsyncSession, test_user: User):
        """Test successful authentication"""
        user = await authenticate_user(
            email="test@example.com",
            password="TestPassword123!",
            db=db_session
        )

        assert user is not None
        assert user.id == test_user.id
        assert user.email == test_user.email

    @pytest.mark.asyncio
    async def test_authenticate_user_wrong_password(self, db_session: AsyncSession, test_user: User):
        """Test authentication with wrong password"""
        user = await authenticate_user(
            email="test@example.com",
            password="WrongPassword123!",
            db=db_session
        )

        assert user is None

    @pytest.mark.asyncio
    async def test_authenticate_user_nonexistent(self, db_session: AsyncSession):
        """Test authentication with non-existent email"""
        user = await authenticate_user(
            email="nonexistent@example.com",
            password="AnyPassword123!",
            db=db_session
        )

        assert user is None

    @pytest.mark.asyncio
    async def test_create_guest_user(self, db_session: AsyncSession):
        """Test guest user creation"""
        guest = await create_guest_user(db=db_session)

        assert guest is not None
        assert guest.is_guest is True
        assert "@sharaspot.com" in guest.email
        assert guest.name.startswith("Guest")
        assert guest.shara_coins == 0
        assert guest.trust_score == 0


class TestAuthEndpoints:
    """Test authentication API endpoints"""

    def test_signup_success(self, client: TestClient, valid_signup_data: dict):
        """Test successful user signup"""
        response = client.post("/api/auth/signup", json=valid_signup_data)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["needs_preferences"] is True

    def test_signup_duplicate_email(self, client: TestClient, test_user: User):
        """Test signup with duplicate email"""
        response = client.post("/api/auth/signup", json={
            "email": test_user.email,
            "password": "AnotherPassword123!",
            "name": "Another User"
        })

        assert response.status_code in [400, 409]  # Bad request or conflict

    def test_signup_invalid_email(self, client: TestClient):
        """Test signup with invalid email format"""
        response = client.post("/api/auth/signup", json={
            "email": "invalid-email",
            "password": "Password123!",
            "name": "Invalid User"
        })

        assert response.status_code == 422  # Validation error

    def test_signup_weak_password(self, client: TestClient):
        """Test signup with weak password"""
        response = client.post("/api/auth/signup", json={
            "email": "weak@example.com",
            "password": "weak",
            "name": "Weak Password User"
        })

        # Should fail validation (if password validation is implemented)
        assert response.status_code in [400, 422]

    def test_login_success(self, client: TestClient, test_user: User):
        """Test successful login"""
        response = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "TestPassword123!"
        })

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert "user" in data
        assert data["user"]["email"] == "test@example.com"

    def test_login_wrong_password(self, client: TestClient, test_user: User):
        """Test login with wrong password"""
        response = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "WrongPassword123!"
        })

        assert response.status_code == 401  # Unauthorized

    def test_login_nonexistent_user(self, client: TestClient):
        """Test login with non-existent user"""
        response = client.post("/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "AnyPassword123!"
        })

        assert response.status_code == 401  # Unauthorized

    def test_login_account_lockout(self, client: TestClient, test_user: User):
        """Test account lockout after multiple failed attempts"""
        # Make 5 failed login attempts
        for _ in range(5):
            response = client.post("/api/auth/login", json={
                "email": "test@example.com",
                "password": "WrongPassword!"
            })
            assert response.status_code == 401

        # 6th attempt should be locked
        response = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "TestPassword123!"  # Even correct password should fail
        })

        assert response.status_code == 403  # Forbidden (account locked)

    def test_get_current_user(self, client: TestClient, auth_headers: dict, test_user: User):
        """Test getting current user profile"""
        response = client.get("/api/auth/me", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["name"] == test_user.name
        assert "shara_coins" in data
        assert "trust_score" in data

    def test_get_current_user_unauthorized(self, client: TestClient):
        """Test getting current user without authentication"""
        response = client.get("/api/auth/me")

        assert response.status_code == 401  # Unauthorized

    def test_get_current_user_invalid_token(self, client: TestClient):
        """Test getting current user with invalid token"""
        response = client.get("/api/auth/me", headers={
            "Authorization": "Bearer invalid_token_here"
        })

        assert response.status_code == 401  # Unauthorized

    def test_create_guest_session(self, client: TestClient):
        """Test creating guest session"""
        response = client.post("/api/auth/guest")

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["is_guest"] is True
        assert "@sharaspot.com" in data["user"]["email"]

    def test_update_preferences(self, client: TestClient, auth_headers: dict):
        """Test updating user preferences"""
        response = client.put("/api/auth/preferences", headers=auth_headers, json={
            "port_type": "type2",
            "vehicle_type": "suv",
            "distance_unit": "miles"
        })

        assert response.status_code == 200
        data = response.json()
        assert data["user"]["port_type"] == "type2"
        assert data["user"]["vehicle_type"] == "suv"
        assert data["user"]["distance_unit"] == "miles"

    def test_update_preferences_unauthorized(self, client: TestClient):
        """Test updating preferences without authentication"""
        response = client.put("/api/auth/preferences", json={
            "port_type": "type2"
        })

        assert response.status_code == 401  # Unauthorized

    def test_logout(self, client: TestClient, auth_headers: dict):
        """Test logout"""
        response = client.post("/api/auth/logout", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    def test_refresh_token(self, client: TestClient, test_user: User):
        """Test token refresh"""
        # First login to get refresh token
        login_response = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "TestPassword123!"
        })
        refresh_token = login_response.json()["refresh_token"]

        # Use refresh token to get new access token
        response = client.post("/api/auth/refresh", json={
            "refresh_token": refresh_token
        })

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    @patch('app.services.oauth_service.initiate_google_oauth')
    def test_google_login_initiate(self, mock_oauth, client: TestClient):
        """Test Google OAuth initiation"""
        mock_oauth.return_value = "https://accounts.google.com/o/oauth2/v2/auth?..."

        response = client.get("/api/auth/google/login")

        assert response.status_code in [200, 302]  # OK or Redirect

    @patch('app.services.oauth_service.handle_google_callback')
    async def test_google_callback(self, mock_callback, client: TestClient):
        """Test Google OAuth callback"""
        mock_callback.return_value = {
            "user_id": "google_user_123",
            "email": "google@example.com",
            "name": "Google User"
        }

        response = client.get("/api/auth/google/callback?code=test_code&state=test_state")

        assert response.status_code in [200, 302]  # OK or Redirect


class TestPasswordSecurity:
    """Test password hashing and verification"""

    def test_password_hashing(self):
        """Test that passwords are properly hashed"""
        password = "TestPassword123!"
        hashed = hash_password(password)

        assert hashed != password
        assert len(hashed) > 50  # Bcrypt hashes are long
        assert hashed.startswith("$2b$")  # Bcrypt prefix

    def test_password_verification_success(self):
        """Test correct password verification"""
        password = "TestPassword123!"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_password_verification_failure(self):
        """Test incorrect password verification"""
        password = "TestPassword123!"
        wrong_password = "WrongPassword123!"
        hashed = hash_password(password)

        assert verify_password(wrong_password, hashed) is False

    def test_password_unique_hashes(self):
        """Test that same password produces different hashes (due to salt)"""
        password = "TestPassword123!"
        hash1 = hash_password(password)
        hash2 = hash_password(password)

        assert hash1 != hash2
        assert verify_password(password, hash1)
        assert verify_password(password, hash2)


class TestJWTTokens:
    """Test JWT token creation and validation"""

    def test_access_token_creation(self):
        """Test access token creation"""
        from app.core.security import create_access_token

        token = create_access_token({"sub": "user_id_123"})

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 50

    def test_refresh_token_creation(self):
        """Test refresh token creation"""
        from app.core.security import create_refresh_token

        token = create_refresh_token({"sub": "user_id_123"})

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 50

    def test_token_validation(self):
        """Test token validation"""
        from app.core.security import create_access_token, decode_token

        payload = {"sub": "user_id_123", "email": "test@example.com"}
        token = create_access_token(payload)

        decoded = decode_token(token)

        assert decoded is not None
        assert decoded["sub"] == "user_id_123"
        assert decoded["email"] == "test@example.com"

    def test_expired_token(self):
        """Test expired token validation"""
        from app.core.security import create_access_token, decode_token
        from datetime import timedelta

        # Create token that expires immediately
        token = create_access_token(
            {"sub": "user_id_123"},
            expires_delta=timedelta(seconds=-1)  # Negative = already expired
        )

        # Should fail validation
        with pytest.raises(Exception):  # Should raise JWTError
            decode_token(token)

    def test_invalid_token(self):
        """Test invalid token validation"""
        from app.core.security import decode_token

        invalid_token = "invalid.token.here"

        with pytest.raises(Exception):  # Should raise JWTError
            decode_token(invalid_token)
