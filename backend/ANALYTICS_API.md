# Analytics & Business Intelligence API Documentation

## Overview

The Analytics API provides comprehensive metrics and insights for tracking SharaSpot's performance, user engagement, and business health. All endpoints require authentication via JWT token.

**Base URL:** `/api/analytics`

---

## Quick Start

### Running the Migration

Before using the analytics endpoints, run the database migration:

```bash
cd backend
alembic upgrade head
```

This creates the `analytics_snapshots` and `user_activity_events` tables.

### Authentication

All analytics endpoints require authentication. Include your JWT token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

---

## API Endpoints

### 1. Overview Metrics
**Endpoint:** `GET /api/analytics/overview`

High-level dashboard overview with key performance indicators.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_users": 1250,
    "total_chargers": 450,
    "total_verifications": 3200,
    "total_coins_earned": 24500,
    "active_users_30d": 380,
    "engagement_rate": 30.4,
    "avg_verifications_per_charger": 7.11,
    "oauth_adoption_rate": 65.2
  }
}
```

**Use Case:** Main dashboard overview card

---

### 2. User Growth Metrics
**Endpoint:** `GET /api/analytics/users/growth?days=30`

Track user acquisition and growth trends.

**Query Parameters:**
- `days` (optional): Number of days to analyze (1-365, default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "total_users": 1250,
    "new_users": 85,
    "growth_rate_percent": 12.5,
    "daily_signups": [
      {"date": "2025-11-01T00:00:00+00:00", "count": 3},
      {"date": "2025-11-02T00:00:00+00:00", "count": 5},
      ...
    ],
    "oauth_users": 815,
    "email_users": 435,
    "guest_users": 42,
    "period_days": 30
  }
}
```

**Key Metrics:**
- `growth_rate_percent`: Percentage growth compared to previous period
- `daily_signups`: Time series data for charting
- OAuth vs Email breakdown for acquisition channel analysis

**Use Case:** User acquisition charts, growth trend analysis

---

### 3. Active Users (DAU/WAU/MAU)
**Endpoint:** `GET /api/analytics/users/active`

Daily, Weekly, and Monthly Active Users metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "dau": 125,
    "wau": 342,
    "mau": 780,
    "total_users": 1250,
    "stickiness_percent": 16.03,
    "dau_to_mau_ratio": 0.1603,
    "wau_to_mau_ratio": 0.4385
  }
}
```

**Key Metrics:**
- `dau`: Users active in last 24 hours
- `wau`: Users active in last 7 days
- `mau`: Users active in last 30 days
- `stickiness_percent`: DAU/MAU ratio (industry benchmark: >20% is excellent)

**Use Case:** Engagement health monitoring, retention indicator

---

### 4. Engagement Metrics
**Endpoint:** `GET /api/analytics/engagement?days=30`

Detailed user engagement and activity patterns.

**Query Parameters:**
- `days` (optional): Number of days to analyze (1-365, default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "total_actions": 5240,
    "active_users": 380,
    "actions_per_user": 13.79,
    "action_breakdown": {
      "add_charger": 145,
      "verify_charger": 3200,
      "upload_photo": 1850,
      "report_invalid": 45
    },
    "top_contributors": [
      {
        "user_id": "uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "action_count": 156,
        "total_coins": 892
      },
      ...
    ],
    "daily_engagement": [
      {
        "date": "2025-11-01T00:00:00+00:00",
        "active_users": 125,
        "total_actions": 178
      },
      ...
    ],
    "period_days": 30
  }
}
```

**Use Case:**
- Identify power users
- Track activity trends
- Understand action distribution

---

### 5. Charger Metrics
**Endpoint:** `GET /api/analytics/chargers`

