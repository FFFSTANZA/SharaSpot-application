"""Analytics API endpoints for Business Intelligence dashboard"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from app.core.database import get_db
from app.core.security import get_user_from_token
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/overview", response_model=Dict[str, Any])
async def get_analytics_overview(
    db: AsyncSession = Depends(get_db),
    current_user: Dict = Depends(get_user_from_token)
):
    """
    Get high-level analytics overview

    **Key Metrics:**
    - Total users, chargers, verifications
    - Active users (30 days)
    - Engagement rate
    - OAuth adoption rate
    - Average verifications per charger

    **Use Case:** Main dashboard overview card
    """
    metrics = await AnalyticsService.get_overview_metrics(db)
    return {
        "success": True,
        "data": metrics
    }


@router.get("/users/growth", response_model=Dict[str, Any])
async def get_user_growth(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    db: AsyncSession = Depends(get_db),
    current_user: Dict = Depends(get_user_from_token)
):
    """
    Get user growth metrics

    **Metrics:**
    - Total users
    - New signups in period
    - Daily signup trends
    - OAuth vs Email breakdown
    - Growth rate (compared to previous period)
    - Guest users

    **Parameters:**
    - `days`: Number of days to look back (1-365, default: 30)

    **Use Case:** User growth charts and trend analysis
    """
    metrics = await AnalyticsService.get_user_growth_metrics(db, days)
    return {
        "success": True,
        "data": metrics
    }


@router.get("/users/active", response_model=Dict[str, Any])
async def get_active_users(
    db: AsyncSession = Depends(get_db),
    current_user: Dict = Depends(get_user_from_token)
):
    """
    Get active users metrics (DAU, WAU, MAU)

    **Metrics:**
    - DAU (Daily Active Users - last 24 hours)
    - WAU (Weekly Active Users - last 7 days)
    - MAU (Monthly Active Users - last 30 days)
    - Stickiness ratio (DAU/MAU %)
    - DAU/MAU and WAU/MAU ratios

    **Use Case:** User engagement tracking, retention health indicator
    """
    metrics = await AnalyticsService.get_active_users_metrics(db)
    return {
        "success": True,
        "data": metrics
    }


@router.get("/engagement", response_model=Dict[str, Any])
async def get_engagement_metrics(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    db: AsyncSession = Depends(get_db),
    current_user: Dict = Depends(get_user_from_token)
):
    """
    Get user engagement metrics

    **Metrics:**
    - Total actions in period
    - Active users
    - Actions per user
    - Action breakdown by type
    - Top 10 contributors
    - Daily engagement trends

    **Parameters:**
    - `days`: Number of days to look back (1-365, default: 30)

    **Use Case:** Engagement analysis, identifying power users, activity trends
    """
    metrics = await AnalyticsService.get_engagement_metrics(db, days)
    return {
        "success": True,
        "data": metrics
    }


@router.get("/chargers", response_model=Dict[str, Any])
async def get_charger_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: Dict = Depends(get_user_from_token)
):
    """
    Get charger/content quality metrics

    **Metrics:**
    - Total chargers
    - Source breakdown (official vs community)
    - Verification level distribution
    - Chargers needing verification
    - Average verifications per charger
    - Most verified chargers (top 10)
    - Verification action breakdown
    - Data quality score
    - High quality chargers count

    **Use Case:** Content quality monitoring, identifying verification gaps
    """
    metrics = await AnalyticsService.get_charger_metrics(db)
    return {
        "success": True,
        "data": metrics
    }


@router.get("/gamification", response_model=Dict[str, Any])
async def get_gamification_metrics(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    db: AsyncSession = Depends(get_db),
    current_user: Dict = Depends(get_user_from_token)
):
    """
    Get gamification and rewards metrics

    **Metrics:**
    - Total coins earned (all time)
    - Coins earned in period
    - Coins by action type
    - Average coins per user
    - Top 10 earners
    - Trust score distribution
    - Daily coin trends (earned vs spent)

    **Parameters:**
    - `days`: Number of days to look back (1-365, default: 30)

    **Use Case:** Gamification effectiveness, reward economy balance
    """
    metrics = await AnalyticsService.get_gamification_metrics(db, days)
    return {
        "success": True,
        "data": metrics
    }


@router.get("/retention", response_model=Dict[str, Any])
async def get_retention_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: Dict = Depends(get_user_from_token)
):
    """
    Get user retention metrics

    **Metrics:**
    - Overall 7-day retention rate
    - Weekly cohort analysis (last 8 weeks)
    - Cohort size and retention rates

    **Use Case:** Retention analysis, cohort performance tracking
    """
    metrics = await AnalyticsService.get_retention_metrics(db)
    return {
        "success": True,
        "data": metrics
    }


@router.get("/features/adoption", response_model=Dict[str, Any])
async def get_feature_adoption(
    db: AsyncSession = Depends(get_db),
    current_user: Dict = Depends(get_user_from_token)
):
    """
    Get feature adoption metrics

    **Metrics:**
    - OAuth adoption rate and user count
    - Photo upload adoption rate and user count
    - Verification adoption rate and user count
    - Charger contribution adoption rate and user count

    **Use Case:** Feature usage analysis, product development prioritization
    """
    metrics = await AnalyticsService.get_feature_adoption_metrics(db)
    return {
        "success": True,
        "data": metrics
    }


@router.get("/dashboard", response_model=Dict[str, Any])
async def get_complete_dashboard(
    days: int = Query(30, ge=1, le=90, description="Number of days for trend analysis"),
    db: AsyncSession = Depends(get_db),
    current_user: Dict = Depends(get_user_from_token)
):
    """
    Get complete analytics dashboard data

    **Returns all metrics in one call:**
    - Overview metrics
    - User growth (with specified days)
    - Active users (DAU/WAU/MAU)
    - Engagement metrics (with specified days)
    - Charger metrics
    - Gamification metrics (with specified days)
    - Retention metrics
    - Feature adoption

    **Parameters:**
    - `days`: Number of days for trend metrics (1-90, default: 30)

    **Use Case:** Single API call for complete dashboard initialization
    **Note:** This endpoint may be slower due to multiple queries. Use specific
    endpoints for individual metric updates.
    """
    # Fetch all metrics in parallel for better performance
    import asyncio

    overview_task = AnalyticsService.get_overview_metrics(db)
    growth_task = AnalyticsService.get_user_growth_metrics(db, days)
    active_task = AnalyticsService.get_active_users_metrics(db)
    engagement_task = AnalyticsService.get_engagement_metrics(db, days)
    chargers_task = AnalyticsService.get_charger_metrics(db)
    gamification_task = AnalyticsService.get_gamification_metrics(db, days)
    retention_task = AnalyticsService.get_retention_metrics(db)
    adoption_task = AnalyticsService.get_feature_adoption_metrics(db)

    # Wait for all tasks to complete
    (
        overview,
        growth,
        active,
        engagement,
        chargers,
        gamification,
        retention,
        adoption
    ) = await asyncio.gather(
        overview_task,
        growth_task,
        active_task,
        engagement_task,
        chargers_task,
        gamification_task,
        retention_task,
        adoption_task
    )

    return {
        "success": True,
        "data": {
            "overview": overview,
            "user_growth": growth,
            "active_users": active,
            "engagement": engagement,
            "chargers": chargers,
            "gamification": gamification,
            "retention": retention,
            "feature_adoption": adoption
        },
        "metadata": {
            "generated_at": AnalyticsService._get_current_time().isoformat(),
            "days_analyzed": days
        }
    }


# Helper method for analytics service
def _add_helper_to_service():
    """Add helper method to AnalyticsService"""
    from datetime import datetime, timezone

    @staticmethod
    def _get_current_time():
        return datetime.now(timezone.utc)

    AnalyticsService._get_current_time = _get_current_time


_add_helper_to_service()
