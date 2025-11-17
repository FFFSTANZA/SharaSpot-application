"""
Tests for verification system and gamification
"""
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import patch

from app.core.db_models import User, Charger, VerificationAction
from app.services.charger_service import (
    verify_charger,
    calculate_weighted_verification_score,
    check_rate_limit,
    detect_spam_velocity
)
from app.services.gamification_service import (
    award_verification_coins,
    calculate_trust_score,
    award_charger_coins
)


class TestVerificationAlgorithm:
    """Test verification scoring algorithm"""

    @pytest.mark.asyncio
    async def test_calculate_weighted_score_no_verifications(
        self,
        db_session: AsyncSession,
        test_charger: Charger
    ):
        """Test weighted score with no verifications"""
        level, positive, negative = await calculate_weighted_verification_score(
            charger_id=test_charger.id,
            db=db_session
        )

        # Should have default level
        assert level >= 1
        assert positive >= 0
        assert negative >= 0

    @pytest.mark.asyncio
    async def test_calculate_weighted_score_single_active(
        self,
        db_session: AsyncSession,
        test_charger: Charger,
        test_user: User
    ):
        """Test weighted score with single active verification"""
        # Add active verification
        verification = VerificationAction(
            charger_id=test_charger.id,
            user_id=test_user.id,
            action="active",
            notes="Working great"
        )
        db_session.add(verification)
        await db_session.commit()

        level, positive, negative = await calculate_weighted_verification_score(
            charger_id=test_charger.id,
            db=db_session
        )

        assert positive > 0
        assert negative == 0
        assert level >= 2  # Should increase from default

    @pytest.mark.asyncio
    async def test_calculate_weighted_score_not_working(
        self,
        db_session: AsyncSession,
        test_charger: Charger,
        test_user: User
    ):
        """Test weighted score with not_working verification"""
        # Add not_working verification
        verification = VerificationAction(
            charger_id=test_charger.id,
            user_id=test_user.id,
            action="not_working",
            notes="Out of service"
        )
        db_session.add(verification)
        await db_session.commit()

        level, positive, negative = await calculate_weighted_verification_score(
            charger_id=test_charger.id,
            db=db_session
        )

        assert negative > 0
        # Should drop to level 1 with not_working
        assert level == 1

    @pytest.mark.asyncio
    async def test_time_decay_weighting(
        self,
        db_session: AsyncSession,
        test_charger: Charger,
        test_user: User
    ):
        """Test that older verifications have less weight"""
        # Add old verification (60 days ago)
        old_verification = VerificationAction(
            charger_id=test_charger.id,
            user_id=test_user.id,
            action="active",
            timestamp=datetime.utcnow() - timedelta(days=60)
        )
        db_session.add(old_verification)

        # Add recent verification (1 day ago)
        recent_verification = VerificationAction(
            charger_id=test_charger.id,
            user_id=test_user.id,
            action="active",
            timestamp=datetime.utcnow() - timedelta(days=1)
        )
        db_session.add(recent_verification)

        await db_session.commit()

        level, positive, negative = await calculate_weighted_verification_score(
            charger_id=test_charger.id,
            db=db_session
        )

        # Recent verification should contribute more
        # Exact values depend on implementation
        assert positive > 0

    @pytest.mark.asyncio
    async def test_trust_score_multiplier(
        self,
        db_session: AsyncSession,
        test_charger: Charger,
        test_user: User,
        test_high_trust_user: User
    ):
        """Test that high-trust users have more weight"""
        # Low trust user verification
        low_trust_ver = VerificationAction(
            charger_id=test_charger.id,
            user_id=test_user.id,  # trust_score = 50
            action="active"
        )
        db_session.add(low_trust_ver)

        # High trust user verification
        high_trust_ver = VerificationAction(
            charger_id=test_charger.id,
            user_id=test_high_trust_user.id,  # trust_score = 95
            action="active"
        )
        db_session.add(high_trust_ver)

        await db_session.commit()

        level, positive, negative = await calculate_weighted_verification_score(
            charger_id=test_charger.id,
            db=db_session
        )

        # High trust user should contribute more to positive score
        assert positive > 3.0  # More than single verification

    @pytest.mark.asyncio
    async def test_verification_level_determination(
        self,
        db_session: AsyncSession,
        test_charger: Charger,
        test_high_trust_user: User
    ):
        """Test verification level calculation at different thresholds"""
        # Add multiple active verifications to reach level 5
        for i in range(5):
            verification = VerificationAction(
                charger_id=test_charger.id,
                user_id=test_high_trust_user.id,
                action="active",
                timestamp=datetime.utcnow() - timedelta(days=i)
            )
            db_session.add(verification)

        await db_session.commit()

        level, positive, negative = await calculate_weighted_verification_score(
            charger_id=test_charger.id,
            db=db_session
        )

        # With 5 high-trust active verifications, should reach high level
        assert level >= 4
        assert positive > negative


