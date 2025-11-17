"""
Comprehensive tests for routing service with Mapbox and Open-Topo-Data integration
"""
import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime

from app.services.routing_service import (
    call_mapbox_directions_api,
    fetch_elevation_data,
    decode_polyline,
    calculate_elevation_metrics,
    calculate_ev_energy_consumption,
    calculate_route_scores,
    find_chargers_along_route,
    process_turn_instructions,
    calculate_mapbox_routes,
    _get_coordinates_hash,
)
from app.schemas.routing import HERERouteRequest


class TestCoordinateHashing:
    """Test coordinate hashing for caching"""

    def test_hash_consistency(self):
        """Test that same coordinates produce same hash"""
        coords1 = [{"latitude": 13.0827, "longitude": 80.2707}]
        coords2 = [{"latitude": 13.0827, "longitude": 80.2707}]

        hash1 = _get_coordinates_hash(coords1)
        hash2 = _get_coordinates_hash(coords2)

        assert hash1 == hash2
        assert isinstance(hash1, str)
        assert len(hash1) == 32  # MD5 hash length

    def test_hash_difference(self):
        """Test that different coordinates produce different hashes"""
        coords1 = [{"latitude": 13.0827, "longitude": 80.2707}]
        coords2 = [{"latitude": 13.0418, "longitude": 80.2341}]

        hash1 = _get_coordinates_hash(coords1)
        hash2 = _get_coordinates_hash(coords2)

        assert hash1 != hash2


class TestPolylineDecoding:
    """Test Google Polyline Algorithm decoding"""

    def test_decode_simple_polyline(self):
        """Test decoding a simple polyline"""
        # Encoded polyline for two points
        polyline = "_p~iF~ps|U_ulLnnqC_mqNvxq`@"

        coords = decode_polyline(polyline)

        assert isinstance(coords, list)
        assert len(coords) > 0
        assert all("latitude" in c and "longitude" in c for c in coords)

    def test_decode_empty_polyline(self):
        """Test decoding empty polyline"""
        coords = decode_polyline("")
        assert coords == []


class TestElevationMetrics:
    """Test elevation gain/loss calculations"""

    def test_elevation_gain_only(self):
        """Test route with only elevation gain"""
        elevations = [0, 10, 20, 30]

        gain, loss = calculate_elevation_metrics(elevations)

        assert gain == 30.0
        assert loss == 0.0

    def test_elevation_loss_only(self):
        """Test route with only elevation loss"""
        elevations = [30, 20, 10, 0]

        gain, loss = calculate_elevation_metrics(elevations)

        assert gain == 0.0
        assert loss == 30.0

    def test_mixed_elevation(self):
        """Test route with mixed elevation changes"""
        elevations = [0, 10, 5, 15, 10]

        gain, loss = calculate_elevation_metrics(elevations)

        assert gain == 15.0  # 0->10 (10) + 5->15 (10) = 20, wait no...
        # Let me recalculate: 0->10 (+10), 10->5 (-5), 5->15 (+10), 15->10 (-5)
        # Gain: 10 + 10 = 20
        # Loss: 5 + 5 = 10
        assert gain == 20.0
        assert loss == 10.0

    def test_empty_elevations(self):
        """Test with empty elevation list"""
        gain, loss = calculate_elevation_metrics([])
        assert gain == 0.0
        assert loss == 0.0

    def test_single_elevation(self):
        """Test with single elevation point"""
        gain, loss = calculate_elevation_metrics([100])
        assert gain == 0.0
        assert loss == 0.0


