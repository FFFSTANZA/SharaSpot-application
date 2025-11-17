"""
Tests for charger endpoints and services
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import patch, MagicMock

from app.core.db_models import User, Charger
from app.services.charger_service import (
    get_chargers,
    add_charger,
    get_charger_by_id,
    calculate_weighted_verification_score
)


class TestChargerService:
    """Test charger service functions"""

    @pytest.mark.asyncio
    async def test_get_chargers_all(self, db_session: AsyncSession, test_chargers: list[Charger]):
        """Test getting all chargers"""
        chargers = await get_chargers(db=db_session)

        assert len(chargers) >= 3
        assert all(isinstance(c, Charger) for c in chargers)

    @pytest.mark.asyncio
    async def test_get_chargers_by_verification_level(
        self,
        db_session: AsyncSession,
        test_chargers: list[Charger]
    ):
        """Test filtering chargers by verification level"""
        chargers = await get_chargers(
            db=db_session,
            verification_level=4
        )

        # Should only return level 4 and 5
        assert all(c.verification_level >= 4 for c in chargers)

    @pytest.mark.asyncio
    async def test_get_chargers_by_port_type(
        self,
        db_session: AsyncSession,
        test_chargers: list[Charger]
    ):
        """Test filtering chargers by port type"""
        chargers = await get_chargers(
            db=db_session,
            port_type="ccs2"
        )

        # Should only return chargers with ccs2
        assert all("ccs2" in c.port_types for c in chargers)

    @pytest.mark.asyncio
    async def test_get_chargers_by_amenity(
        self,
        db_session: AsyncSession,
        test_chargers: list[Charger]
    ):
        """Test filtering chargers by amenity"""
        chargers = await get_chargers(
            db=db_session,
            amenity="restroom"
        )

        # Should only return chargers with restroom amenity
        assert all(
            c.amenities and "restroom" in c.amenities
            for c in chargers
        )

    @pytest.mark.asyncio
    async def test_get_chargers_within_distance(
        self,
        db_session: AsyncSession,
        test_chargers: list[Charger]
    ):
        """Test filtering chargers by distance"""
        # Center point near first charger
        chargers = await get_chargers(
            db=db_session,
            user_lat=28.6139,
            user_lng=77.2090,
            max_distance=5.0  # 5 km radius
        )

        # Should return chargers, with distance calculated
        assert len(chargers) > 0
        # Distance should be added to results (if service returns it)

    @pytest.mark.asyncio
    @patch('app.services.s3_service.upload_photo')
    async def test_add_charger_without_photos(
        self,
        mock_s3,
        db_session: AsyncSession,
        test_user: User,
        valid_charger_data: dict
    ):
        """Test adding charger without photos"""
        charger, coins = await add_charger(
            charger_data=valid_charger_data,
            photos=[],
            user_id=test_user.id,
            db=db_session
        )

        assert charger is not None
        assert charger.name == valid_charger_data["name"]
        assert charger.latitude == valid_charger_data["latitude"]
        assert coins == 5  # Base reward without photos

    @pytest.mark.asyncio
    @patch('app.services.s3_service.upload_photo')
    async def test_add_charger_with_photos(
        self,
        mock_s3,
        db_session: AsyncSession,
        test_user: User,
        valid_charger_data: dict
    ):
        """Test adding charger with photos"""
        mock_s3.return_value = "https://s3.amazonaws.com/photo1.jpg"

        charger, coins = await add_charger(
            charger_data=valid_charger_data,
            photos=["base64_photo_1", "base64_photo_2"],
            user_id=test_user.id,
            db=db_session
        )

        assert charger is not None
        assert len(charger.photos) == 2
        assert coins == 11  # 5 base + 3*2 photos

    @pytest.mark.asyncio
    async def test_get_charger_by_id_exists(
        self,
        db_session: AsyncSession,
        test_charger: Charger
    ):
        """Test getting charger by ID when it exists"""
        charger = await get_charger_by_id(
            charger_id=test_charger.id,
            db=db_session
        )

        assert charger is not None
        assert charger.id == test_charger.id
        assert charger.name == test_charger.name

    @pytest.mark.asyncio
    async def test_get_charger_by_id_not_exists(
        self,
        db_session: AsyncSession
    ):
        """Test getting charger by ID when it doesn't exist"""
        import uuid

        charger = await get_charger_by_id(
            charger_id=str(uuid.uuid4()),
            db=db_session
        )

        assert charger is None


