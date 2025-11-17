"""Analytics service for Business Intelligence and metrics tracking"""
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional
from sqlalchemy import select, func, and_, or_, distinct, case
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db_models import (
    User, Charger, VerificationAction, CoinTransaction,
    UserSession, OAuthToken, UserActivityEvent
)


class AnalyticsService:
    """Service for calculating and retrieving analytics metrics"""

    @staticmethod
    async def get_overview_metrics(db: AsyncSession) -> Dict[str, Any]:
        """
        Get high-level overview metrics for dashboard

        Returns comprehensive startup metrics including user growth,
        engagement, content quality, and business health indicators.
        """
        # Run all queries in parallel for performance
        total_users_result = await db.execute(
            select(func.count(User.id)).where(User.is_guest == False)
        )
        total_users = total_users_result.scalar_one()

        total_chargers_result = await db.execute(
            select(func.count(Charger.id))
        )
        total_chargers = total_chargers_result.scalar_one()

        total_verifications_result = await db.execute(
            select(func.count(VerificationAction.id))
        )
        total_verifications = total_verifications_result.scalar_one()

        total_coins_earned_result = await db.execute(
            select(func.sum(CoinTransaction.amount)).where(CoinTransaction.amount > 0)
        )
        total_coins_earned = total_coins_earned_result.scalar_one() or 0

        # Get active users (users with activity in last 30 days)
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        active_users_result = await db.execute(
            select(func.count(distinct(User.id)))
            .join(CoinTransaction, User.id == CoinTransaction.user_id)
            .where(CoinTransaction.timestamp >= thirty_days_ago)
        )
        active_users = active_users_result.scalar_one()

        # Calculate engagement rate
        engagement_rate = (active_users / total_users * 100) if total_users > 0 else 0

        # Get average verifications per charger
        avg_verifications = (total_verifications / total_chargers) if total_chargers > 0 else 0

        # Get OAuth adoption rate
        oauth_users_result = await db.execute(
            select(func.count(distinct(OAuthToken.user_id)))
        )
        oauth_users = oauth_users_result.scalar_one()
        oauth_rate = (oauth_users / total_users * 100) if total_users > 0 else 0

        return {
            "total_users": total_users,
            "total_chargers": total_chargers,
            "total_verifications": total_verifications,
            "total_coins_earned": int(total_coins_earned),
            "active_users_30d": active_users,
            "engagement_rate": round(engagement_rate, 2),
            "avg_verifications_per_charger": round(avg_verifications, 2),
            "oauth_adoption_rate": round(oauth_rate, 2),
        }

    @staticmethod
    async def get_user_growth_metrics(
        db: AsyncSession,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get user growth metrics over time

        Args:
            days: Number of days to look back (default 30)

        Returns user growth trends, retention, and acquisition metrics
        """
        start_date = datetime.now(timezone.utc) - timedelta(days=days)

        # Total users
        total_users_result = await db.execute(
            select(func.count(User.id)).where(User.is_guest == False)
        )
        total_users = total_users_result.scalar_one()

        # New users in period
        new_users_result = await db.execute(
            select(func.count(User.id))
            .where(and_(User.is_guest == False, User.created_at >= start_date))
        )
        new_users = new_users_result.scalar_one()

        # Daily new users trend
        daily_signups_result = await db.execute(
            select(
                func.date_trunc('day', User.created_at).label('date'),
                func.count(User.id).label('count')
            )
            .where(and_(User.is_guest == False, User.created_at >= start_date))
            .group_by(func.date_trunc('day', User.created_at))
            .order_by(func.date_trunc('day', User.created_at))
        )
        daily_signups = [
            {"date": row.date.isoformat(), "count": row.count}
            for row in daily_signups_result.all()
        ]

        # OAuth vs Email breakdown
        oauth_users_result = await db.execute(
            select(func.count(distinct(OAuthToken.user_id)))
        )
        oauth_users = oauth_users_result.scalar_one()
        email_users = total_users - oauth_users

        # Calculate growth rate (compared to previous period)
        previous_period_start = start_date - timedelta(days=days)
        previous_users_result = await db.execute(
            select(func.count(User.id))
            .where(and_(
                User.is_guest == False,
                User.created_at >= previous_period_start,
                User.created_at < start_date
            ))
        )
        previous_users = previous_users_result.scalar_one()
        growth_rate = ((new_users - previous_users) / previous_users * 100) if previous_users > 0 else 0

        # Guest users
        guest_users_result = await db.execute(
            select(func.count(User.id)).where(User.is_guest == True)
        )
        guest_users = guest_users_result.scalar_one()

        return {
            "total_users": total_users,
            "new_users": new_users,
            "growth_rate_percent": round(growth_rate, 2),
            "daily_signups": daily_signups,
            "oauth_users": oauth_users,
            "email_users": email_users,
            "guest_users": guest_users,
            "period_days": days
        }

    @staticmethod
    async def get_active_users_metrics(
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Get DAU, WAU, MAU metrics

        Returns Daily, Weekly, and Monthly Active Users based on actual activity
        """
        now = datetime.now(timezone.utc)
        one_day_ago = now - timedelta(days=1)
        seven_days_ago = now - timedelta(days=7)
        thirty_days_ago = now - timedelta(days=30)

        # DAU - Daily Active Users (activity in last 24 hours)
        dau_result = await db.execute(
            select(func.count(distinct(CoinTransaction.user_id)))
            .where(CoinTransaction.timestamp >= one_day_ago)
        )
        dau = dau_result.scalar_one()

        # WAU - Weekly Active Users (activity in last 7 days)
        wau_result = await db.execute(
            select(func.count(distinct(CoinTransaction.user_id)))
            .where(CoinTransaction.timestamp >= seven_days_ago)
        )
        wau = wau_result.scalar_one()

        # MAU - Monthly Active Users (activity in last 30 days)
        mau_result = await db.execute(
            select(func.count(distinct(CoinTransaction.user_id)))
            .where(CoinTransaction.timestamp >= thirty_days_ago)
        )
        mau = mau_result.scalar_one()

        # Total registered users
        total_users_result = await db.execute(
            select(func.count(User.id)).where(User.is_guest == False)
        )
        total_users = total_users_result.scalar_one()

        # Calculate stickiness (DAU/MAU ratio - key engagement metric)
        stickiness = (dau / mau * 100) if mau > 0 else 0

        return {
            "dau": dau,
            "wau": wau,
            "mau": mau,
            "total_users": total_users,
            "stickiness_percent": round(stickiness, 2),
            "dau_to_mau_ratio": round(dau / mau, 4) if mau > 0 else 0,
            "wau_to_mau_ratio": round(wau / mau, 4) if mau > 0 else 0
        }

    @staticmethod
    async def get_engagement_metrics(
        db: AsyncSession,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get user engagement metrics

        Returns detailed engagement metrics including actions, contribution patterns
        """
        start_date = datetime.now(timezone.utc) - timedelta(days=days)

        # Total actions in period
        total_actions_result = await db.execute(
            select(func.count(CoinTransaction.id))
            .where(CoinTransaction.timestamp >= start_date)
        )
        total_actions = total_actions_result.scalar_one()

        # Active users in period
        active_users_result = await db.execute(
            select(func.count(distinct(CoinTransaction.user_id)))
            .where(CoinTransaction.timestamp >= start_date)
        )
        active_users = active_users_result.scalar_one()

        # Actions per user
        actions_per_user = (total_actions / active_users) if active_users > 0 else 0

        # Breakdown by action type
        action_breakdown_result = await db.execute(
            select(
                CoinTransaction.action,
                func.count(CoinTransaction.id).label('count')
            )
            .where(CoinTransaction.timestamp >= start_date)
            .group_by(CoinTransaction.action)
        )
        action_breakdown = {
            row.action: row.count
            for row in action_breakdown_result.all()
        }

        # Top contributors (users with most actions)
        top_contributors_result = await db.execute(
            select(
                User.id,
                User.name,
                User.email,
                func.count(CoinTransaction.id).label('action_count'),
                func.sum(CoinTransaction.amount).label('total_coins')
            )
            .join(CoinTransaction, User.id == CoinTransaction.user_id)
            .where(CoinTransaction.timestamp >= start_date)
            .group_by(User.id, User.name, User.email)
            .order_by(func.count(CoinTransaction.id).desc())
            .limit(10)
        )
        top_contributors = [
            {
                "user_id": row.id,
                "name": row.name,
                "email": row.email,
                "action_count": row.action_count,
                "total_coins": int(row.total_coins) if row.total_coins else 0
            }
            for row in top_contributors_result.all()
        ]

        # Daily engagement trend
        daily_engagement_result = await db.execute(
            select(
                func.date_trunc('day', CoinTransaction.timestamp).label('date'),
                func.count(distinct(CoinTransaction.user_id)).label('active_users'),
                func.count(CoinTransaction.id).label('total_actions')
            )
            .where(CoinTransaction.timestamp >= start_date)
            .group_by(func.date_trunc('day', CoinTransaction.timestamp))
            .order_by(func.date_trunc('day', CoinTransaction.timestamp))
        )
        daily_engagement = [
            {
                "date": row.date.isoformat(),
                "active_users": row.active_users,
                "total_actions": row.total_actions
            }
            for row in daily_engagement_result.all()
        ]

        return {
            "total_actions": total_actions,
            "active_users": active_users,
            "actions_per_user": round(actions_per_user, 2),
            "action_breakdown": action_breakdown,
            "top_contributors": top_contributors,
            "daily_engagement": daily_engagement,
            "period_days": days
        }

    @staticmethod
    async def get_charger_metrics(
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Get charger/content quality metrics

        Returns charger statistics, verification coverage, and data quality indicators
        """
        # Total chargers
        total_chargers_result = await db.execute(
            select(func.count(Charger.id))
        )
        total_chargers = total_chargers_result.scalar_one()

        # Chargers by source type
        source_breakdown_result = await db.execute(
            select(
                Charger.source_type,
                func.count(Charger.id).label('count')
            )
            .group_by(Charger.source_type)
        )
        source_breakdown = {
            row.source_type: row.count
            for row in source_breakdown_result.all()
        }

        # Verification level distribution
        verification_distribution_result = await db.execute(
            select(
                Charger.verification_level,
                func.count(Charger.id).label('count')
            )
            .group_by(Charger.verification_level)
            .order_by(Charger.verification_level)
        )
        verification_distribution = [
            {"level": row.verification_level, "count": row.count}
            for row in verification_distribution_result.all()
        ]

        # Chargers needing verification (level < 3 or not verified in 90 days)
        ninety_days_ago = datetime.now(timezone.utc) - timedelta(days=90)
        needs_verification_result = await db.execute(
            select(func.count(Charger.id))
            .where(or_(
                Charger.verification_level < 3,
                Charger.last_verified < ninety_days_ago,
                Charger.last_verified.is_(None)
            ))
        )
        needs_verification = needs_verification_result.scalar_one()

        # Average verifications per charger
        total_verifications_result = await db.execute(
            select(func.count(VerificationAction.id))
        )
        total_verifications = total_verifications_result.scalar_one()
        avg_verifications = (total_verifications / total_chargers) if total_chargers > 0 else 0

        # Most verified chargers
        most_verified_result = await db.execute(
            select(
                Charger.id,
                Charger.name,
                Charger.address,
                func.count(VerificationAction.id).label('verification_count')
            )
            .join(VerificationAction, Charger.id == VerificationAction.charger_id)
            .group_by(Charger.id, Charger.name, Charger.address)
            .order_by(func.count(VerificationAction.id).desc())
            .limit(10)
        )
        most_verified = [
            {
                "charger_id": row.id,
                "name": row.name,
                "address": row.address,
                "verification_count": row.verification_count
            }
            for row in most_verified_result.all()
        ]

        # Verification action breakdown
        verification_actions_result = await db.execute(
            select(
                VerificationAction.action,
                func.count(VerificationAction.id).label('count')
            )
            .group_by(VerificationAction.action)
        )
        verification_actions = {
            row.action: row.count
            for row in verification_actions_result.all()
        }

        # Data quality score (percentage with photos, high verification level, recent verification)
        high_quality_result = await db.execute(
            select(func.count(Charger.id))
            .where(and_(
                Charger.verification_level >= 4,
                Charger.verified_by_count >= 3
            ))
        )
        high_quality_chargers = high_quality_result.scalar_one()
        data_quality_score = (high_quality_chargers / total_chargers * 100) if total_chargers > 0 else 0

        return {
            "total_chargers": total_chargers,
            "source_breakdown": source_breakdown,
            "verification_distribution": verification_distribution,
            "needs_verification": needs_verification,
            "avg_verifications_per_charger": round(avg_verifications, 2),
            "most_verified_chargers": most_verified,
            "verification_actions": verification_actions,
            "data_quality_score": round(data_quality_score, 2),
            "high_quality_chargers": high_quality_chargers
        }

    @staticmethod
    async def get_gamification_metrics(
        db: AsyncSession,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get gamification and rewards metrics

        Returns coin economy stats, user engagement with gamification
        """
        start_date = datetime.now(timezone.utc) - timedelta(days=days)

        # Total coins earned (all time)
        total_coins_result = await db.execute(
            select(func.sum(CoinTransaction.amount))
            .where(CoinTransaction.amount > 0)
        )
        total_coins = total_coins_result.scalar_one() or 0

        # Coins earned in period
        period_coins_result = await db.execute(
            select(func.sum(CoinTransaction.amount))
            .where(and_(
                CoinTransaction.amount > 0,
                CoinTransaction.timestamp >= start_date
            ))
        )
        period_coins = period_coins_result.scalar_one() or 0

        # Coins by action type
        coins_by_action_result = await db.execute(
            select(
                CoinTransaction.action,
                func.sum(CoinTransaction.amount).label('total_coins'),
                func.count(CoinTransaction.id).label('count')
            )
            .where(CoinTransaction.timestamp >= start_date)
            .group_by(CoinTransaction.action)
        )
        coins_by_action = {
            row.action: {
                "total_coins": int(row.total_coins) if row.total_coins else 0,
                "count": row.count
            }
            for row in coins_by_action_result.all()
        }

        # Average coins per user
        active_users_result = await db.execute(
            select(func.count(distinct(CoinTransaction.user_id)))
            .where(CoinTransaction.timestamp >= start_date)
        )
        active_users = active_users_result.scalar_one()
        avg_coins_per_user = (period_coins / active_users) if active_users > 0 else 0

        # Top earners
        top_earners_result = await db.execute(
            select(
                User.id,
                User.name,
                User.shara_coins,
                User.trust_score
            )
            .order_by(User.shara_coins.desc())
            .limit(10)
        )
        top_earners = [
            {
                "user_id": row.id,
                "name": row.name,
                "total_coins": row.shara_coins,
                "trust_score": round(row.trust_score, 2)
            }
            for row in top_earners_result.all()
        ]

        # Trust score distribution
        trust_score_distribution_result = await db.execute(
            select(
                case(
                    (User.trust_score < 20, '0-20'),
                    (User.trust_score < 40, '20-40'),
                    (User.trust_score < 60, '40-60'),
                    (User.trust_score < 80, '60-80'),
                    else_='80-100'
                ).label('range'),
                func.count(User.id).label('count')
            )
            .where(User.is_guest == False)
            .group_by('range')
        )
        trust_score_distribution = {
            row.range: row.count
            for row in trust_score_distribution_result.all()
        }

        # Daily coin trends
        daily_coins_result = await db.execute(
            select(
                func.date_trunc('day', CoinTransaction.timestamp).label('date'),
                func.sum(case((CoinTransaction.amount > 0, CoinTransaction.amount), else_=0)).label('earned'),
                func.sum(case((CoinTransaction.amount < 0, -CoinTransaction.amount), else_=0)).label('spent')
            )
            .where(CoinTransaction.timestamp >= start_date)
            .group_by(func.date_trunc('day', CoinTransaction.timestamp))
            .order_by(func.date_trunc('day', CoinTransaction.timestamp))
        )
        daily_coins = [
            {
                "date": row.date.isoformat(),
                "earned": int(row.earned) if row.earned else 0,
                "spent": int(row.spent) if row.spent else 0
            }
            for row in daily_coins_result.all()
        ]

        return {
            "total_coins_earned": int(total_coins),
            "period_coins_earned": int(period_coins),
            "coins_by_action": coins_by_action,
            "avg_coins_per_user": round(avg_coins_per_user, 2),
            "top_earners": top_earners,
            "trust_score_distribution": trust_score_distribution,
            "daily_coins": daily_coins,
            "period_days": days
        }

    @staticmethod
    async def get_retention_metrics(
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Get user retention metrics

        Returns cohort-based retention analysis
        """
        # Calculate retention by weekly cohorts (last 8 weeks)
        cohorts = []
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

        for week in range(8):
            cohort_start = today - timedelta(weeks=week+1)
            cohort_end = today - timedelta(weeks=week)

            # Users who signed up in this cohort
            cohort_users_result = await db.execute(
                select(func.count(User.id))
                .where(and_(
                    User.is_guest == False,
                    User.created_at >= cohort_start,
                    User.created_at < cohort_end
                ))
            )
            cohort_size = cohort_users_result.scalar_one()

            if cohort_size == 0:
                continue

            # Users from cohort who were active in the following week
            active_users_result = await db.execute(
                select(func.count(distinct(CoinTransaction.user_id)))
                .join(User, User.id == CoinTransaction.user_id)
                .where(and_(
                    User.created_at >= cohort_start,
                    User.created_at < cohort_end,
                    CoinTransaction.timestamp >= cohort_end,
                    CoinTransaction.timestamp < cohort_end + timedelta(days=7)
                ))
            )
            active_users = active_users_result.scalar_one()
            retention_rate = (active_users / cohort_size * 100) if cohort_size > 0 else 0

            cohorts.append({
                "cohort_week": cohort_start.strftime("%Y-%m-%d"),
                "cohort_size": cohort_size,
                "retained_users": active_users,
                "retention_rate": round(retention_rate, 2)
            })

        # Calculate overall retention rate (users active in last 7 days who signed up 14+ days ago)
        fourteen_days_ago = today - timedelta(days=14)
        seven_days_ago = today - timedelta(days=7)

        old_users_result = await db.execute(
            select(func.count(User.id))
            .where(and_(
                User.is_guest == False,
                User.created_at < fourteen_days_ago
            ))
        )
        old_users = old_users_result.scalar_one()

        retained_result = await db.execute(
            select(func.count(distinct(CoinTransaction.user_id)))
            .join(User, User.id == CoinTransaction.user_id)
            .where(and_(
                User.created_at < fourteen_days_ago,
                CoinTransaction.timestamp >= seven_days_ago
            ))
        )
        retained = retained_result.scalar_one()
        overall_retention = (retained / old_users * 100) if old_users > 0 else 0

        return {
            "overall_retention_rate": round(overall_retention, 2),
            "cohorts": cohorts,
            "measurement_period": "7_day_retention"
        }

    @staticmethod
    async def get_feature_adoption_metrics(
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Get feature adoption metrics

        Returns usage statistics for key features
        """
        # OAuth adoption
        total_users_result = await db.execute(
            select(func.count(User.id)).where(User.is_guest == False)
        )
        total_users = total_users_result.scalar_one()

        oauth_users_result = await db.execute(
            select(func.count(distinct(OAuthToken.user_id)))
        )
        oauth_users = oauth_users_result.scalar_one()
        oauth_adoption = (oauth_users / total_users * 100) if total_users > 0 else 0

        # Photo upload adoption (users who uploaded at least 1 photo)
        photo_uploaders_result = await db.execute(
            select(func.count(User.id))
            .where(User.photos_uploaded > 0)
        )
        photo_uploaders = photo_uploaders_result.scalar_one()
        photo_adoption = (photo_uploaders / total_users * 100) if total_users > 0 else 0

        # Verification adoption (users who verified at least 1 charger)
        verifiers_result = await db.execute(
            select(func.count(User.id))
            .where(User.verifications_count > 0)
        )
        verifiers = verifiers_result.scalar_one()
        verification_adoption = (verifiers / total_users * 100) if total_users > 0 else 0

        # Charger contribution adoption (users who added at least 1 charger)
        contributors_result = await db.execute(
            select(func.count(User.id))
            .where(User.chargers_added > 0)
        )
        contributors = contributors_result.scalar_one()
        contribution_adoption = (contributors / total_users * 100) if total_users > 0 else 0

        return {
            "oauth_adoption_rate": round(oauth_adoption, 2),
            "photo_upload_adoption_rate": round(photo_adoption, 2),
            "verification_adoption_rate": round(verification_adoption, 2),
            "charger_contribution_adoption_rate": round(contribution_adoption, 2),
            "oauth_users": oauth_users,
            "photo_uploaders": photo_uploaders,
            "verifiers": verifiers,
            "contributors": contributors,
            "total_users": total_users
        }