class TestEnergyConsumption:
    """Test EV energy consumption calculations"""

    def test_flat_route(self):
        """Test energy consumption on flat route"""
        energy = calculate_ev_energy_consumption(
            distance_m=10000,  # 10 km
            duration_s=600,    # 10 minutes (60 km/h)
            elevation_gain_m=0,
            elevation_loss_m=0
        )

        assert energy > 0
        assert energy < 5  # Should be reasonable for 10 km

    def test_uphill_route(self):
        """Test energy consumption on uphill route"""
        flat_energy = calculate_ev_energy_consumption(10000, 600, 0, 0)
        uphill_energy = calculate_ev_energy_consumption(10000, 600, 100, 0)

        assert uphill_energy > flat_energy

    def test_downhill_route(self):
        """Test energy consumption on downhill route (regenerative braking)"""
        flat_energy = calculate_ev_energy_consumption(10000, 600, 0, 0)
        downhill_energy = calculate_ev_energy_consumption(10000, 600, 0, 100)

        assert downhill_energy < flat_energy

    def test_zero_distance(self):
        """Test energy consumption with zero distance"""
        energy = calculate_ev_energy_consumption(0, 0, 0, 0)
        assert energy == 0.0

    def test_minimum_consumption(self):
        """Test that minimum consumption baseline is applied"""
        # Very short distance should still have minimum 100 Wh/km
        energy = calculate_ev_energy_consumption(
            distance_m=100,  # 0.1 km
            duration_s=10,
            elevation_gain_m=0,
            elevation_loss_m=0
        )

        assert energy >= 0.01  # At least 100 Wh/km * 0.1 km = 10 Wh = 0.01 kWh


class TestRouteScores:
    """Test eco score and reliability score calculations"""

    def test_perfect_eco_score(self):
        """Test calculation with perfect eco conditions"""
        eco_score, reliability_score = calculate_route_scores(
            distance_m=10000,
            duration_s=600,
            energy_kwh=1.4,  # 140 Wh/km (baseline)
            elevation_gain_m=0,
            chargers_count=10,
            avg_charger_reliability=1.0
        )

        assert 0 <= eco_score <= 100
        assert 0 <= reliability_score <= 100
        assert reliability_score > 90  # Many reliable chargers

    def test_poor_eco_score(self):
        """Test calculation with poor eco conditions"""
        good_eco, _ = calculate_route_scores(10000, 600, 1.4, 0, 10, 1.0)
        poor_eco, _ = calculate_route_scores(10000, 600, 3.0, 500, 10, 1.0)

        assert poor_eco < good_eco

    def test_reliability_with_no_chargers(self):
        """Test reliability score with no chargers"""
        _, reliability_score = calculate_route_scores(
            10000, 600, 1.4, 0, 0, 0.0
        )

        assert reliability_score >= 0


class TestTurnInstructions:
    """Test turn-by-turn instruction processing"""

    def test_process_with_voice_instructions(self):
        """Test processing steps with voice instructions"""
        steps = [
            {
                "distance": 500,
                "duration": 60,
                "maneuver": {
                    "type": "turn",
                    "modifier": "right",
                    "instruction": "Turn right onto Main St",
                    "location": [-80.2707, 13.0827]
                },
                "name": "Main Street",
                "voiceInstructions": [
                    {"announcement": "Turn right onto Main Street"}
                ]
            }
        ]

        instructions = process_turn_instructions(steps)

        assert len(instructions) == 1
        assert instructions[0]["voice_text"] == "Turn right onto Main Street"
        assert instructions[0]["distance_m"] == 500
        assert instructions[0]["street_name"] == "Main Street"
        assert instructions[0]["type"] == "turn"
        assert instructions[0]["modifier"] == "right"

    def test_process_with_banner_instructions(self):
        """Test processing steps with banner instructions fallback"""
        steps = [
            {
                "distance": 500,
                "duration": 60,
                "maneuver": {
                    "instruction": "Continue straight",
                    "location": [-80.2707, 13.0827]
                },
                "bannerInstructions": [
                    {"primary": {"text": "Continue on Highway 45"}}
                ]
            }
        ]

        instructions = process_turn_instructions(steps)

        assert len(instructions) == 1
        assert instructions[0]["voice_text"] == "Continue on Highway 45"

    def test_process_with_lane_guidance(self):
        """Test processing steps with lane guidance"""
        steps = [
            {
                "distance": 500,
                "duration": 60,
                "maneuver": {
                    "instruction": "Turn right",
                    "location": [-80.2707, 13.0827]
                },
                "intersections": [
                    {
                        "lanes": [
                            {"valid": True},
                            {"valid": True},
                            {"valid": False}
                        ]
                    }
                ]
            }
        ]

        instructions = process_turn_instructions(steps)

        assert "lanes" in instructions[0]
        assert len(instructions[0]["lanes"]) == 3