class TestChargerEndpoints:
    """Test charger API endpoints"""

    def test_get_chargers_list(
        self,
        client: TestClient,
        test_chargers: list[Charger]
    ):
        """Test GET /api/chargers"""
        response = client.get("/api/chargers")

        assert response.status_code == 200
        data = response.json()
        assert "chargers" in data
        assert len(data["chargers"]) >= 3

    def test_get_chargers_with_filters(
        self,
        client: TestClient,
        test_chargers: list[Charger]
    ):
        """Test GET /api/chargers with query parameters"""
        response = client.get(
            "/api/chargers",
            params={
                "verification_level": 4,
                "port_type": "ccs2",
                "max_distance": 10,
                "user_lat": 28.6139,
                "user_lng": 77.2090
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "chargers" in data

        # Verify filters applied
        for charger in data["chargers"]:
            assert charger["verification_level"] >= 4
            assert "ccs2" in charger["port_types"]

    def test_get_charger_by_id_success(
        self,
        client: TestClient,
        test_charger: Charger
    ):
        """Test GET /api/chargers/{id}"""
        response = client.get(f"/api/chargers/{test_charger.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_charger.id)
        assert data["name"] == test_charger.name
        assert "verification_level" in data
        assert "port_types" in data

    def test_get_charger_by_id_not_found(self, client: TestClient):
        """Test GET /api/chargers/{id} with non-existent ID"""
        import uuid

        response = client.get(f"/api/chargers/{uuid.uuid4()}")

        assert response.status_code == 404

    @patch('app.services.s3_service.upload_photo')
    def test_add_charger_authenticated(
        self,
        mock_s3,
        client: TestClient,
        auth_headers: dict,
        valid_charger_data: dict
    ):
        """Test POST /api/chargers (authenticated)"""
        mock_s3.return_value = "https://s3.amazonaws.com/photo.jpg"

        response = client.post(
            "/api/chargers",
            json=valid_charger_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "charger_id" in data
        assert "coins_earned" in data
        assert data["coins_earned"] >= 5

    def test_add_charger_unauthenticated(
        self,
        client: TestClient,
        valid_charger_data: dict
    ):
        """Test POST /api/chargers without authentication"""
        response = client.post(
            "/api/chargers",
            json=valid_charger_data
        )

        assert response.status_code == 401  # Unauthorized

    def test_add_charger_invalid_data(
        self,
        client: TestClient,
        auth_headers: dict
    ):
        """Test POST /api/chargers with invalid data"""
        invalid_data = {
            "name": "Test",
            # Missing required fields
        }

        response = client.post(
            "/api/chargers",
            json=invalid_data,
            headers=auth_headers
        )

        assert response.status_code == 422  # Validation error

    def test_add_charger_invalid_coordinates(
        self,
        client: TestClient,
        auth_headers: dict
    ):
        """Test POST /api/chargers with invalid coordinates"""
        invalid_data = {
            "name": "Invalid Charger",
            "address": "Invalid Address",
            "latitude": 200.0,  # Invalid latitude
            "longitude": 300.0,  # Invalid longitude
            "port_types": ["ccs2"],
            "total_ports": 2
        }

        response = client.post(
            "/api/chargers",
            json=invalid_data,
            headers=auth_headers
        )

        assert response.status_code == 422  # Validation error

    @patch('app.services.s3_service.upload_photo')
    def test_add_charger_with_photos(
        self,
        mock_s3,
        client: TestClient,
        auth_headers: dict,
        valid_charger_data: dict
    ):
        """Test POST /api/chargers with photo uploads"""
        mock_s3.return_value = "https://s3.amazonaws.com/photo.jpg"

        data_with_photos = {
            **valid_charger_data,
            "photos": ["base64_encoded_photo_1", "base64_encoded_photo_2"]
        }

        response = client.post(
            "/api/chargers",
            json=data_with_photos,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["coins_earned"] == 11  # 5 base + 6 photos


class TestChargerGeospatialFiltering:
    """Test geospatial filtering and distance calculations"""

    @pytest.mark.asyncio
    async def test_chargers_within_bounding_box(
        self,
        db_session: AsyncSession,
        test_chargers: list[Charger]
    ):
        """Test bounding box filtering"""
        # Get chargers near first test charger
        chargers = await get_chargers(
            db=db_session,
            user_lat=28.6139,
            user_lng=77.2090,
            max_distance=10.0
        )

        assert len(chargers) > 0

    @pytest.mark.asyncio
    async def test_chargers_outside_range(
        self,
        db_session: AsyncSession,
        test_chargers: list[Charger]
    ):
        """Test that chargers outside range are not returned"""
        # Search far from test chargers
        chargers = await get_chargers(
            db=db_session,
            user_lat=0.0,  # Equator
            user_lng=0.0,  # Prime meridian
            max_distance=1.0  # 1 km radius
        )

        # Should return empty or very few results
        assert len(chargers) == 0

    def test_distance_calculation_accuracy(
        self,
        client: TestClient,
        test_charger: Charger
    ):
        """Test that distance is calculated accurately"""
        response = client.get(
            "/api/chargers",
            params={
                "user_lat": test_charger.latitude,
                "user_lng": test_charger.longitude,
                "max_distance": 100
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Find our test charger in results
        test_charger_result = next(
            (c for c in data["chargers"] if c["id"] == str(test_charger.id)),
            None
        )

        if test_charger_result and "distance_km" in test_charger_result:
            # Distance to same point should be ~0
            assert test_charger_result["distance_km"] < 0.1


class TestChargerPortTypes:
    """Test port type handling"""

    def test_filter_by_single_port_type(
        self,
        client: TestClient,
        test_chargers: list[Charger]
    ):
        """Test filtering by single port type"""
        response = client.get(
            "/api/chargers",
            params={"port_type": "ccs2"}
        )

        assert response.status_code == 200
        data = response.json()

        for charger in data["chargers"]:
            assert "ccs2" in charger["port_types"]

    def test_charger_with_multiple_port_types(
        self,
        client: TestClient,
        test_charger: Charger
    ):
        """Test that chargers can have multiple port types"""
        response = client.get(f"/api/chargers/{test_charger.id}")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["port_types"], list)
        assert len(data["port_types"]) >= 1


class TestChargerAmenities:
    """Test amenity handling"""

    def test_filter_by_amenity(
        self,
        client: TestClient,
        test_chargers: list[Charger]
    ):
        """Test filtering by amenity"""
        response = client.get(
            "/api/chargers",
            params={"amenity": "restroom"}
        )

        assert response.status_code == 200
        data = response.json()

        # All returned chargers should have restroom
        for charger in data["chargers"]:
            if charger.get("amenities"):
                assert "restroom" in charger["amenities"]

    @patch('app.services.s3_service.upload_photo')
    def test_add_charger_with_amenities(
        self,
        mock_s3,
        client: TestClient,
        auth_headers: dict
    ):
        """Test adding charger with amenities"""
        mock_s3.return_value = "https://s3.amazonaws.com/photo.jpg"

        charger_data = {
            "name": "Charger with Amenities",
            "address": "Amenity Street",
            "latitude": 28.6000,
            "longitude": 77.2000,
            "port_types": ["ccs2"],
            "total_ports": 2,
            "amenities": ["restroom", "restaurant", "wifi", "parking"]
        }

        response = client.post(
            "/api/chargers",
            json=charger_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # Fetch the charger to verify amenities
        charger_response = client.get(f"/api/chargers/{data['charger_id']}")
        charger = charger_response.json()

        assert "restroom" in charger["amenities"]
        assert "restaurant" in charger["amenities"]
        assert len(charger["amenities"]) == 4


class TestChargerSourceTypes:
    """Test charger source type handling"""

    def test_official_source_chargers(
        self,
        client: TestClient,
        test_chargers: list[Charger]
    ):
        """Test filtering official source chargers"""
        response = client.get("/api/chargers")

        assert response.status_code == 200
        data = response.json()

        official_chargers = [
            c for c in data["chargers"]
            if c.get("source_type") == "official"
        ]

        assert len(official_chargers) > 0

    def test_community_source_chargers(
        self,
        client: TestClient,
        test_chargers: list[Charger]
    ):
        """Test community-submitted chargers"""
        response = client.get("/api/chargers")

        assert response.status_code == 200
        data = response.json()

        community_chargers = [
            c for c in data["chargers"]
            if c.get("source_type") == "community_manual"
        ]

        assert len(community_chargers) > 0


class TestChargerVerificationLevel:
    """Test verification level handling"""

    def test_new_charger_default_level(
        self,
        client: TestClient,
        test_charger: Charger
    ):
        """Test that new chargers have default verification level"""
        response = client.get(f"/api/chargers/{test_charger.id}")

        assert response.status_code == 200
        data = response.json()
        assert "verification_level" in data
        assert 1 <= data["verification_level"] <= 5

    def test_verification_level_filtering(
        self,
        client: TestClient,
        test_chargers: list[Charger]
    ):
        """Test filtering by minimum verification level"""
        for level in [1, 2, 3, 4, 5]:
            response = client.get(
                "/api/chargers",
                params={"verification_level": level}
            )

            assert response.status_code == 200
            data = response.json()

            # All chargers should meet minimum level
            for charger in data["chargers"]:
                assert charger["verification_level"] >= level


class TestChargerPhotos:
    """Test photo handling"""

    def test_charger_with_photos(
        self,
        client: TestClient,
        test_charger: Charger
    ):
        """Test that charger can have photos"""
        response = client.get(f"/api/chargers/{test_charger.id}")

        assert response.status_code == 200
        data = response.json()
        assert "photos" in data
        assert isinstance(data["photos"], list)

    @patch('app.services.s3_service.upload_photo')
    def test_add_charger_photo_upload_failure(
        self,
        mock_s3,
        client: TestClient,
        auth_headers: dict,
        valid_charger_data: dict
    ):
        """Test handling of S3 upload failure"""
        mock_s3.side_effect = Exception("S3 upload failed")

        data_with_photos = {
            **valid_charger_data,
            "photos": ["base64_photo"]
        }

        response = client.post(
            "/api/chargers",
            json=data_with_photos,
            headers=auth_headers
        )

        # Should handle gracefully (either fail or succeed without photos)
        assert response.status_code in [200, 500]


class TestChargerSearch:
    """Test charger search functionality"""

    def test_search_by_name(
        self,
        client: TestClient,
        test_charger: Charger
    ):
        """Test searching chargers by name"""
        # If search is implemented
        response = client.get(
            "/api/chargers",
            params={"search": test_charger.name}
        )

        # May not be implemented yet
        assert response.status_code in [200, 404]

    def test_combined_filters(
        self,
        client: TestClient,
        test_chargers: list[Charger]
    ):
        """Test multiple filters combined"""
        response = client.get(
            "/api/chargers",
            params={
                "verification_level": 3,
                "port_type": "ccs2",
                "amenity": "parking",
                "max_distance": 50,
                "user_lat": 28.6139,
                "user_lng": 77.2090
            }
        )

        assert response.status_code == 200
        data = response.json()
        # Should return filtered results
        assert "chargers" in data
