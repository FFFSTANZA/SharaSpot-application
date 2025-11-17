# Analytics & Business Intelligence - Quick Setup Guide

## Overview

A comprehensive Analytics & BI system has been implemented for SharaSpot to track key startup metrics, user engagement, and business health indicators.

## What's Included

### 📊 Analytics Features

1. **User Growth Metrics**
   - Total users, new signups, growth rate
   - Daily signup trends
   - OAuth vs Email breakdown

2. **Active Users Tracking**
   - DAU (Daily Active Users)
   - WAU (Weekly Active Users)
   - MAU (Monthly Active Users)
   - Stickiness ratio (DAU/MAU)

3. **Engagement Metrics**
   - Actions per user
   - Top contributors
   - Daily engagement trends
   - Action type breakdown

4. **Charger/Content Quality**
   - Data quality scores
   - Verification coverage
   - Chargers needing attention
   - Most verified chargers

5. **Gamification Analytics**
   - Coin economy metrics
   - Top earners
   - Trust score distribution
   - Reward effectiveness

6. **Retention Analysis**
   - Cohort-based retention
   - 7-day retention rates
   - Retention trends

7. **Feature Adoption**
   - OAuth adoption
   - Photo uploads
   - Verification participation
   - Charger contributions

## Setup Instructions

### 1. Install Dependencies

Ensure you have all required packages:

```bash
cd backend
pip install -r requirements.txt
```

### 2. Run Database Migration

Create the new analytics tables:

```bash
cd backend
alembic upgrade head
```

This creates:
- `analytics_snapshots` - For caching aggregated metrics
- `user_activity_events` - For detailed event tracking

### 3. Verify Installation

Check that the migration ran successfully:

```bash
# Start the backend server
cd backend
uvicorn main:app --reload

# In another terminal, test the overview endpoint
curl -X GET "http://localhost:8000/api/analytics/overview" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Access API Documentation

Visit the interactive API docs:

```
http://localhost:8000/docs
```

Look for the "Analytics" section with 9 endpoints:
- `/api/analytics/overview`
- `/api/analytics/users/growth`
- `/api/analytics/users/active`
- `/api/analytics/engagement`
- `/api/analytics/chargers`
- `/api/analytics/gamification`
- `/api/analytics/retention`
- `/api/analytics/features/adoption`
- `/api/analytics/dashboard`

## API Endpoints Summary

| Endpoint | Purpose | Key Metrics |
|----------|---------|-------------|
| `/overview` | Dashboard overview | Total users, engagement rate, coins |
| `/users/growth` | User acquisition | New users, growth rate, daily trends |
| `/users/active` | DAU/WAU/MAU | Active users, stickiness |
| `/engagement` | User activity | Actions per user, top contributors |
| `/chargers` | Content quality | Verification coverage, quality score |
| `/gamification` | Rewards economy | Coins earned, top earners |
| `/retention` | User retention | Cohort retention, retention rate |
| `/features/adoption` | Feature usage | Adoption rates by feature |
| `/dashboard` | Complete metrics | All of the above in one call |

## Files Modified/Created

### New Files
1. `backend/app/services/analytics_service.py` - Analytics calculation service
2. `backend/app/api/analytics.py` - API endpoints
3. `backend/alembic/versions/006_add_analytics_tables.py` - Database migration
4. `backend/ANALYTICS_API.md` - Complete API documentation
5. `ANALYTICS_SETUP.md` - This file

### Modified Files
1. `backend/app/core/db_models.py` - Added AnalyticsSnapshot and UserActivityEvent models
2. `backend/app/api/__init__.py` - Added analytics router

## Example Dashboard Implementation

### React/React Native Example

```javascript
import { useEffect, useState } from 'react';