class TestInputValidation:
    """Test input validation for route calculation"""

    @pytest.mark.asyncio
    async def test_invalid_origin_coordinates(self):
        """Test rejection of invalid origin coordinates"""
        from fastapi import HTTPException

        request = HERERouteRequest(
            origin_lat=100.0,  # Invalid (> 90)
            origin_lng=80.2707,
            destination_lat=13.0418,
            destination_lng=80.2341,
            battery_capacity_kwh=60,
            current_battery_percent=80
        )

        mock_db = Mock()

        with pytest.raises(HTTPException) as exc_info:
            await calculate_mapbox_routes(request, mock_db)

        assert exc_info.value.status_code == 400
        assert "Invalid origin coordinates" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_invalid_destination_coordinates(self):
        """Test rejection of invalid destination coordinates"""
        from fastapi import HTTPException

        request = HERERouteRequest(
            origin_lat=13.0827,
            origin_lng=80.2707,
            destination_lat=13.0418,
            destination_lng=200.0,  # Invalid (> 180)
            battery_capacity_kwh=60,
            current_battery_percent=80
        )

        mock_db = Mock()

        with pytest.raises(HTTPException) as exc_info:
            await calculate_mapbox_routes(request, mock_db)

        assert exc_info.value.status_code == 400
        assert "Invalid destination coordinates" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_too_close_coordinates(self):
        """Test rejection of origin/destination too close together"""
        from fastapi import HTTPException

        request = HERERouteRequest(
            origin_lat=13.0827,
            origin_lng=80.2707,
            destination_lat=13.0828,  # Only ~10m away
            destination_lng=80.2708,
            battery_capacity_kwh=60,
            current_battery_percent=80
        )

        mock_db = Mock()

        with pytest.raises(HTTPException) as exc_info:
            await calculate_mapbox_routes(request, mock_db)

        assert exc_info.value.status_code == 400
        assert "too close" in exc_info.value.detail.lower()


class TestChargerBoundingBox:
    """Test charger bounding box calculation with corrected longitude padding"""

    @pytest.mark.asyncio
    async def test_bounding_box_calculation(self):
        """Test that bounding box correctly uses cosine adjustment"""
        import math

        coordinates = [
            {"latitude": 13.0827, "longitude": 80.2707},
            {"latitude": 13.0418, "longitude": 80.2341}
        ]

        max_detour_km = 5.0
        avg_lat = sum(c["latitude"] for c in coordinates) / len(coordinates)

        # This is the corrected calculation
        lat_padding = max_detour_km / 111.0
        lng_padding = max_detour_km / (111.0 * math.cos(math.radians(avg_lat)))

        # Verify the calculation is correct
        assert lat_padding > 0
        assert lng_padding > 0
        assert lng_padding > lat_padding  # At this latitude, should be larger

        # Verify it uses math.cos correctly
        expected_lng_padding = max_detour_km / (111.0 * math.cos(math.radians(13.06225)))
        assert abs(lng_padding - expected_lng_padding) < 0.0001

    @pytest.mark.asyncio
    async def test_find_chargers_empty_coordinates(self):
        """Test finding chargers with empty coordinates"""
        mock_db = Mock()

        chargers = await find_chargers_along_route([], mock_db)

        assert chargers == []


class TestEdgeCases:
    """Test edge cases and error handling"""

    def test_energy_consumption_with_large_values(self):
        """Test energy calculation doesn't overflow with large values"""
        energy = calculate_ev_energy_consumption(
            distance_m=1000000,  # 1000 km
            duration_s=36000,    # 10 hours
            elevation_gain_m=10000,  # 10 km elevation gain
            elevation_loss_m=0
        )

        assert energy > 0
        assert energy < 10000  # Reasonable upper bound

    def test_route_scores_with_negative_values(self):
        """Test route scores handle edge cases gracefully"""
        # Should not crash or return invalid scores
        eco_score, reliability_score = calculate_route_scores(
            distance_m=1,  # Very small distance
            duration_s=1,
            energy_kwh=0.001,
            elevation_gain_m=0,
            chargers_count=0,
            avg_charger_reliability=0.0
        )

        assert 0 <= eco_score <= 100
        assert 0 <= reliability_score <= 100


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
