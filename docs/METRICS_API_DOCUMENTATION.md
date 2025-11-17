# Analytics & Metrics API Documentation

## Table of Contents
- [Overview](#overview)
- [Analytics Endpoints](#analytics-endpoints)
- [Metrics Breakdown](#metrics-breakdown)
- [Usage Examples](#usage-examples)
- [Frontend Integration](#frontend-integration)
- [Admin Dashboard](#admin-dashboard)

---

## Overview

The SharaSpot Analytics API provides comprehensive Business Intelligence (BI) metrics for monitoring platform health, user engagement, data quality, and gamification effectiveness.

### Key Features
- **Real-Time Metrics**: Up-to-date platform statistics
- **Time-Series Data**: Track trends over customizable periods
- **Cohort Analysis**: User retention tracking
- **Feature Adoption**: Monitor feature usage
- **Parallel Execution**: Optimized multi-metric queries
- **Flexible Time Windows**: Customizable date ranges

### Base URL
```
/api/analytics
```

---

## Analytics Endpoints

### 1. Overview Metrics

**GET** `/api/analytics/overview`

**Description**: High-level platform metrics

**Response**:
```json
{
  "total_users": 1245,
  "total_chargers": 3892,
  "total_verifications": 8765,
  "active_users_30d": 432,
  "engagement_rate": 34.7,
  "oauth_adoption": 65.2,
  "avg_verifications_per_charger": 2.25
}
```

**Metrics Explained**:
- `total_users`: Total registered users (including guests)
- `total_chargers`: Total chargers in database
- `total_verifications`: Total verification reports submitted
- `active_users_30d`: Users with activity in last 30 days
- `engagement_rate`: (Active users / Total users) × 100
- `oauth_adoption`: % of users using OAuth (vs email/password)
- `avg_verifications_per_charger`: Total verifications / Total chargers

---

### 2. User Growth Metrics

**GET** `/api/analytics/users/growth?days=30`

**Description**: User signup trends over time

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | integer | 30 | Number of days to analyze |

**Response**:
```json
{
  "period_days": 30,
  "new_users_total": 125,
  "new_users_by_type": {
    "email": 45,
    "oauth": 78,
    "guest": 2
  },
  "daily_signups": [
    {"date": "2025-11-01", "count": 5, "oauth": 3, "email": 2},
    {"date": "2025-11-02", "count": 7, "oauth": 4, "email": 3}
  ],
  "growth_rate": 12.5,
  "previous_period_total": 110
}
```

**Metrics Explained**:
- `new_users_total`: Users created in the period
- `new_users_by_type`: Breakdown by auth method
- `daily_signups`: Daily signup trend data
- `growth_rate`: % change vs. previous period
- `previous_period_total`: Baseline for growth calculation

---

### 3. Active Users Metrics

**GET** `/api/analytics/users/active`

**Description**: Daily, Weekly, Monthly Active Users (DAU/WAU/MAU)

**Response**:
```json
{
  "dau": 145,
  "wau": 432,
  "mau": 876,
  "stickiness_dau_mau": 16.6,
  "stickiness_wau_mau": 49.3,
  "dau_trend": [
    {"date": "2025-11-01", "count": 142},
    {"date": "2025-11-02", "count": 138},
    {"date": "2025-11-03", "count": 145}
  ]
}
```

**Metrics Explained**:
- `dau`: Daily Active Users (last 24 hours)
- `wau`: Weekly Active Users (last 7 days)
- `mau`: Monthly Active Users (last 30 days)
- `stickiness_dau_mau`: (DAU / MAU) × 100 - how often users return
  - <20%: Low stickiness
  - 20-40%: Moderate stickiness
  - >40%: High stickiness (excellent retention)
- `stickiness_wau_mau`: (WAU / MAU) × 100
- `dau_trend`: Last 7 days of DAU data

**Industry Benchmarks**:
| Platform Type | Target Stickiness |
|---------------|-------------------|
| Social Media | 50-60% |
| Utility Apps | 20-30% |
| Gaming | 40-50% |

---

### 4. Engagement Metrics

**GET** `/api/analytics/engagement`

**Description**: User engagement and contribution metrics

**Response**:
```json
{
  "avg_actions_per_user": 12.3,
  "actions_by_type": {
    "charger_added": 456,
    "verification": 2345,
    "photo_uploaded": 789,
    "navigation_used": 1234
  },
  "top_contributors": [
    {
      "user_id": "uuid",
      "name": "John Doe",
      "chargers_added": 25,
      "verifications": 120,
      "photos": 45,
      "trust_score": 98
    }
  ],
  "daily_engagement": [
    {"date": "2025-11-01", "total_actions": 245},
    {"date": "2025-11-02", "total_actions": 287}
  ]
}
```

**Metrics Explained**:
- `avg_actions_per_user`: Total actions / Total users
- `actions_by_type`: Breakdown of user activities
- `top_contributors`: Top 10 users by contribution
- `daily_engagement`: Trend of daily platform activity

---

### 5. Charger Metrics

**GET** `/api/analytics/chargers`

**Description**: Charger data quality and source metrics

**Response**:
```json
{
  "total_chargers": 3892,
  "chargers_by_source": {
    "official": 3245,
    "community_manual": 647
  },
  "verification_level_distribution": {
    "level_5": 892,
    "level_4": 1234,
    "level_3": 987,
    "level_2": 456,
    "level_1": 323
  },
  "avg_verification_level": 3.6,
  "high_quality_chargers": 2126,
  "high_quality_percentage": 54.6,
  "chargers_with_photos": 1567,
  "photo_coverage": 40.3
}
```

**Metrics Explained**:
- `chargers_by_source`: Official APIs vs. community-submitted
- `verification_level_distribution`: Count per level (1-5)
- `avg_verification_level`: Mean verification level
- `high_quality_chargers`: Level 4+ chargers
- `high_quality_percentage`: % of chargers at level 4+
- `photo_coverage`: % of chargers with photos

**Data Quality Indicators**:
- High quality: >50% Level 4+
- Photo coverage target: >60%
- Community contribution: 10-20% ideal

---

### 6. Gamification Metrics

**GET** `/api/analytics/gamification`

**Description**: Coin economy and rewards metrics

**Response**:
```json
{
  "total_coins_earned": 45678,
  "total_coins_spent": 12345,
  "coins_in_circulation": 33333,
  "avg_coins_per_user": 26.8,
  "coins_by_action": {
    "charger_added": 15678,
    "verification": 23456,
    "photo_upload": 5678,
    "navigation": 890
  },
  "top_earners": [
    {
      "user_id": "uuid",
      "name": "Jane Smith",
      "total_coins": 1245,
      "trust_score": 100
    }
  ],
  "daily_coin_trend": [
    {
      "date": "2025-11-01",
      "earned": 456,
      "spent": 123
    }
  ],
  "coin_economy_health": "healthy"
}
```

**Metrics Explained**:
- `total_coins_earned`: All-time coins awarded
- `total_coins_spent`: All-time coins spent (future: premium features)
- `coins_in_circulation`: Earned - Spent
- `avg_coins_per_user`: Total coins / Total users
- `coins_by_action`: Breakdown of coin sources
- `coin_economy_health`: "healthy" if spend rate <50% of earn rate

**Economy Health Indicators**:
- Healthy: Earn rate >> Spend rate (growth phase)
- Balanced: Earn rate ≈ Spend rate (mature)
- Warning: Spend rate > Earn rate (deflation)

---

### 7. Retention Metrics

**GET** `/api/analytics/retention`

**Description**: User retention and cohort analysis

**Response**:
```json
{
  "retention_7d": 45.2,
  "retention_30d": 28.7,
  "cohort_analysis": [
    {
      "cohort_week": "2025-W44",
      "cohort_size": 125,
      "week_0": 100.0,
      "week_1": 65.6,
      "week_2": 52.0,
      "week_3": 45.6,
      "week_4": 38.4
    }
  ],
  "avg_session_count": 8.5,
  "churn_rate_30d": 71.3
}
```

**Metrics Explained**:
- `retention_7d`: % of users active 7 days after signup
- `retention_30d`: % of users active 30 days after signup
- `cohort_analysis`: Weekly cohort retention curves (8 weeks)
  - `cohort_week`: ISO week (YYYY-Www)
  - `cohort_size`: Users signed up that week
  - `week_0` to `week_7`: Retention % for each week
- `avg_session_count`: Average sessions per user
- `churn_rate_30d`: 100 - retention_30d

**Cohort Analysis Example**:
```
Week 44 cohort (125 users):
Week 0: 100% (all active at signup)
Week 1: 65.6% (82 users returned)
Week 2: 52.0% (65 users returned)
Week 3: 45.6% (57 users returned)
Week 4: 38.4% (48 users returned)
```

**Industry Benchmarks**:
| App Type | 7-Day Retention | 30-Day Retention |
|----------|-----------------|------------------|
| Utility | 30-40% | 15-25% |
| Social | 40-50% | 20-30% |
| Gaming | 20-30% | 10-15% |

---

### 8. Feature Adoption Metrics

**GET** `/api/analytics/features/adoption`

**Description**: Feature usage and adoption rates

**Response**:
```json
{
  "total_users": 1245,
  "oauth_adoption": {
    "users_count": 812,
    "adoption_rate": 65.2
  },
  "charger_contribution": {
    "users_count": 234,
    "adoption_rate": 18.8
  },
  "verification_participation": {
    "users_count": 567,
    "adoption_rate": 45.5
  },
  "photo_upload": {
    "users_count": 345,
    "adoption_rate": 27.7
  },
  "navigation_usage": {
    "users_count": 678,
    "adoption_rate": 54.5
  }
}
```

**Metrics Explained**:
- `adoption_rate`: (Users using feature / Total users) × 100
- `users_count`: Number of users who've used the feature

**Adoption Targets**:
- Critical features (navigation): >50%
- Engagement features (verification): >40%
- Content creation (chargers): >15%
- Premium features (OAuth): >60%

---

### 9. Dashboard (All Metrics)

**GET** `/api/analytics/dashboard`

**Description**: Complete analytics dashboard in one call

**Response**:
```json
{
  "overview": { /* Overview metrics */ },
  "user_growth": { /* User growth metrics */ },
  "active_users": { /* Active user metrics */ },
  "engagement": { /* Engagement metrics */ },
  "chargers": { /* Charger metrics */ },
  "gamification": { /* Gamification metrics */ },
  "retention": { /* Retention metrics */ },
  "feature_adoption": { /* Feature adoption metrics */ }
}
```

**Performance**: Parallel query execution (~500-800ms total)

---

## Metrics Breakdown

### Business Health Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| User Growth Rate | (New Users / Previous Period Users) × 100 | >10% monthly |
| Engagement Rate | (Active Users / Total Users) × 100 | >30% |
| Stickiness | (DAU / MAU) × 100 | >20% |
| Data Quality | (Level 4+ Chargers / Total Chargers) × 100 | >50% |

---

### User Quality Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Trust Score Distribution | Avg(User Trust Scores) | >40 |
| Contribution Rate | (Contributing Users / Total Users) × 100 | >20% |
| Verification Rate | Avg(Verifications per Charger) | >2.0 |
| Photo Coverage | (Chargers with Photos / Total Chargers) × 100 | >50% |

---

### Platform Health Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| 7-Day Retention | (Active Week 1 / Signups) × 100 | >35% |
| Coin Velocity | Total Coins Spent / Total Coins Earned | <0.5 (growth) |
| API Uptime | (Successful Requests / Total Requests) × 100 | >99.5% |
| Avg Response Time | Mean API response time | <200ms |

---

## Usage Examples

### Admin Dashboard Implementation

```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';

export function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch all metrics in one call
      const response = await axios.get('/api/analytics/dashboard');

      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="dashboard">
      {/* Overview Cards */}
      <div className="overview-grid">
        <MetricCard
          title="Total Users"
          value={analytics.overview.total_users}
          icon="users"
        />
        <MetricCard
          title="Total Chargers"
          value={analytics.overview.total_chargers}
          icon="charging-station"
        />
        <MetricCard
          title="Active Users (30d)"
          value={analytics.overview.active_users_30d}
          icon="activity"
        />
        <MetricCard
          title="Engagement Rate"
          value={`${analytics.overview.engagement_rate}%`}
          icon="trending-up"
        />
      </div>

      {/* User Growth Chart */}
      <ChartCard title="User Growth">
        <LineChart
          data={analytics.user_growth.daily_signups}
          xKey="date"
          yKey="count"
        />
      </ChartCard>

      {/* Stickiness Metrics */}
      <div className="stickiness-grid">
        <MetricCard
          title="DAU"
          value={analytics.active_users.dau}
        />
        <MetricCard
          title="MAU"
          value={analytics.active_users.mau}
        />
        <MetricCard
          title="Stickiness"
          value={`${analytics.active_users.stickiness_dau_mau}%`}
          trend={analytics.active_users.stickiness_dau_mau > 20 ? 'up' : 'down'}
        />
      </div>

      {/* Cohort Analysis */}
      <ChartCard title="Retention Cohorts">
        <CohortChart data={analytics.retention.cohort_analysis} />
      </ChartCard>

      {/* Top Contributors */}
      <TableCard title="Top Contributors">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Chargers</th>
              <th>Verifications</th>
              <th>Trust Score</th>
            </tr>
          </thead>
          <tbody>
            {analytics.engagement.top_contributors.map(user => (
              <tr key={user.user_id}>
                <td>{user.name}</td>
                <td>{user.chargers_added}</td>
                <td>{user.verifications}</td>
                <td>{user.trust_score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}
```

---

### Fetching Specific Metrics

```typescript
// User growth for last 90 days
const userGrowth = await axios.get('/api/analytics/users/growth?days=90');

console.log(`New users: ${userGrowth.data.new_users_total}`);
console.log(`Growth rate: ${userGrowth.data.growth_rate}%`);

// Active users
const activeUsers = await axios.get('/api/analytics/users/active');

console.log(`DAU: ${activeUsers.data.dau}`);
console.log(`Stickiness: ${activeUsers.data.stickiness_dau_mau}%`);

// Charger quality
const chargers = await axios.get('/api/analytics/chargers');

console.log(`High quality: ${chargers.data.high_quality_percentage}%`);
console.log(`Photo coverage: ${chargers.data.photo_coverage}%`);
```

---

## Frontend Integration

### Dashboard Components

#### 1. Metric Card
```typescript
interface MetricCardProps {
  title: string;
  value: number | string;
  icon: string;
  trend?: 'up' | 'down';
  trendValue?: string;
}

export function MetricCard({ title, value, icon, trend, trendValue }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="card-header">
        <span className="icon">{icon}</span>
        <span className="title">{title}</span>
      </div>
      <div className="card-body">
        <span className="value">{value}</span>
        {trend && (
          <span className={`trend ${trend}`}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </span>
        )}
      </div>
    </div>
  );
}
```

---

#### 2. Line Chart (User Growth)
```typescript
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function UserGrowthChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#00C853" strokeWidth={2} />
        <Line type="monotone" dataKey="oauth" stroke="#64DD17" strokeWidth={2} />
        <Line type="monotone" dataKey="email" stroke="#FFD600" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

---

#### 3. Cohort Heatmap
```typescript
export function CohortHeatmap({ cohorts }) {
  return (
    <table className="cohort-table">
      <thead>
        <tr>
          <th>Cohort</th>
          <th>Size</th>
          {[...Array(8)].map((_, i) => (
            <th key={i}>Week {i}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {cohorts.map(cohort => (
          <tr key={cohort.cohort_week}>
            <td>{cohort.cohort_week}</td>
            <td>{cohort.cohort_size}</td>
            {[...Array(8)].map((_, i) => {
              const retention = cohort[`week_${i}`];
              const color = getRetentionColor(retention);
              return (
                <td key={i} style={{ backgroundColor: color }}>
                  {retention ? `${retention.toFixed(1)}%` : '-'}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function getRetentionColor(retention: number): string {
  if (retention >= 50) return '#00C853';
  if (retention >= 40) return '#64DD17';
  if (retention >= 30) return '#FFD600';
  if (retention >= 20) return '#FF6D00';
  return '#DD2C00';
}
```

---

## Admin Dashboard

### Access Control

**Authentication**: Admin users only

**Authorization**:
```python
from app.core.security import require_admin

@router.get("/analytics/dashboard")
@require_admin
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Only admins can access analytics
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    # Return analytics data
    ...
```

---

### Real-Time Updates

**WebSocket Integration** (Future Enhancement):
```typescript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export function useRealtimeAnalytics() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const socket = io('/analytics');

    socket.on('metrics_update', (data) => {
      setAnalytics(data);
    });

    return () => socket.disconnect();
  }, []);

  return analytics;
}
```

---

### Export Functionality

**CSV Export**:
```typescript
const exportToCSV = async (metric: string) => {
  const response = await axios.get(`/api/analytics/${metric}`, {
    headers: { 'Accept': 'text/csv' }
  });

  const blob = new Blob([response.data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${metric}_${new Date().toISOString()}.csv`;
  link.click();
};
```

---

## Performance Considerations

### Caching Strategy

**Redis Caching** (Future):
```python
from redis import Redis

redis = Redis(host='localhost', port=6379, db=0)

@router.get("/analytics/overview")
async def get_overview(db: AsyncSession = Depends(get_db)):
    # Check cache
    cached = redis.get('analytics:overview')
    if cached:
        return json.loads(cached)

    # Compute metrics
    metrics = await compute_overview_metrics(db)

    # Cache for 5 minutes
    redis.setex('analytics:overview', 300, json.dumps(metrics))

    return metrics
```

---

### Query Optimization

**Parallel Execution**:
```python
import asyncio

async def get_dashboard(db: AsyncSession):
    # Execute all queries in parallel
    overview, growth, active, engagement, chargers, gamification, retention, adoption = await asyncio.gather(
        get_overview_metrics(db),
        get_user_growth(db),
        get_active_users(db),
        get_engagement(db),
        get_charger_metrics(db),
        get_gamification_metrics(db),
        get_retention_metrics(db),
        get_feature_adoption(db)
    )

    return {
        "overview": overview,
        "user_growth": growth,
        # ... etc
    }
```

---

This comprehensive documentation covers the complete Analytics & Metrics API. For backend integration, see [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md).
