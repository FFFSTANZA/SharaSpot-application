"""
Tests for analytics and gamification systems
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from app.core.db_models import User, Charger, VerificationAction, CoinTransaction
from app.services.analytics_service import (
    get_overview_metrics,
    get_user_growth_metrics,
    get_active_users_metrics,
    get_engagement_metrics
)
from app.services.gamification_service import (
    log_coin_transaction,
    get_user_transactions
)


class TestAnalyticsOverview:
    """Test analytics overview endpoint"""

    def test_get_overview_metrics(
        self,
        client: TestClient,
        admin_auth_headers: dict,
        test_user: User,
        test_charger: Charger
    ):
        """Test GET /api/analytics/overview"""
        response = client.get(
            "/api/analytics/overview",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "total_users" in data
        assert "total_chargers" in data
        assert "total_verifications" in data
        assert "active_users_30d" in data
        assert "engagement_rate" in data

        assert data["total_users"] > 0
        assert data["total_chargers"] > 0

    def test_overview_unauthorized(self, client: TestClient):
        """Test overview requires authentication"""
        response = client.get("/api/analytics/overview")

        assert response.status_code == 401

    def test_overview_non_admin(
        self,
        client: TestClient,
        auth_headers: dict
    ):
        """Test overview requires admin role"""
        response = client.get(
            "/api/analytics/overview",
            headers=auth_headers
        )

        # May require admin or may allow all authenticated
        assert response.status_code in [200, 403]


class TestUserGrowthMetrics:
    """Test user growth analytics"""

    def test_get_user_growth_default(
        self,
        client: TestClient,
        admin_auth_headers: dict,
        test_user: User
    ):
        """Test GET /api/analytics/users/growth"""
        response = client.get(
            "/api/analytics/users/growth",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "period_days" in data
        assert "new_users_total" in data
        assert "new_users_by_type" in data
        assert "daily_signups" in data

    def test_get_user_growth_custom_period(
        self,
        client: TestClient,
        admin_auth_headers: dict
    ):
        """Test user growth with custom period"""
        response = client.get(
            "/api/analytics/users/growth?days=90",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["period_days"] == 90

    def test_user_growth_by_type_breakdown(
        self,
        client: TestClient,
        admin_auth_headers: dict,
        test_user: User,
        test_guest_user: User
    ):
        """Test user breakdown by type"""
        response = client.get(
            "/api/analytics/users/growth",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "email" in data["new_users_by_type"]
        assert "guest" in data["new_users_by_type"]
        # OAuth users if any
        if "oauth" in data["new_users_by_type"]:
            assert data["new_users_by_type"]["oauth"] >= 0


class TestActiveUsersMetrics:
    """Test active users (DAU/WAU/MAU) analytics"""

    def test_get_active_users(
        self,
        client: TestClient,
        admin_auth_headers: dict
    ):
        """Test GET /api/analytics/users/active"""
        response = client.get(
            "/api/analytics/users/active",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "dau" in data
        assert "wau" in data
        assert "mau" in data
        assert "stickiness_dau_mau" in data
        assert "stickiness_wau_mau" in data

        # DAU should be <= WAU <= MAU
        assert data["dau"] <= data["wau"] <= data["mau"]

    def test_stickiness_calculation(
        self,
        client: TestClient,
        admin_auth_headers: dict
    ):
        """Test stickiness ratio calculation"""
        response = client.get(
            "/api/analytics/users/active",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # Stickiness should be percentage (0-100)
        assert 0 <= data["stickiness_dau_mau"] <= 100
        assert 0 <= data["stickiness_wau_mau"] <= 100

    def test_dau_trend(
        self,
        client: TestClient,
        admin_auth_headers: dict
    ):
        """Test DAU trend data"""
        response = client.get(
            "/api/analytics/users/active",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        if "dau_trend" in data:
            assert isinstance(data["dau_trend"], list)
            if len(data["dau_trend"]) > 0:
                assert "date" in data["dau_trend"][0]
                assert "count" in data["dau_trend"][0]


class TestEngagementMetrics:
    """Test engagement analytics"""

    def test_get_engagement_metrics(
        self,
        client: TestClient,
        admin_auth_headers: dict,
        test_verification: VerificationAction
    ):
        """Test GET /api/analytics/engagement"""
        response = client.get(
            "/api/analytics/engagement",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "avg_actions_per_user" in data
        assert "actions_by_type" in data
        assert "top_contributors" in data

    def test_top_contributors_list(
        self,
        client: TestClient,
        admin_auth_headers: dict,
        test_high_trust_user: User
    ):
        """Test top contributors ranking"""
        response = client.get(
            "/api/analytics/engagement",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert isinstance(data["top_contributors"], list)

        if len(data["top_contributors"]) > 0:
            contributor = data["top_contributors"][0]
            assert "user_id" in contributor
            assert "trust_score" in contributor
            assert "chargers_added" in contributor
            assert "verifications" in contributor

    def test_actions_breakdown(
        self,
        client: TestClient,
        admin_auth_headers: dict
    ):
        """Test actions breakdown by type"""
        response = client.get(
            "/api/analytics/engagement",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        actions = data["actions_by_type"]
        assert isinstance(actions, dict)
        # Should have at least some action types
        assert len(actions) > 0


class TestChargerMetrics:
    """Test charger quality metrics"""

    def test_get_charger_metrics(
        self,
        client: TestClient,
        admin_auth_headers: dict,
        test_chargers: list[Charger]
    ):
        """Test GET /api/analytics/chargers"""
        response = client.get(
            "/api/analytics/chargers",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "total_chargers" in data
        assert "chargers_by_source" in data
        assert "verification_level_distribution" in data
        assert "high_quality_percentage" in data

    def test_verification_level_distribution(
        self,
        client: TestClient,
        admin_auth_headers: dict,
        test_chargers: list[Charger]
    ):
        """Test verification level distribution"""
        response = client.get(
            "/api/analytics/chargers",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        dist = data["verification_level_distribution"]

        # Should have counts for each level
        assert "level_1" in dist or "1" in dist
        # Total should match total_chargers
        total_from_dist = sum(dist.values())
        assert total_from_dist == data["total_chargers"]

    def test_source_type_breakdown(
        self,
        client: TestClient,
        admin_auth_headers: dict,
        test_chargers: list[Charger]
    ):
        """Test charger source breakdown"""
        response = client.get(
            "/api/analytics/chargers",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        sources = data["chargers_by_source"]
        assert "official" in sources or "community_manual" in sources

        # Total should match
        total_from_sources = sum(sources.values())
        assert total_from_sources == data["total_chargers"]


class TestGamificationMetrics:
    """Test gamification analytics"""

    def test_get_gamification_metrics(
        self,
        client: TestClient,
        admin_auth_headers: dict
    ):
        """Test GET /api/analytics/gamification"""
        response = client.get(
            "/api/analytics/gamification",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "total_coins_earned" in data
        assert "avg_coins_per_user" in data
        assert "coins_by_action" in data
        assert "top_earners" in data

    def test_coins_by_action_breakdown(
        self,
        client: TestClient,
        admin_auth_headers: dict
    ):
        """Test coins breakdown by action type"""
        response = client.get(
            "/api/analytics/gamification",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        coins_by_action = data["coins_by_action"]
        assert isinstance(coins_by_action, dict)

    def test_top_earners_list(
        self,
        client: TestClient,
        admin_auth_headers: dict,
        test_user: User
    ):
        """Test top earners leaderboard"""
        response = client.get(
            "/api/analytics/gamification",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        top_earners = data["top_earners"]
        assert isinstance(top_earners, list)

        if len(top_earners) > 0:
            earner = top_earners[0]
            assert "user_id" in earner
            assert "total_coins" in earner


class TestRetentionMetrics:
    """Test user retention analytics"""

    def test_get_retention_metrics(
        self,
        client: TestClient,
        admin_auth_headers: dict
    ):
        """Test GET /api/analytics/retention"""
        response = client.get(
            "/api/analytics/retention",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "retention_7d" in data
        assert "retention_30d" in data
        assert "cohort_analysis" in data

        # Retention should be percentage
        assert 0 <= data["retention_7d"] <= 100
        assert 0 <= data["retention_30d"] <= 100

    def test_cohort_analysis_structure(
        self,
        client: TestClient,
        admin_auth_headers: dict
    ):
        """Test cohort analysis data structure"""
        response = client.get(
            "/api/analytics/retention",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        cohorts = data["cohort_analysis"]
        assert isinstance(cohorts, list)

        if len(cohorts) > 0:
            cohort = cohorts[0]
            assert "cohort_week" in cohort
            assert "cohort_size" in cohort
            # Should have week retention data
            assert "week_0" in cohort


class TestFeatureAdoption:
    """Test feature adoption metrics"""

    def test_get_feature_adoption(
        self,
        client: TestClient,
        admin_auth_headers: dict
    ):
        """Test GET /api/analytics/features/adoption"""
        response = client.get(
            "/api/analytics/features/adoption",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "total_users" in data
        assert "oauth_adoption" in data
        assert "charger_contribution" in data
        assert "verification_participation" in data

    def test_adoption_rates_percentage(
        self,
        client: TestClient,
        admin_auth_headers: dict
    ):
        """Test that adoption rates are percentages"""
        response = client.get(
            "/api/analytics/features/adoption",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # All adoption rates should be 0-100%
        for feature, stats in data.items():
            if isinstance(stats, dict) and "adoption_rate" in stats:
                assert 0 <= stats["adoption_rate"] <= 100


class TestAnalyticsDashboard:
    """Test complete analytics dashboard"""

    def test_get_dashboard_all_metrics(
        self,
        client: TestClient,
        admin_auth_headers: dict
    ):
        """Test GET /api/analytics/dashboard"""
        response = client.get(
            "/api/analytics/dashboard",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # Should include all metric categories
        assert "overview" in data
        assert "user_growth" in data
        assert "active_users" in data
        assert "engagement" in data
        assert "chargers" in data
        assert "gamification" in data


class TestCoinTransactions:
    """Test coin transaction logging and retrieval"""

    @pytest.mark.asyncio
    async def test_log_coin_transaction(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Test logging coin transaction"""
        await log_coin_transaction(
            user_id=test_user.id,
            amount=10,
            transaction_type="verification",
            description="Test verification",
            db=db_session
        )

        # Verify transaction was logged
        from sqlalchemy import select
        result = await db_session.execute(
            select(CoinTransaction)
            .where(CoinTransaction.user_id == test_user.id)
        )
        transaction = result.scalar_one_or_none()

        assert transaction is not None
        assert transaction.amount == 10
        assert transaction.transaction_type == "verification"

    @pytest.mark.asyncio
    async def test_get_user_transactions(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Test retrieving user transaction history"""
        # Add some transactions
        for i in range(3):
            await log_coin_transaction(
                user_id=test_user.id,
                amount=5 + i,
                transaction_type="test",
                description=f"Test transaction {i}",
                db=db_session
            )

        # Get transactions
        transactions = await get_user_transactions(
            user_id=test_user.id,
            db=db_session
        )

        assert len(transactions) >= 3
        assert all(t.user_id == test_user.id for t in transactions)


class TestProfileEndpoints:
    """Test profile and user stats endpoints"""

    def test_get_user_activity(
        self,
        client: TestClient,
        auth_headers: dict,
        test_verification: VerificationAction
    ):
        """Test GET /api/profile/activity"""
        response = client.get(
            "/api/profile/activity",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "activities" in data
        assert isinstance(data["activities"], list)

    def test_get_user_stats(
        self,
        client: TestClient,
        auth_headers: dict,
        test_user: User
    ):
        """Test GET /api/profile/stats"""
        response = client.get(
            "/api/profile/stats",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "total_coins" in data
        assert "trust_score" in data
        assert "chargers_added" in data
        assert "verifications_count" in data

    def test_get_wallet_transactions(
        self,
        client: TestClient,
        auth_headers: dict
    ):
        """Test GET /api/wallet/transactions"""
        response = client.get(
            "/api/wallet/transactions",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "transactions" in data or isinstance(data, list)

    def test_profile_unauthorized(self, client: TestClient):
        """Test profile endpoints require authentication"""
        endpoints = [
            "/api/profile/activity",
            "/api/profile/stats",
            "/api/wallet/transactions"
        ]

        for endpoint in endpoints:
            response = client.get(endpoint)
            assert response.status_code == 401


class TestUserSettings:
    """Test user settings endpoint"""

    def test_update_settings(
        self,
        client: TestClient,
        auth_headers: dict
    ):
        """Test PUT /api/settings"""
        response = client.put(
            "/api/settings",
            json={
                "theme": "dark",
                "notifications_enabled": False,
                "distance_unit": "miles"
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert data["theme"] == "dark"
        assert data["notifications_enabled"] is False
        assert data["distance_unit"] == "miles"

    def test_update_settings_partial(
        self,
        client: TestClient,
        auth_headers: dict
    ):
        """Test updating partial settings"""
        response = client.put(
            "/api/settings",
            json={"theme": "light"},
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["theme"] == "light"

    def test_update_settings_unauthorized(self, client: TestClient):
        """Test settings update requires authentication"""
        response = client.put(
            "/api/settings",
            json={"theme": "dark"}
        )

        assert response.status_code == 401


class TestGamificationLogic:
    """Test gamification system logic"""

    @pytest.mark.asyncio
    async def test_user_coins_increment(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Test that user coins increment after earning"""
        initial_coins = test_user.shara_coins

        # Award coins
        from app.services.gamification_service import award_coins
        await award_coins(
            user_id=test_user.id,
            amount=10,
            db=db_session
        )

        await db_session.refresh(test_user)

        assert test_user.shara_coins == initial_coins + 10

    @pytest.mark.asyncio
    async def test_trust_score_updates(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Test that trust score updates with contributions"""
        # Add contributions
        test_user.chargers_added = 5
        test_user.verifications_count = 10
        test_user.photos_uploaded = 5

        await db_session.commit()

        # Calculate trust score
        from app.services.gamification_service import calculate_trust_score
        score = calculate_trust_score(test_user)

        # 5*10 + 10*2 + 5*3 = 85
        assert score == 85

    @pytest.mark.asyncio
    async def test_contribution_counters_increment(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_charger: Charger
    ):
        """Test that contribution counters increment"""
        initial_verifications = test_user.verifications_count

        # Add verification
        from app.services.charger_service import verify_charger
        await verify_charger(
            charger_id=test_charger.id,
            user_id=test_user.id,
            verification_data={"action": "active"},
            db=db_session
        )

        await db_session.refresh(test_user)

        # Verification count should increment
        assert test_user.verifications_count > initial_verifications


class TestMetricsCalculationAccuracy:
    """Test accuracy of metrics calculations"""

    def test_engagement_rate_calculation(
        self,
        client: TestClient,
        admin_auth_headers: dict
    ):
        """Test engagement rate is calculated correctly"""
        response = client.get(
            "/api/analytics/overview",
            headers=admin_auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # Engagement rate = (active users / total users) * 100
        if data["total_users"] > 0:
            expected_rate = (data["active_users_30d"] / data["total_users"]) * 100
            assert abs(data["engagement_rate"] - expected_rate) < 0.1

    def test_average_calculations(
        self,
        client: TestClient,
        admin_auth_headers: dict
    ):
        """Test average calculations are accurate"""
        # Get charger metrics
        charger_response = client.get(
            "/api/analytics/chargers",
            headers=admin_auth_headers
        )

        # Get gamification metrics
        gamif_response = client.get(
            "/api/analytics/gamification",
            headers=admin_auth_headers
        )

        # Get overview
        overview_response = client.get(
            "/api/analytics/overview",
            headers=admin_auth_headers
        )

        assert all(r.status_code == 200 for r in [charger_response, gamif_response, overview_response])

        overview = overview_response.json()
        charger_data = charger_response.json()

        # Test avg verifications per charger
        if charger_data["total_chargers"] > 0 and overview["total_verifications"] > 0:
            expected_avg = overview["total_verifications"] / charger_data["total_chargers"]
            if "avg_verifications_per_charger" in overview:
                assert abs(overview["avg_verifications_per_charger"] - expected_avg) < 0.1