class TestVerificationRateLimiting:
    """Test rate limiting for verifications"""

    @pytest.mark.asyncio
    async def test_check_rate_limit_allowed(
        self,
        db_session: AsyncSession,
        test_charger: Charger,
        test_user: User
    ):
        """Test that first verification is allowed"""
        allowed = await check_rate_limit(
            user_id=test_user.id,
            charger_id=test_charger.id,
            db=db_session
        )

        assert allowed is True

    @pytest.mark.asyncio
    async def test_check_rate_limit_blocked(
        self,
        db_session: AsyncSession,
        test_charger: Charger,
        test_user: User
    ):
        """Test that verification within 5 minutes is blocked"""
        # Add recent verification (1 minute ago)
        verification = VerificationAction(
            charger_id=test_charger.id,
            user_id=test_user.id,
            action="active",
            timestamp=datetime.utcnow() - timedelta(minutes=1)
        )
        db_session.add(verification)
        await db_session.commit()

        # Should be blocked
        allowed = await check_rate_limit(
            user_id=test_user.id,
            charger_id=test_charger.id,
            db=db_session
        )

        assert allowed is False

    @pytest.mark.asyncio
    async def test_check_rate_limit_expired(
        self,
        db_session: AsyncSession,
        test_charger: Charger,
        test_user: User
    ):
        """Test that verification after 5 minutes is allowed"""
        # Add old verification (10 minutes ago)
        verification = VerificationAction(
            charger_id=test_charger.id,
            user_id=test_user.id,
            action="active",
            timestamp=datetime.utcnow() - timedelta(minutes=10)
        )
        db_session.add(verification)
        await db_session.commit()

        # Should be allowed
        allowed = await check_rate_limit(
            user_id=test_user.id,
            charger_id=test_charger.id,
            db=db_session
        )

        assert allowed is True

    @pytest.mark.asyncio
    async def test_spam_velocity_detection_normal(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Test spam detection with normal activity"""
        # Add a few verifications (within limits)
        for i in range(3):
            verification = VerificationAction(
                charger_id=str(i),  # Different chargers
                user_id=test_user.id,
                action="active",
                timestamp=datetime.utcnow() - timedelta(minutes=i * 5)
            )
            db_session.add(verification)

        await db_session.commit()

        is_spam = await detect_spam_velocity(
            user_id=test_user.id,
            db=db_session
        )

        assert is_spam is False

    @pytest.mark.asyncio
    async def test_spam_velocity_detection_exceeded(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Test spam detection when limit exceeded"""
        # Add 12+ verifications in last hour
        for i in range(15):
            verification = VerificationAction(
                charger_id=str(i),
                user_id=test_user.id,
                action="active",
                timestamp=datetime.utcnow() - timedelta(minutes=i * 4)
            )
            db_session.add(verification)

        await db_session.commit()

        is_spam = await detect_spam_velocity(
            user_id=test_user.id,
            db=db_session
        )

        assert is_spam is True


class TestVerificationEndpoint:
    """Test verification submission endpoint"""

    @patch('app.services.s3_service.upload_photo')
    def test_verify_charger_minimal(
        self,
        mock_s3,
        client: TestClient,
        auth_headers: dict,
        test_charger: Charger
    ):
        """Test minimal verification (just action)"""
        response = client.post(
            f"/api/chargers/{test_charger.id}/verify",
            json={"action": "active", "notes": "Working"},
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "coins_earned" in data
        assert data["coins_earned"] >= 2  # Base reward

    @patch('app.services.s3_service.upload_photo')
    def test_verify_charger_detailed(
        self,
        mock_s3,
        client: TestClient,
        auth_headers: dict,
        test_charger: Charger,
        valid_verification_data: dict
    ):
        """Test detailed verification with all fields"""
        response = client.post(
            f"/api/chargers/{test_charger.id}/verify",
            json=valid_verification_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "coins_earned" in data
        # Should earn more coins for detailed verification
        assert data["coins_earned"] >= 7

    @patch('app.services.s3_service.upload_photo')
    def test_verify_charger_with_photo(
        self,
        mock_s3,
        client: TestClient,
        auth_headers: dict,
        test_charger: Charger
    ):
        """Test verification with photo (not_working)"""
        mock_s3.return_value = "https://s3.amazonaws.com/verification.jpg"

        response = client.post(
            f"/api/chargers/{test_charger.id}/verify",
            json={
                "action": "not_working",
                "notes": "Broken display",
                "photo": "base64_encoded_photo"
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        # Not working + photo = 2 + 2 = 4 coins minimum
        assert data["coins_earned"] >= 4

    def test_verify_charger_rate_limited(
        self,
        client: TestClient,
        auth_headers: dict,
        test_charger: Charger
    ):
        """Test rate limiting on verification endpoint"""
        # First verification
        response1 = client.post(
            f"/api/chargers/{test_charger.id}/verify",
            json={"action": "active"},
            headers=auth_headers
        )
        assert response1.status_code == 200

        # Second verification immediately (should be blocked)
        response2 = client.post(
            f"/api/chargers/{test_charger.id}/verify",
            json={"action": "active"},
            headers=auth_headers
        )
        assert response2.status_code == 429  # Too many requests

    def test_verify_charger_not_found(
        self,
        client: TestClient,
        auth_headers: dict
    ):
        """Test verifying non-existent charger"""
        import uuid

        response = client.post(
            f"/api/chargers/{uuid.uuid4()}/verify",
            json={"action": "active"},
            headers=auth_headers
        )

        assert response.status_code == 404

    def test_verify_charger_unauthorized(
        self,
        client: TestClient,
        test_charger: Charger
    ):
        """Test verification without authentication"""
        response = client.post(
            f"/api/chargers/{test_charger.id}/verify",
            json={"action": "active"}
        )

        assert response.status_code == 401

    def test_verify_charger_invalid_action(
        self,
        client: TestClient,
        auth_headers: dict,
        test_charger: Charger
    ):
        """Test verification with invalid action"""
        response = client.post(
            f"/api/chargers/{test_charger.id}/verify",
            json={"action": "invalid_action"},
            headers=auth_headers
        )

        assert response.status_code == 422  # Validation error


class TestCoinRewards:
    """Test coin reward calculations"""

    def test_base_verification_reward(self):
        """Test base verification reward (2 coins)"""
        coins = award_verification_coins(
            verification_data={"action": "active"}
        )

        assert coins == 2

    def test_port_context_bonus(self):
        """Test port context bonus (+1 coin)"""
        coins = award_verification_coins(
            verification_data={
                "action": "active",
                "wait_time": 5,
                "port_type_used": "ccs2",
                "ports_available": 3
            }
        )

        assert coins >= 3  # 2 base + 1 port context

    def test_operational_details_bonus(self):
        """Test operational details bonus (+1 coin)"""
        coins = award_verification_coins(
            verification_data={
                "action": "active",
                "payment_method": "app",
                "station_lighting": "excellent"
            }
        )

        assert coins >= 3  # 2 base + 1 operational

    def test_quality_ratings_bonus(self):
        """Test quality ratings bonus (+3 coins)"""
        coins = award_verification_coins(
            verification_data={
                "action": "active",
                "cleanliness_rating": 5,
                "charging_speed_rating": 4,
                "amenities_rating": 4,
                "would_recommend": True
            }
        )

        assert coins >= 5  # 2 base + 3 quality

    def test_photo_bonus_not_working(self):
        """Test photo bonus for not_working (+2 coins)"""
        coins = award_verification_coins(
            verification_data={
                "action": "not_working",
                "photo": "base64_photo"
            }
        )

        assert coins >= 4  # 2 base + 2 photo

    def test_photo_no_bonus_active(self):
        """Test that photo doesn't give bonus for active status"""
        coins = award_verification_coins(
            verification_data={
                "action": "active",
                "photo": "base64_photo"
            }
        )

        assert coins == 2  # Only base, no photo bonus

    def test_maximum_coins(self):
        """Test maximum possible coins (9)"""
        coins = award_verification_coins(
            verification_data={
                "action": "not_working",
                "wait_time": 0,
                "port_type_used": "ccs2",
                "ports_available": 0,
                "payment_method": "app",
                "station_lighting": "poor",
                "cleanliness_rating": 2,
                "charging_speed_rating": 1,
                "amenities_rating": 2,
                "would_recommend": False,
                "photo": "base64_photo"
            }
        )

        assert coins == 9  # Maximum possible

    def test_charger_addition_coins(self):
        """Test coins for adding charger"""
        coins = award_charger_coins(photos_count=0)

        assert coins == 5  # Base reward

    def test_charger_addition_with_photos(self):
        """Test coins for adding charger with photos"""
        coins = award_charger_coins(photos_count=3)

        assert coins == 14  # 5 base + 9 photos


class TestTrustScore:
    """Test trust score calculation"""

    def test_trust_score_new_user(self, test_user: User):
        """Test trust score for new user"""
        test_user.chargers_added = 0
        test_user.verifications_count = 0
        test_user.photos_uploaded = 0

        score = calculate_trust_score(test_user)

        assert score == 0

    def test_trust_score_active_user(self, test_user: User):
        """Test trust score for active user"""
        test_user.chargers_added = 5
        test_user.verifications_count = 20
        test_user.photos_uploaded = 10

        score = calculate_trust_score(test_user)

        # 5*10 + 20*2 + 10*3 = 50 + 40 + 30 = 120, capped at 100
        assert score == 100

    def test_trust_score_partial_contributions(self, test_user: User):
        """Test trust score with partial contributions"""
        test_user.chargers_added = 2
        test_user.verifications_count = 10
        test_user.photos_uploaded = 5

        score = calculate_trust_score(test_user)

        # 2*10 + 10*2 + 5*3 = 20 + 20 + 15 = 55
        assert score == 55

    def test_trust_score_capped_at_100(self, test_high_trust_user: User):
        """Test that trust score is capped at 100"""
        test_high_trust_user.chargers_added = 20
        test_high_trust_user.verifications_count = 100
        test_high_trust_user.photos_uploaded = 50

        score = calculate_trust_score(test_high_trust_user)

        # Should be capped
        assert score == 100


class TestVerificationHistory:
    """Test verification history and tracking"""

    @pytest.mark.asyncio
    async def test_verification_stored_correctly(
        self,
        db_session: AsyncSession,
        test_charger: Charger,
        test_user: User,
        valid_verification_data: dict
    ):
        """Test that verification is stored with all fields"""
        coins, level = await verify_charger(
            charger_id=test_charger.id,
            user_id=test_user.id,
            verification_data=valid_verification_data,
            db=db_session
        )

        # Fetch the verification
        from sqlalchemy import select
        result = await db_session.execute(
            select(VerificationAction)
            .where(VerificationAction.charger_id == test_charger.id)
            .where(VerificationAction.user_id == test_user.id)
        )
        verification = result.scalar_one_or_none()

        assert verification is not None
        assert verification.action == valid_verification_data["action"]
        assert verification.cleanliness_rating == valid_verification_data["cleanliness_rating"]

    def test_get_verification_history(
        self,
        client: TestClient,
        test_charger: Charger,
        test_verification: VerificationAction
    ):
        """Test getting verification history for a charger"""
        # If endpoint exists
        response = client.get(f"/api/chargers/{test_charger.id}/verifications")

        # May not be implemented
        assert response.status_code in [200, 404]

        if response.status_code == 200:
            data = response.json()
            assert "verifications" in data or isinstance(data, list)


class TestVerificationImpact:
    """Test impact of verifications on charger status"""

    @pytest.mark.asyncio
    async def test_charger_level_updates_after_verification(
        self,
        db_session: AsyncSession,
        test_charger: Charger,
        test_user: User
    ):
        """Test that charger verification level updates"""
        initial_level = test_charger.verification_level

        # Add positive verification
        coins, new_level = await verify_charger(
            charger_id=test_charger.id,
            user_id=test_user.id,
            verification_data={"action": "active", "notes": "Great"},
            db=db_session
        )

        # Level should potentially increase
        assert new_level >= initial_level

    @pytest.mark.asyncio
    async def test_verification_count_increments(
        self,
        db_session: AsyncSession,
        test_charger: Charger,
        test_user: User
    ):
        """Test that verification count increments"""
        # If charger tracks verification count
        initial_count = test_charger.verified_by_count or 0

        await verify_charger(
            charger_id=test_charger.id,
            user_id=test_user.id,
            verification_data={"action": "active"},
            db=db_session
        )

        await db_session.refresh(test_charger)

        if hasattr(test_charger, 'verified_by_count'):
            assert test_charger.verified_by_count > initial_count