function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      const token = localStorage.getItem('jwt_token');

      // Fetch complete dashboard
      const response = await fetch('/api/analytics/dashboard?days=30', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      setMetrics(result.data);
      setLoading(false);
    }

    fetchMetrics();

    // Refresh every 60 seconds
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div className="dashboard">
      <h1>SharaSpot Analytics</h1>

      {/* Overview Cards */}
      <div className="metrics-grid">
        <MetricCard
          title="Total Users"
          value={metrics.overview.total_users}
          trend={metrics.user_growth.growth_rate_percent}
        />
        <MetricCard
          title="Active Users (30d)"
          value={metrics.overview.active_users_30d}
        />
        <MetricCard
          title="Engagement Rate"
          value={`${metrics.overview.engagement_rate}%`}
        />
        <MetricCard
          title="DAU/MAU"
          value={`${metrics.active_users.stickiness_percent}%`}
        />
      </div>

      {/* Growth Chart */}
      <LineChart
        data={metrics.user_growth.daily_signups}
        xKey="date"
        yKey="count"
        title="Daily Signups (30 days)"
      />

      {/* Engagement Chart */}
      <LineChart
        data={metrics.engagement.daily_engagement}
        title="Daily Active Users"
      />

      {/* Top Contributors */}
      <Table
        data={metrics.engagement.top_contributors}
        columns={['name', 'action_count', 'total_coins']}
        title="Top Contributors"
      />
    </div>
  );
}
```

### Python Script Example

```python
import requests

def get_analytics(token, days=30):
    """Fetch analytics for reporting"""
    base_url = "http://localhost:8000/api/analytics"
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch overview
    overview = requests.get(
        f"{base_url}/overview",
        headers=headers
    ).json()

    print(f"Total Users: {overview['data']['total_users']}")
    print(f"Engagement Rate: {overview['data']['engagement_rate']}%")
    print(f"Active Users (30d): {overview['data']['active_users_30d']}")

    # Fetch growth metrics
    growth = requests.get(
        f"{base_url}/users/growth?days={days}",
        headers=headers
    ).json()

    print(f"\nGrowth Rate: {growth['data']['growth_rate_percent']}%")
    print(f"New Users ({days}d): {growth['data']['new_users']}")

    # Fetch retention
    retention = requests.get(
        f"{base_url}/retention",
        headers=headers
    ).json()

    print(f"\nRetention Rate: {retention['data']['overall_retention_rate']}%")

    return overview, growth, retention

# Usage
token = "your_jwt_token_here"
get_analytics(token, days=30)
```

## Key Metrics to Track

### For Startup Growth

1. **User Acquisition**
   - Target: >10% month-over-month growth
   - Monitor: Daily signup trends, OAuth adoption

2. **User Engagement**
   - Target: >30% MAU/Total Users
   - Target: >20% DAU/MAU (stickiness)
   - Monitor: Actions per user, daily engagement

3. **Retention**
   - Target: >40% 7-day retention
   - Monitor: Cohort retention trends

4. **Content Quality**
   - Target: >70% data quality score
   - Monitor: Verification coverage, chargers needing attention

5. **Feature Adoption**
   - Target: >60% verification adoption
   - Target: >40% photo upload adoption
   - Monitor: Feature usage trends

## Performance Tips

1. **Use individual endpoints** for specific metric updates
2. **Cache results** on frontend (30-60 second refresh)
3. **Use `/dashboard` endpoint** only for initial load
4. **Monitor query performance** in production
5. **Consider adding indexes** if queries become slow

## Future Enhancements

To further improve the analytics system, consider:

1. **Background Jobs**: Use Celery/APScheduler to pre-compute daily snapshots
2. **Caching**: Implement Redis caching for frequently accessed metrics
3. **Real-time Events**: Add WebSocket support for live updates
4. **Custom Date Ranges**: Allow flexible date filtering
5. **Export Functionality**: Add CSV/Excel export
6. **Geographic Analytics**: Add location-based insights
7. **Funnel Analysis**: Track user journey and conversion funnels
8. **A/B Testing Framework**: Experiment tracking and analysis

## Troubleshooting

### Migration Fails
```bash
# Check alembic version
alembic current

# If behind, run upgrade
alembic upgrade head

# If issues persist, check database connection in .env
```

### 401 Unauthorized
- Verify JWT token is valid
- Check token hasn't expired
- Ensure Authorization header format: `Bearer <token>`

### Slow Query Performance
- Check database indexes are created
- Consider adding caching layer
- Use individual endpoints instead of `/dashboard`
- Monitor database query logs

### No Data Returned
- Verify users exist in database
- Check that activities (coin transactions, verifications) have been recorded
- Ensure date ranges are appropriate

## Support

For detailed API documentation, see: `backend/ANALYTICS_API.md`

For issues:
1. Check backend logs for errors
2. Verify database migration completed
3. Test individual endpoints to isolate issues
4. Check authentication token validity

---

**Version:** 1.0.0
**Created:** 2025-11-17
**Platform:** FastAPI + PostgreSQL + SQLAlchemy