Content quality and charger data metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_chargers": 450,
    "source_breakdown": {
      "official": 320,
      "community_manual": 130
    },
    "verification_distribution": [
      {"level": 1, "count": 12},
      {"level": 2, "count": 28},
      {"level": 3, "count": 95},
      {"level": 4, "count": 180},
      {"level": 5, "count": 135}
    ],
    "needs_verification": 85,
    "avg_verifications_per_charger": 7.11,
    "most_verified_chargers": [
      {
        "charger_id": "uuid",
        "name": "Tesla Supercharger Downtown",
        "address": "123 Main St",
        "verification_count": 45
      },
      ...
    ],
    "verification_actions": {
      "active": 2800,
      "not_working": 250,
      "partial": 150
    },
    "data_quality_score": 72.5,
    "high_quality_chargers": 315
  }
}
```

**Key Metrics:**
- `data_quality_score`: Percentage of chargers with verification_level >= 4 and 3+ verifications
- `needs_verification`: Chargers with level < 3 or not verified in 90 days

**Use Case:**
- Monitor content quality
- Identify verification gaps
- Track community vs official data ratio

---

### 6. Gamification Metrics
**Endpoint:** `GET /api/analytics/gamification?days=30`

Rewards economy and gamification effectiveness.

**Query Parameters:**
- `days` (optional): Number of days to analyze (1-365, default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "total_coins_earned": 124500,
    "period_coins_earned": 8950,
    "coins_by_action": {
      "add_charger": {"total_coins": 2500, "count": 145},
      "verify_charger": {"total_coins": 5200, "count": 3200},
      "upload_photo": {"total_coins": 1150, "count": 1850}
    },
    "avg_coins_per_user": 23.55,
    "top_earners": [
      {
        "user_id": "uuid",
        "name": "Jane Smith",
        "total_coins": 1250,
        "trust_score": 85.5
      },
      ...
    ],
    "trust_score_distribution": {
      "0-20": 150,
      "20-40": 280,
      "40-60": 420,
      "60-80": 320,
      "80-100": 80
    },
    "daily_coins": [
      {
        "date": "2025-11-01T00:00:00+00:00",
        "earned": 285,
        "spent": 50
      },
      ...
    ],
    "period_days": 30
  }
}
```

**Use Case:**
- Monitor reward economy health
- Track gamification ROI
- Identify top contributors

---

### 7. Retention Metrics
**Endpoint:** `GET /api/analytics/retention`

Cohort-based retention analysis.

**Response:**
```json
{
  "success": true,
  "data": {
    "overall_retention_rate": 42.5,
    "cohorts": [
      {
        "cohort_week": "2025-11-10",
        "cohort_size": 45,
        "retained_users": 18,
        "retention_rate": 40.0
      },
      {
        "cohort_week": "2025-11-03",
        "cohort_size": 52,
        "retained_users": 23,
        "retention_rate": 44.23
      },
      ...
    ],
    "measurement_period": "7_day_retention"
  }
}
```

**Key Metrics:**
- `overall_retention_rate`: Percentage of users (signed up 14+ days ago) active in last 7 days
- `cohorts`: Weekly cohorts with 7-day retention rates

**Use Case:**
- Track retention health
- Identify successful cohorts
- Monitor retention trends

---

### 8. Feature Adoption
**Endpoint:** `GET /api/analytics/features/adoption`

Feature usage and adoption rates.

**Response:**
```json
{
  "success": true,
  "data": {
    "oauth_adoption_rate": 65.2,
    "photo_upload_adoption_rate": 48.5,
    "verification_adoption_rate": 72.3,
    "charger_contribution_adoption_rate": 35.8,
    "oauth_users": 815,
    "photo_uploaders": 606,
    "verifiers": 904,
    "contributors": 447,
    "total_users": 1250
  }
}
```

**Use Case:**
- Track feature usage
- Prioritize product development
- Identify underutilized features

---

### 9. Complete Dashboard
**Endpoint:** `GET /api/analytics/dashboard?days=30`

**⚠️ Performance Note:** This endpoint fetches all metrics in one call. May be slower than individual endpoints.

