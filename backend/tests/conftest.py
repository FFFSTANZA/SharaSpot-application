"""
Pytest configuration and fixtures for SharaSpot backend tests
"""
import pytest
import asyncio
from typing import AsyncGenerator, Generator
from unittest.mock import Mock, AsyncMock
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
import os

from app.core.database import Base, get_session
from app.core.db_models import User, Charger, VerificationAction, CoinTransaction
from app.core.security import hash_password, create_access_token
from app.main import app


# Test database URL (use in-memory SQLite for speed)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def db_engine():
    """Create test database engine"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture(scope="function")
async def db_session(db_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session"""
    async_session = async_sessionmaker(
        db_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

    async with async_session() as session:
        yield session


@pytest.fixture(scope="function")
def client(db_session):
    """Create test client with database override"""
    async def override_get_session():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_session] = override_get_session

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create test user"""
    user = User(
        email="test@example.com",
        password=hash_password("TestPassword123!"),
        name="Test User",
        port_type="ccs2",
        vehicle_type="sedan",
        shara_coins=100,
        trust_score=50,
        is_guest=False
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_admin_user(db_session: AsyncSession) -> User:
    """Create test admin user"""
    user = User(
        email="admin@example.com",
        password=hash_password("AdminPassword123!"),
        name="Admin User",
        port_type="ccs2",
        vehicle_type="sedan",
        shara_coins=1000,
        trust_score=100,
        is_guest=False,
        is_admin=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_guest_user(db_session: AsyncSession) -> User:
    """Create test guest user"""
    user = User(
        email=f"guest_{os.urandom(8).hex()}@sharaspot.com",
        password=hash_password("GuestPassword123!"),
        name="Guest User",
        is_guest=True,
        shara_coins=0,
        trust_score=0
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_high_trust_user(db_session: AsyncSession) -> User:
    """Create high-trust user for verification tests"""
    user = User(
        email="hightrust@example.com",
        password=hash_password("HighTrust123!"),
        name="High Trust User",
        port_type="ccs2",
        vehicle_type="sedan",
        shara_coins=500,
        trust_score=95,
        chargers_added=10,
        verifications_count=50,
        photos_uploaded=20,
        is_guest=False
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_charger(db_session: AsyncSession, test_user: User) -> Charger:
    """Create test charger"""
    charger = Charger(
        name="Test Charging Station",
        address="123 Test Street, Test City",
        latitude=28.6139,
        longitude=77.2090,
        port_types=["ccs2", "type2"],
        available_ports=3,
        total_ports=4,
        verification_level=3,
        source_type="community_manual",
        amenities=["restroom", "parking", "wifi"],
        photos=["https://example.com/photo1.jpg"],
        contributor_id=test_user.id
    )
    db_session.add(charger)
    await db_session.commit()
    await db_session.refresh(charger)
    return charger


@pytest.fixture
async def test_chargers(db_session: AsyncSession, test_user: User) -> list[Charger]:
    """Create multiple test chargers for filtering tests"""
    chargers = [
        Charger(
            name="Level 5 Charger",
            address="Level 5 Street",
            latitude=28.6139,
            longitude=77.2090,
            port_types=["ccs2"],
            total_ports=4,
            verification_level=5,
            source_type="official",
            contributor_id=test_user.id
        ),
        Charger(
            name="Level 3 Charger",
            address="Level 3 Street",
            latitude=28.6200,
            longitude=77.2100,
            port_types=["type2"],
            total_ports=2,
            verification_level=3,
            source_type="community_manual",
            amenities=["restroom"],
            contributor_id=test_user.id
        ),
        Charger(
            name="Level 1 Charger",
            address="Level 1 Street",
            latitude=28.6300,
            longitude=77.2200,
            port_types=["chademo"],
            total_ports=1,
            verification_level=1,
            source_type="community_manual",
            contributor_id=test_user.id
        ),
    ]

    for charger in chargers:
        db_session.add(charger)

    await db_session.commit()

    for charger in chargers:
        await db_session.refresh(charger)

    return chargers


@pytest.fixture
async def test_verification(db_session: AsyncSession, test_charger: Charger, test_user: User) -> VerificationAction:
    """Create test verification"""
    verification = VerificationAction(
        charger_id=test_charger.id,
        user_id=test_user.id,
        action="active",
        notes="Working perfectly",
        wait_time=5,
        port_type_used="ccs2",
        ports_available=3,
        charging_success=True,
        payment_method="app",
        station_lighting="excellent",
        cleanliness_rating=5,
        charging_speed_rating=4,
        amenities_rating=4,
        would_recommend=True
    )
    db_session.add(verification)
    await db_session.commit()
    await db_session.refresh(verification)
    return verification


@pytest.fixture
def auth_headers(test_user: User) -> dict:
    """Create authentication headers with valid token"""
    token = create_access_token({"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_auth_headers(test_admin_user: User) -> dict:
    """Create admin authentication headers"""
    token = create_access_token({"sub": str(test_admin_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def mock_s3_service():
    """Mock S3 service for photo uploads"""
    with pytest.mock.patch('app.services.s3_service.upload_photo') as mock:
        mock.return_value = "https://s3.amazonaws.com/sharaspot/test-photo.jpg"
        yield mock


@pytest.fixture
def mock_mapbox_api():
    """Mock Mapbox Directions API"""
    with pytest.mock.patch('app.services.routing_service.call_mapbox_directions_api') as mock:
        mock.return_value = {
            "routes": [{
                "distance": 15234.5,
                "duration": 1920.3,
                "geometry": "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
                "legs": [{
                    "steps": [{
                        "distance": 500,
                        "duration": 60,
                        "maneuver": {
                            "type": "turn",
                            "modifier": "right",
                            "instruction": "Turn right onto Park Avenue",
                            "location": [77.2095, 28.6145]
                        },
                        "voiceInstructions": [{
                            "distanceAlongGeometry": 450,
                            "announcement": "In 500 meters, turn right onto Park Avenue"
                        }]
                    }]
                }]
            }]
        }
        yield mock


@pytest.fixture
def mock_weather_api():
    """Mock OpenWeatherMap API"""
    with pytest.mock.patch('app.services.weather_service.get_weather') as mock:
        mock.return_value = {
            "temperature": 28,
            "wind_speed": 5.2,
            "humidity": 65,
            "conditions": "clear sky"
        }
        yield mock


@pytest.fixture
def mock_elevation_api():
    """Mock Open-Topo-Data elevation API"""
    with pytest.mock.patch('app.services.routing_service.fetch_elevation_data') as mock:
        mock.return_value = [215, 220, 225, 230, 235, 230, 225, 220]
        yield mock


# Test data fixtures

@pytest.fixture
def valid_signup_data() -> dict:
    """Valid signup data"""
    return {
        "email": "newuser@example.com",
        "password": "NewPassword123!",
        "name": "New User"
    }


@pytest.fixture
def valid_login_data() -> dict:
    """Valid login data"""
    return {
        "email": "test@example.com",
        "password": "TestPassword123!"
    }


@pytest.fixture
def valid_charger_data() -> dict:
    """Valid charger creation data"""
    return {
        "name": "New Charging Station",
        "address": "456 New Street, New City",
        "latitude": 28.5500,
        "longitude": 77.2500,
        "port_types": ["ccs2", "type2"],
        "total_ports": 4,
        "amenities": ["restroom", "parking"],
        "notes": "Available 24/7"
    }


@pytest.fixture
def valid_verification_data() -> dict:
    """Valid verification data"""
    return {
        "action": "active",
        "notes": "Working perfectly",
        "wait_time": 5,
        "port_type_used": "ccs2",
        "ports_available": 3,
        "charging_success": True,
        "payment_method": "app",
        "station_lighting": "excellent",
        "cleanliness_rating": 5,
        "charging_speed_rating": 4,
        "amenities_rating": 4,
        "would_recommend": True
    }


@pytest.fixture
def valid_route_request() -> dict:
    """Valid route calculation request"""
    return {
        "origin_lat": 28.6139,
        "origin_lng": 77.2090,
        "destination_lat": 28.5355,
        "destination_lng": 77.3910,
        "battery_capacity_kwh": 50.0,
        "current_battery_percent": 80,
        "vehicle_type": "sedan",
        "port_type": "ccs2"
    }


# Helper functions

def create_test_user_dict(**kwargs) -> dict:
    """Helper to create user dictionary with defaults"""
    defaults = {
        "email": "helper@example.com",
        "password": "HelperPassword123!",
        "name": "Helper User",
        "port_type": "ccs2",
        "vehicle_type": "sedan"
    }
    defaults.update(kwargs)
    return defaults


def create_test_charger_dict(**kwargs) -> dict:
    """Helper to create charger dictionary with defaults"""
    defaults = {
        "name": "Helper Charging Station",
        "address": "789 Helper Street",
        "latitude": 28.6000,
        "longitude": 77.2000,
        "port_types": ["ccs2"],
        "total_ports": 2
    }
    defaults.update(kwargs)
    return defaults
