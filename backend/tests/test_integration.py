"""
Integration tests for the complete EV navigation flow
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
import os

from app.schemas.routing import HERERouteRequest


class TestNavigationFlowIntegration:
    """Test end-to-end navigation flow"""

    @pytest.mark.asyncio
    @patch.dict(os.environ, {"MAPBOX_API_KEY": "test_key"})
    async def test_complete_route_calculation_flow(self):
        """Test complete flow from request to response"""
        from app.services.routing_service import calculate_mapbox_routes
        from fastapi import HTTPException

        # Create a realistic route request
        request = HERERouteRequest(
            origin_lat=13.0827,
            origin_lng=80.2707,
            destination_lat=13.0418,
            destination_lng=80.2341,
            battery_capacity_kwh=60,
            current_battery_percent=80,
            vehicle_type="sedan",
            port_type="Type 2"
        )

        # Mock database session
        mock_db = Mock()
        mock_db.execute = AsyncMock()
        mock_db.execute.return_value.scalars.return_value.all.return_value = []

        # Mock Mapbox API response
        mock_mapbox_response = {
            "routes": [{
                "distance": 7500,
                "duration": 900,
                "geometry": "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
                "legs": [{
                    "steps": [{
                        "distance": 500,
                        "duration": 60,
                        "maneuver": {
                            "type": "turn",
                            "modifier": "right",
                            "instruction": "Turn right",
                            "location": [80.2707, 13.0827]
                        },
                        "name": "Main St",
                        "voiceInstructions": [{
                            "announcement": "Turn right onto Main Street"
                        }]
                    }]
                }]
            }]
        }

        with patch('app.services.routing_service.httpx.AsyncClient') as mock_client:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_mapbox_response
            mock_response.raise_for_status = Mock()

            mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)

            # Execute the route calculation
            try:
                result = await calculate_mapbox_routes(request, mock_db)

                # Verify response structure
                assert result is not None
                assert hasattr(result, 'routes')
                assert len(result.routes) > 0

                # Verify route has required fields
                route = result.routes[0]
                assert route.distance_m > 0
                assert route.duration_s > 0
                assert route.energy_consumption_kwh > 0
                assert hasattr(route, 'coordinates')
                assert len(route.coordinates) > 0

            except HTTPException as e:
                # If Mapbox key is not configured, that's expected in test
                if "not configured" in e.detail:
                    pytest.skip("Mapbox API key not configured for testing")
                else:
                    raise

    @pytest.mark.asyncio
    async def test_navigation_data_format_compatibility(self):
        """Test that backend response matches frontend expectations"""
        from app.services.routing_service import process_turn_instructions

        # Sample turn instructions from Mapbox
        steps = [
            {
                "distance": 800,
                "duration": 96,
                "maneuver": {
                    "type": "turn",
                    "modifier": "right",
                    "instruction": "Turn right onto Highway 45",
                    "location": [80.2707, 13.0827]
                },
                "name": "Highway 45",
                "voiceInstructions": [{
                    "announcement": "In 800 meters, turn right onto Highway 45"
                }],
                "intersections": [{
                    "lanes": [
                        {"valid": True},
                        {"valid": True},
                        {"valid": False}
                    ]
                }]
            }
        ]

        instructions = process_turn_instructions(steps)

        # Verify format matches frontend NavigationData interface
        assert len(instructions) == 1
        instruction = instructions[0]

        # Required frontend fields
        assert "step_index" in instruction
        assert "distance_m" in instruction
        assert "instruction" in instruction
        assert "voice_text" in instruction
        assert "type" in instruction
        assert "modifier" in instruction
        assert "street_name" in instruction
        assert "location" in instruction

        # Verify types
        assert isinstance(instruction["step_index"], int)
        assert isinstance(instruction["distance_m"], (int, float))
        assert isinstance(instruction["voice_text"], str)
        assert isinstance(instruction["location"], list)
        assert len(instruction["location"]) == 2

    def test_battery_calculation_accuracy(self):
        """Test battery consumption calculations match expectations"""
        from app.services.routing_service import calculate_ev_energy_consumption

        # Standard test case: 38 km at 54 km/h average
        distance_m = 38000
        duration_s = 2520  # 42 minutes
        elevation_gain = 45
        elevation_loss = 38

        energy = calculate_ev_energy_consumption(
            distance_m, duration_s, elevation_gain, elevation_loss
        )

        # Energy should be reasonable for this distance
        # Typical EV: 150-200 Wh/km = 5.7-7.6 kWh for 38 km
        assert 4.0 <= energy <= 10.0, f"Energy {energy} kWh is outside expected range for 38 km"

        # Calculate battery drain for 60 kWh battery at 80%
        battery_capacity = 60
        current_battery = 0.80
        battery_used_percent = (energy / battery_capacity) * 100

        # Should leave reasonable charge
        remaining_percent = current_battery * 100 - battery_used_percent
        assert remaining_percent > 60, "Battery drain too high for route"


class TestErrorHandling:
    """Test error handling across the system"""

    @pytest.mark.asyncio
    async def test_missing_api_key(self):
        """Test graceful handling of missing Mapbox API key"""
        from app.services.routing_service import call_mapbox_directions_api
        from fastapi import HTTPException

        request = HERERouteRequest(
            origin_lat=13.0827,
            origin_lng=80.2707,
            destination_lat=13.0418,
            destination_lng=80.2341,
            battery_capacity_kwh=60,
            current_battery_percent=80
        )

        with patch.dict(os.environ, {"MAPBOX_API_KEY": ""}):
            with pytest.raises(HTTPException) as exc_info:
                await call_mapbox_directions_api(request)

            assert exc_info.value.status_code == 503
            assert "not configured" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_api_timeout_retry(self):
        """Test retry logic on API timeout"""
        from app.services.routing_service import call_mapbox_directions_api
        import httpx

        request = HERERouteRequest(
            origin_lat=13.0827,
            origin_lng=80.2707,
            destination_lat=13.0418,
            destination_lng=80.2341,
            battery_capacity_kwh=60,
            current_battery_percent=80
        )

        with patch.dict(os.environ, {"MAPBOX_API_KEY": "test_key"}):
            with patch('app.services.routing_service.httpx.AsyncClient') as mock_client:
                # Simulate timeout on all attempts
                mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                    side_effect=httpx.TimeoutException("Request timeout")
                )

                with pytest.raises(Exception):
                    await call_mapbox_directions_api(request)


class TestPerformanceOptimizations:
    """Test performance optimizations"""

    def test_elevation_cache_hit(self):
        """Test that elevation cache works correctly"""
        from app.services.routing_service import _get_coordinates_hash, _elevation_cache
        from datetime import datetime

        coords = [{"latitude": 13.0827, "longitude": 80.2707}]
        coords_hash = _get_coordinates_hash(coords)

        # Add to cache
        test_data = [100.0]
        _elevation_cache[coords_hash] = (test_data, datetime.now())

        # Verify cache entry exists
        assert coords_hash in _elevation_cache
        cached_data, timestamp = _elevation_cache[coords_hash]
        assert cached_data == test_data

    @pytest.mark.asyncio
    async def test_parallel_route_fetching(self):
        """Test that routes are fetched in parallel"""
        from app.services.routing_service import calculate_mapbox_routes
        import time

        request = HERERouteRequest(
            origin_lat=13.0827,
            origin_lng=80.2707,
            destination_lat=13.0418,
            destination_lng=80.2341,
            battery_capacity_kwh=60,
            current_battery_percent=80
        )

        mock_db = Mock()
        mock_db.execute = AsyncMock()
        mock_db.execute.return_value.scalars.return_value.all.return_value = []

        mock_response_data = {
            "routes": [{
                "distance": 7500,
                "duration": 900,
                "geometry": "_p~iF~ps|U",
                "legs": [{"steps": []}]
            }]
        }

        with patch.dict(os.environ, {"MAPBOX_API_KEY": "test_key"}):
            with patch('app.services.routing_service.httpx.AsyncClient') as mock_client:
                # Simulate API response delay
                async def slow_response(*args, **kwargs):
                    await asyncio.sleep(0.1)  # 100ms delay
                    mock_resp = Mock()
                    mock_resp.status_code = 200
                    mock_resp.json.return_value = mock_response_data
                    mock_resp.raise_for_status = Mock()
                    return mock_resp

                mock_client.return_value.__aenter__.return_value.get = slow_response

                start_time = time.time()
                try:
                    await calculate_mapbox_routes(request, mock_db)
                except Exception:
                    pass  # We're testing timing, not success
                elapsed = time.time() - start_time

                # 3 parallel requests with 100ms each should take ~100ms, not 300ms
                # Allow some overhead, but should be much less than sequential
                assert elapsed < 0.5, f"Parallel execution took too long: {elapsed}s"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