**Query Parameters:**
- `days` (optional): Number of days for trend metrics (1-90, default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": { ... },
    "user_growth": { ... },
    "active_users": { ... },
    "engagement": { ... },
    "chargers": { ... },
    "gamification": { ... },
    "retention": { ... },
    "feature_adoption": { ... }
  },
  "metadata": {
    "generated_at": "2025-11-17T12:34:56+00:00",
    "days_analyzed": 30
  }
}
```

**Use Case:**
- Dashboard initialization
- Complete analytics export

**Recommendation:** For better performance, use individual endpoints for specific metric updates rather than polling this endpoint frequently.

---

## Key Startup Metrics Guide

### 1. **User Growth Health**
- **Total Users** trending up
- **Growth Rate** > 10% month-over-month (early stage)
- **OAuth Adoption** > 60% (indicates smooth onboarding)

### 2. **Engagement Health**
- **MAU/Total Users** > 30% (healthy engagement)
- **DAU/MAU (Stickiness)** > 20% (excellent retention)
- **Actions per User** > 5 (good engagement)

### 3. **Content Quality**
- **Data Quality Score** > 70%
- **Avg Verifications per Charger** > 5
- **High Quality Chargers** > 60% of total

### 4. **Retention Health**
- **7-Day Retention** > 40% (good)
- **Overall Retention Rate** > 35% (healthy)

### 5. **Feature Adoption**
- **Verification Adoption** > 60% (critical feature)
- **Photo Upload Adoption** > 40% (quality indicator)
- **Contribution Adoption** > 30% (community health)

---

## Example Usage

### Dashboard Overview
```javascript
// Fetch overview for main dashboard card
const response = await fetch('/api/analytics/overview', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { data } = await response.json();

// Display KPIs
console.log(`Total Users: ${data.total_users}`);
console.log(`Engagement Rate: ${data.engagement_rate}%`);
console.log(`Active Users (30d): ${data.active_users_30d}`);
```

### Growth Chart
```javascript
// Fetch 90-day growth trend
const response = await fetch('/api/analytics/users/growth?days=90', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { data } = await response.json();

// Chart daily signups
const chartData = data.daily_signups.map(item => ({
  x: new Date(item.date),
  y: item.count
}));
```

### Active Users Widget
```javascript
// Fetch DAU/WAU/MAU
const response = await fetch('/api/analytics/users/active', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { data } = await response.json();

// Display metrics
console.log(`DAU: ${data.dau}`);
console.log(`MAU: ${data.mau}`);
console.log(`Stickiness: ${data.stickiness_percent}%`);
```

---

## Performance Optimization

### Response Times
- Individual endpoints: ~50-200ms
- Complete dashboard: ~300-800ms

### Recommendations
1. **Use individual endpoints** for real-time updates
2. **Use `/dashboard` endpoint** only for initial load
3. **Cache results** on frontend (30-60 second refresh for most metrics)
4. **Use background jobs** for expensive calculations (future enhancement)

---

## Future Enhancements

### Planned Features
1. **Analytics Snapshots**: Pre-computed daily snapshots for faster queries
2. **Custom Date Ranges**: Flexible date filtering
3. **Funnel Analysis**: User journey tracking
4. **Geographic Analytics**: Location-based insights
5. **Comparative Analysis**: Period-over-period comparisons
6. **Export Options**: CSV/Excel export
7. **Real-time Events**: WebSocket support for live metrics
8. **Custom Dashboards**: User-configurable metric combinations

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "detail": "Detailed error description"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `422`: Validation Error (invalid parameters)
- `500`: Internal Server Error

---

## Security Notes

1. **Authentication Required**: All endpoints require valid JWT token
2. **Admin Only**: Currently all authenticated users can access analytics (consider adding admin role check in production)
3. **Rate Limiting**: Standard rate limits apply (60 requests/minute for read operations)
4. **Data Privacy**: User emails are included in top contributors - consider masking in production

---

## Support

For issues or questions:
- Check backend logs for detailed error messages
- Verify database migration completed successfully
- Ensure JWT token is valid and not expired
- Check that user has appropriate permissions

---

## Version

**Version:** 1.0.0
**Last Updated:** 2025-11-17
**Database Migration:** `006_add_analytics_tables.py`
