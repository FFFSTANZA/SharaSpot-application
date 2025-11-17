# Report Verification System Documentation

## Table of Contents
- [Overview](#overview)
- [Verification Algorithm](#verification-algorithm)
- [Trust Score System](#trust-score-system)
- [Rate Limiting & Anti-Spam](#rate-limiting--anti-spam)
- [Coin Reward System](#coin-reward-system)
- [Verification Levels](#verification-levels)
- [API Reference](#api-reference)
- [Frontend Implementation](#frontend-implementation)

---

## Overview

The SharaSpot Report Verification System is a sophisticated, community-driven mechanism for validating the operational status and quality of EV charging stations. It combines multiple factors to create a reliable, spam-resistant verification system.

### Key Features
- **Weighted Scoring Algorithm**: Recent verifications and high-trust users have more impact
- **Time-Decay Model**: Older verifications gradually lose influence
- **Trust-Based Weighting**: User reputation affects verification weight
- **Rate Limiting**: Prevents spam and coordinated attacks
- **Gamification**: Coin rewards incentivize detailed reports
- **Dynamic Levels**: Verification level (1-5) updates in real-time

---

## Verification Algorithm

### Core Concept

Each verification report has a **weighted value** determined by:
1. **Base Value**: Action type (active, partial, not_working)
2. **Time Weight**: How recent the verification is
3. **Trust Multiplier**: Reporter's trust score

**Formula**:
```
weighted_value = base_value × time_weight × trust_multiplier
```

---

### 1. Base Values

**Action Types**:
```python
ACTION_VALUES = {
    "active": 3.0,           # Fully operational
    "partial": 1.0,          # Partially working
    "not_working": -5.0      # Not operational
}
```

**Reasoning**:
- `active` contributes positively (strong signal)
- `partial` contributes weakly (uncertain signal)
- `not_working` contributes negatively (strong negative signal, higher magnitude to prioritize safety)

---

### 2. Time-Decay Weight

**Half-Life Model**: Verification influence halves every 30 days

**Formula**:
```python
def calculate_time_weight(age_in_days: float) -> float:
    """
    Calculate time-decay weight using exponential decay.

    Half-life = 30 days
    After 30 days: weight = 0.5
    After 60 days: weight = 0.25
    After 90 days: weight = 0.125
    After >90 days: effectively minimal impact
    """
    HALF_LIFE_DAYS = 30
    time_weight = 0.5 ** (age_in_days / HALF_LIFE_DAYS)

    return time_weight
```

**Examples**:
| Age | Weight | Impact |
|-----|--------|--------|
| 0 days | 1.0 | 100% |
| 15 days | 0.707 | 70.7% |
| 30 days | 0.5 | 50% |
| 60 days | 0.25 | 25% |
| 90 days | 0.125 | 12.5% |
| 120 days | 0.0625 | 6.25% |

**Age Filter**: Verifications older than 90 days are excluded from calculations to maintain relevance.

---

### 3. Trust Multiplier

**User Trust Score**: 0-100 scale based on contribution history

**Formula**:
```python
def calculate_trust_multiplier(trust_score: int) -> float:
    """
    Convert trust score (0-100) to weight multiplier (0.5-2.0).

    - New users (trust=0): 0.5× (reduced impact)
    - Average users (trust=50): 1.25×
    - High-trust users (trust=100): 2.0× (double impact)
    """
    # Linear scaling: 0.5 + (trust_score / 100) × 1.5
    trust_multiplier = 0.5 + (trust_score / 100) * 1.5

    return trust_multiplier
```

**Examples**:
| Trust Score | Multiplier | Impact |
|-------------|------------|--------|
| 0 (new user) | 0.5× | Reduced (anti-spam) |
| 25 | 0.875× | Below average |
| 50 | 1.25× | Average |
| 75 | 1.625× | Above average |
| 100 (veteran) | 2.0× | Double (reward consistency) |

---

### 4. Weighted Score Calculation

**Complete Formula**:
```python
async def calculate_weighted_verification_score(
    charger_id: str,
    db: AsyncSession
) -> Tuple[int, float, float]:
    """
    Calculate verification level based on weighted scores.

    Returns:
        (verification_level, weighted_positive, weighted_negative)
    """
    # Fetch all verifications for the charger (last 90 days)
    verifications = await db.execute(
        select(VerificationAction)
        .where(
            VerificationAction.charger_id == charger_id,
            VerificationAction.timestamp >= datetime.utcnow() - timedelta(days=90)
        )
    )
    verifications = verifications.scalars().all()

    weighted_positive = 0.0
    weighted_negative = 0.0

    for verification in verifications:
        # Calculate age in days
        age_days = (datetime.utcnow() - verification.timestamp).total_seconds() / 86400

        # Calculate time weight
        time_weight = 0.5 ** (age_days / 30)

        # Get user's trust score
        user = await db.get(User, verification.user_id)
        trust_multiplier = 0.5 + (user.trust_score / 100) * 1.5

        # Get base value for action
        base_value = {
            "active": 3.0,
            "partial": 1.0,
            "not_working": -5.0
        }[verification.action]

        # Calculate weighted value
        weighted_value = base_value * time_weight * trust_multiplier

        # Accumulate positive/negative scores
        if weighted_value > 0:
            weighted_positive += weighted_value
        else:
            weighted_negative += abs(weighted_value)

    # Determine verification level
    verification_level = determine_verification_level(
        weighted_positive,
        weighted_negative
    )

    return verification_level, weighted_positive, weighted_negative
```

---

## Verification Levels

### Level Determination Logic

```python
def determine_verification_level(
    weighted_positive: float,
    weighted_negative: float
) -> int:
    """
    Determine verification level (1-5) based on weighted scores.

    Priority: Safety-first approach
    - Critical failures (not_working) trigger Level 1
    - Positive verifications increase level
    - Net score determines final level
    """
    # Critical: Recent not_working reports
    if weighted_negative >= 2.0:
        return 1  # NOT OPERATIONAL (safety priority)

    # Calculate net score
    net_score = weighted_positive - weighted_negative

    # Determine level based on net score
    if net_score >= 6.0:
        return 5  # EXCELLENT (strong positive consensus)
    elif net_score >= 4.0:
        return 4  # GOOD (positive consensus)
    elif net_score >= 2.0:
        return 3  # MODERATE (some positive signals)
    elif net_score >= 0.0:
        return 2  # LOW (neutral/uncertain)
    else:
        return 1  # POOR (net negative)
```

### Level Descriptions

| Level | Name | Color | Description | Criteria |
|-------|------|-------|-------------|----------|
| 5 | Excellent | Green | Highly reliable, recently verified as operational | Net score ≥ 6.0 |
| 4 | Good | Light Green | Reliable, mostly positive verifications | Net score ≥ 4.0 |
| 3 | Moderate | Yellow | Some positive signals, needs more verification | Net score ≥ 2.0 |
| 2 | Low | Orange | Uncertain status, limited data | Net score ≥ 0.0 |
| 1 | Poor | Red | Not operational or significant issues | Weighted negative ≥ 2.0 OR net < 0 |

### Visual Indicators

**Frontend Display**:
```typescript
const VERIFICATION_COLORS = {
  5: '#00C853', // Green
  4: '#64DD17', // Light Green
  3: '#FFD600', // Yellow
  2: '#FF6D00', // Orange
  1: '#DD2C00', // Red
};

const VERIFICATION_LABELS = {
  5: 'Excellent',
  4: 'Good',
  3: 'Moderate',
  2: 'Low',
  1: 'Poor',
};
```

---

## Trust Score System

### Trust Score Calculation

**Formula**:
```python
def calculate_trust_score(user: User) -> int:
    """
    Calculate user trust score (0-100) based on contributions.

    Components:
    - Chargers added: 10 points each
    - Verifications: 2 points each
    - Photos uploaded: 3 points each

    Capped at 100 to prevent inflation.
    """
    score = (
        user.chargers_added * 10 +
        user.verifications_count * 2 +
        user.photos_uploaded * 3
    )

    return min(100, score)
```

**Examples**:
| Contributions | Trust Score |
|---------------|-------------|
| 0 chargers, 0 verifications, 0 photos | 0 |
| 1 charger, 5 verifications, 2 photos | 26 |
| 5 chargers, 20 verifications, 10 photos | 120 → 100 (capped) |
| 10 chargers, 50 verifications, 20 photos | 260 → 100 (capped) |

### Trust Score Impact

**Verification Weight Examples**:

**Scenario 1: New User (Trust = 0)**
```
Active verification by new user:
weighted_value = 3.0 × 1.0 (fresh) × 0.5 (new user) = 1.5
```

**Scenario 2: Veteran User (Trust = 100)**
```
Active verification by veteran (1 day old):
weighted_value = 3.0 × 0.977 × 2.0 (veteran) = 5.86
```

**Scenario 3: Spam Attempt**
```
Multiple not_working reports by new user:
weighted_value = -5.0 × 1.0 × 0.5 = -2.5

Due to low trust, spam has reduced impact.
High-trust user consensus can override.
```

---

## Rate Limiting & Anti-Spam

### 1. Per-Charger Rate Limit

**Rule**: 1 verification per charger per user every 5 minutes

**Implementation**:
```python
async def check_rate_limit(
    user_id: str,
    charger_id: str,
    db: AsyncSession
) -> bool:
    """
    Check if user can verify this charger.

    Returns:
        True if allowed, False if rate limited
    """
    five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)

    recent_verification = await db.execute(
        select(VerificationAction)
        .where(
            VerificationAction.user_id == user_id,
            VerificationAction.charger_id == charger_id,
            VerificationAction.timestamp >= five_minutes_ago
        )
    )
    recent_verification = recent_verification.scalar_one_or_none()

    return recent_verification is None
```

**Error Response**:
```json
{
  "detail": "You can only verify this charger once every 5 minutes"
}
```

---

### 2. Spam Velocity Detection

**Rule**: Maximum 12 verifications per hour across all chargers

**Implementation**:
```python
async def detect_spam_velocity(
    user_id: str,
    db: AsyncSession
) -> bool:
    """
    Detect if user is submitting verifications too rapidly.

    Returns:
        True if spam detected, False if normal
    """
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)

    verification_count = await db.execute(
        select(func.count(VerificationAction.id))
        .where(
            VerificationAction.user_id == user_id,
            VerificationAction.timestamp >= one_hour_ago
        )
    )
    count = verification_count.scalar()

    return count >= 12
```

**Error Response**:
```json
{
  "detail": "Too many verifications in the last hour. Please try again later."
}
```

---

### 3. Coordinated Attack Protection

**Strategy**: Low-trust users have reduced impact (0.5× multiplier)

**Example Attack Scenario**:
```
Attacker creates 10 fake accounts, each submits "not_working" report:

Each fake report:
weighted_value = -5.0 × 1.0 × 0.5 = -2.5
Total weighted_negative = 10 × 2.5 = 25.0

Legitimate user (trust=80) submits "active":
weighted_value = 3.0 × 1.0 × 1.7 = 5.1

While attackers cause temporary Level 1, a few high-trust users can restore proper level.
```

---

## Coin Reward System

### Reward Structure

**Base Reward**: 2 coins for any verification

**Bonus Rewards**:
| Detail Level | Bonus | Total Possible |
|--------------|-------|----------------|
| Base verification | +2 | 2 |
| Port context (2/3 fields) | +1 | 3 |
| Operational details (both) | +1 | 4 |
| Quality ratings (complete) | +3 | 7 |
| Wait time info | +1 | 8 |
| Photo evidence (not_working) | +2 | 9 |

---

### Port Context (+1 coin)

**Required**: 2 out of 3 fields
- `wait_time` (integer, minutes)
- `port_type_used` (string)
- `ports_available` (integer)
- `charging_success` (boolean)

**Example**:
```json
{
  "wait_time": 5,
  "port_type_used": "ccs2",
  "ports_available": 2
}
```

---

### Operational Details (+1 coin)

**Required**: Both fields
- `payment_method` (string: "app", "card", "cash", "free")
- `station_lighting` (string: "excellent", "good", "poor", "none")

**Example**:
```json
{
  "payment_method": "app",
  "station_lighting": "excellent"
}
```

---

### Quality Ratings (+3 coins)

**Required**: All 4 fields
- `cleanliness_rating` (integer, 1-5)
- `charging_speed_rating` (integer, 1-5)
- `amenities_rating` (integer, 1-5)
- `would_recommend` (boolean)

**Example**:
```json
{
  "cleanliness_rating": 5,
  "charging_speed_rating": 4,
  "amenities_rating": 4,
  "would_recommend": true
}
```

---

### Photo Evidence (+2 coins for not_working)

**Requirement**: Photo only rewards coins for `not_working` reports (evidence of issue)

**Example**:
```json
{
  "action": "not_working",
  "photo": "base64_encoded_image_data",
  "notes": "Charger displays error code E42"
}
```

**Rationale**: Photo evidence is critical for not_working reports to prevent false negatives.

---

### Coin Calculation Example

**Scenario**: Detailed active verification
```json
{
  "action": "active",
  "notes": "Working perfectly",

  // Port context
  "wait_time": 5,
  "port_type_used": "ccs2",
  "ports_available": 2,
  "charging_success": true,

  // Operational details
  "payment_method": "app",
  "station_lighting": "excellent",

  // Quality ratings
  "cleanliness_rating": 5,
  "charging_speed_rating": 4,
  "amenities_rating": 4,
  "would_recommend": true
}
```

**Coin Breakdown**:
- Base: 2 coins
- Port context (4/4 fields): +1 coin
- Operational details (2/2 fields): +1 coin
- Quality ratings (4/4 fields): +3 coins
- Wait time included: (already counted in port context)
- Photo: 0 (not a not_working report)

**Total**: 7 coins

---

### Maximum Coin Example

**Scenario**: Detailed not_working report with photo
```json
{
  "action": "not_working",
  "photo": "base64_image",
  "notes": "Out of order",

  "wait_time": 0,
  "port_type_used": "ccs2",
  "ports_available": 0,
  "charging_success": false,

  "payment_method": "app",
  "station_lighting": "poor",

  "cleanliness_rating": 2,
  "charging_speed_rating": 1,
  "amenities_rating": 2,
  "would_recommend": false
}
```

**Coin Breakdown**:
- Base: 2
- Port context: +1
- Operational: +1
- Quality: +3
- Photo (not_working): +2

**Total**: 9 coins (maximum possible)

---

## API Reference

### POST `/api/chargers/{charger_id}/verify`

**Request Body**:
```json
{
  "action": "active" | "partial" | "not_working",
  "notes": "string (optional)",

  // Optional: Port context
  "wait_time": 5,
  "port_type_used": "ccs2",
  "ports_available": 2,
  "charging_success": true,

  // Optional: Operational details
  "payment_method": "app" | "card" | "cash" | "free",
  "station_lighting": "excellent" | "good" | "poor" | "none",

  // Optional: Quality ratings
  "cleanliness_rating": 1-5,
  "charging_speed_rating": 1-5,
  "amenities_rating": 1-5,
  "would_recommend": true | false,

  // Optional: Photo
  "photo": "base64_encoded_image_data"
}
```

**Response**:
```json
{
  "message": "Verification submitted! You earned 7 Shara Coins!",
  "coins_earned": 7,
  "new_verification_level": 4,
  "weighted_positive": 12.5,
  "weighted_negative": 1.2
}
```

**Error Responses**:

Rate limited (429):
```json
{
  "detail": "You can only verify this charger once every 5 minutes"
}
```

Spam detected (429):
```json
{
  "detail": "Too many verifications in the last hour. Please try again later."
}
```

---

## Frontend Implementation

### Verification Form

**Component**: `/app/verify-station.tsx`

**State**:
```typescript
const [action, setAction] = useState<'active' | 'partial' | 'not_working'>('active');
const [notes, setNotes] = useState('');

// Port context
const [waitTime, setWaitTime] = useState<number>();
const [portTypeUsed, setPortTypeUsed] = useState<string>();
const [portsAvailable, setPortsAvailable] = useState<number>();
const [chargingSuccess, setChargingSuccess] = useState<boolean>();

// Operational
const [paymentMethod, setPaymentMethod] = useState<string>();
const [stationLighting, setStationLighting] = useState<string>();

// Quality
const [cleanlinessRating, setCleanlinessRating] = useState<number>();
const [chargingSpeedRating, setChargingSpeedRating] = useState<number>();
const [amenitiesRating, setAmenitiesRating] = useState<number>();
const [wouldRecommend, setWouldRecommend] = useState<boolean>();

// Photo
const [photo, setPhoto] = useState<string>();
```

---

### Real-Time Coin Preview

```typescript
const calculatePotentialCoins = () => {
  let coins = 2; // base

  // Port context (2/3 fields required)
  const portContextFields = [waitTime, portTypeUsed, portsAvailable, chargingSuccess].filter(Boolean);
  if (portContextFields.length >= 2) {
    coins += 1;
  }

  // Operational details (both required)
  if (paymentMethod && stationLighting) {
    coins += 1;
  }

  // Quality ratings (all 4 required)
  if (cleanlinessRating && chargingSpeedRating && amenitiesRating && wouldRecommend !== undefined) {
    coins += 3;
  }

  // Wait time (if provided)
  if (waitTime !== undefined) {
    coins += 1;
  }

  // Photo (only for not_working)
  if (photo && action === 'not_working') {
    coins += 2;
  }

  return coins;
};

// Display in UI
<View style={styles.coinPreview}>
  <Text style={styles.coinText}>
    Potential Earnings: {calculatePotentialCoins()} 💰
  </Text>
</View>
```

---

### Submit Verification

```typescript
const handleSubmit = async () => {
  try {
    setLoading(true);

    const verificationData = {
      action,
      notes,
      wait_time: waitTime,
      port_type_used: portTypeUsed,
      ports_available: portsAvailable,
      charging_success: chargingSuccess,
      payment_method: paymentMethod,
      station_lighting: stationLighting,
      cleanliness_rating: cleanlinessRating,
      charging_speed_rating: chargingSpeedRating,
      amenities_rating: amenitiesRating,
      would_recommend: wouldRecommend,
      photo: photo,
    };

    const response = await axios.post(
      `/api/chargers/${chargerId}/verify`,
      verificationData
    );

    // Success feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Alert.alert(
      'Success!',
      `Verification submitted! You earned ${response.data.coins_earned} Shara Coins!`,
      [{ text: 'OK', onPress: () => router.back() }]
    );

    // Refresh user data
    await refreshUser();

  } catch (error) {
    if (error.response?.status === 429) {
      Alert.alert('Rate Limit', error.response.data.detail);
    } else {
      Alert.alert('Error', 'Failed to submit verification');
    }
  } finally {
    setLoading(false);
  }
};
```

---

### Verification Badge Component

```typescript
interface VerificationBadgeProps {
  level: number;
  verifiedCount?: number;
  lastVerified?: string;
  size?: 'small' | 'medium' | 'large';
}

export function VerificationBadge({
  level,
  verifiedCount,
  lastVerified,
  size = 'medium'
}: VerificationBadgeProps) {
  const colors = {
    5: '#00C853',
    4: '#64DD17',
    3: '#FFD600',
    2: '#FF6D00',
    1: '#DD2C00',
  };

  const labels = {
    5: 'Excellent',
    4: 'Good',
    3: 'Moderate',
    2: 'Low',
    1: 'Poor',
  };

  return (
    <View style={styles.badge}>
      <View style={[styles.circle, { backgroundColor: colors[level] }]}>
        <Text style={styles.levelText}>{level}</Text>
      </View>
      <View>
        <Text style={styles.label}>{labels[level]}</Text>
        {verifiedCount && (
          <Text style={styles.count}>{verifiedCount} verifications</Text>
        )}
        {lastVerified && (
          <Text style={styles.time}>Last verified {formatRelativeTime(lastVerified)}</Text>
        )}
      </View>
    </View>
  );
}
```

---

## Best Practices

### For Users

1. **Be Honest**: Accurate reports help the community
2. **Provide Details**: More details = more coins + better data
3. **Add Photos**: Especially for not_working reports
4. **Recent Experience**: Verify based on your latest visit
5. **Build Trust**: Consistent contributions increase your impact

### For Developers

1. **Monitor Spam**: Watch for coordinated attacks
2. **Adjust Weights**: Tune time-decay and trust multipliers as needed
3. **Review Levels**: Ensure verification levels reflect reality
4. **User Education**: Explain how the system works
5. **Transparency**: Show weighted scores in admin dashboard

---

## Future Enhancements

1. **Machine Learning**: Detect anomalous verification patterns
2. **Photo Analysis**: Use computer vision to validate evidence
3. **Location Verification**: Require geolocation for verifications
4. **Dispute System**: Allow charger owners to contest reports
5. **Verification History**: Show user's verification accuracy over time
6. **Seasonal Adjustments**: Account for seasonal variations (weather impact)

---

This comprehensive documentation covers the entire Report Verification System. For API integration, see [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md).
