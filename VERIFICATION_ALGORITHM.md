# Advanced Verification Algorithm

## Overview

The SharaSpot verification system has been enhanced with an advanced algorithm that prevents exploitation and provides more accurate charger reliability assessments.

## Key Improvements

### 1. Time-Decay Weighting

**Problem Solved**: Old verifications were counting equally with recent ones, making the system slow to respond to changes.

**Solution**: Exponential time-decay weighting where recent verifications matter significantly more than old ones.

**Implementation**:
- Uses exponential decay formula: `weight = 0.5^(age_days / half_life_days)`
- Half-life set to 30 days (verifications from 30 days ago have 50% weight)
- Verifications older than 90 days are filtered out completely
- Recent verifications (< 1 week) maintain near 100% weight

**Example**:
- Verification today: 100% weight (1.0)
- Verification 30 days ago: 50% weight (0.5)
- Verification 60 days ago: 25% weight (0.25)
- Verification 90+ days ago: Not considered (0.0)

### 2. User Trust Score Influence

**Problem Solved**: All users' verifications counted equally, allowing new or low-contribution users to have the same impact as established, trusted users.

**Solution**: Weight verifications by user trust score, calculated from their contribution history.

**Trust Score Formula** (0-100 scale):
```
trust_score = min(100,
    (chargers_added × 10) +
    (verifications_count × 2) +
    (photos_uploaded × 3)
)
```

**Trust Score to Weight Multiplier** (0.5-2.0 range):
```
multiplier = 0.5 + (trust_score / 100) × 1.5
```

**Examples**:
- Trust score 0 (new user): 0.5× multiplier
- Trust score 50 (average user): 1.0× multiplier
- Trust score 100 (high-trust user): 2.0× multiplier

**Impact**: A high-trust user's verification can count as much as 4× a new user's verification (2.0× vs 0.5×).

### 3. Velocity-Based Spam Detection

**Problem Solved**: Users could spam verifications to manipulate charger status.

**Solution**: Two-layer rate limiting system.

**Rate Limits**:
1. **Per-Charger Limit**: One verification per charger every 5 minutes
2. **Global Velocity Limit**: Maximum 12 verifications per hour across all chargers

**Error Messages**:
- Rate limit hit: `"You can only verify this charger once every 5 minutes. Please wait before verifying again."`
- Spam detected: `"Too many verifications in a short time. Please slow down to prevent spam."`

**Configuration** (adjustable in code):
```python
rate_limit_minutes = 5           # Per-charger cooldown
time_window_minutes = 60         # Velocity check window
max_verifications = 12           # Max verifications in window
```

### 4. Temporal Expiration

**Problem Solved**: Very old verifications should not affect current charger status.

**Solution**: Only verifications from the last 3 months are considered in calculations.

**Benefits**:
- Charger status reflects current reality
- Seasonal or temporarily broken chargers can recover
- Database queries are more efficient

## Weighted Score Calculation

### Formula

For each verification:
```
weighted_score = action_value × time_weight × trust_multiplier

where:
- action_value = { active: 1.0, partial: 0.5, not_working: -1.0 }
- time_weight = 0.5^(age_days / 30)
- trust_multiplier = 0.5 + (user_trust_score / 100) × 1.5
```

### Example Scenarios

**Scenario 1: New user reports "active" today**
- action_value = 1.0
- time_weight = 1.0 (today)
- trust_multiplier = 0.5 (trust_score = 0)
- **weighted_score = 0.5**

**Scenario 2: High-trust user reports "active" today**
- action_value = 1.0
- time_weight = 1.0 (today)
- trust_multiplier = 2.0 (trust_score = 100)
- **weighted_score = 2.0**

**Scenario 3: Average user reports "not_working" 30 days ago**
- action_value = -1.0
- time_weight = 0.5 (30 days ago)
- trust_multiplier = 1.0 (trust_score = 50)
- **weighted_score = -0.5**

**Scenario 4: High-trust user reports "active" 60 days ago**
- action_value = 1.0
- time_weight = 0.25 (60 days ago)
- trust_multiplier = 2.0 (trust_score = 100)
- **weighted_score = 0.5**

## Verification Level Calculation

Verification levels are determined by aggregate weighted scores:

| Level | Criteria | Description |
|-------|----------|-------------|
| **5** | active_weighted_score ≥ 6.0 | Highly reliable, recently verified by trusted users |
| **4** | active_weighted_score ≥ 4.0 | Reliable, good verification history |
| **3** | active_weighted_score ≥ 2.0 | Moderately reliable |
| **2** | active_weighted_score ≥ 0.0 | Low reliability or limited data |
| **1** | not_working_weighted ≥ 2.0 OR total < 0 | Not working or mostly negative reports |

### Level Thresholds Explained

**To reach Level 5** (≥ 6.0 points), you could have:
- 3 recent verifications from high-trust users (3 × 2.0 = 6.0)
- 6 recent verifications from average users (6 × 1.0 = 6.0)
- 12 recent verifications from new users (12 × 0.5 = 6.0)

**Level 1 triggers** when:
- Not-working weighted score ≥ 2.0 (e.g., 1 recent high-trust "not_working" report)
- Total weighted score is negative (more not_working than active)

## Uptime Percentage Calculation

Based on weighted scores rather than simple counts:

```
uptime = (active_weighted_score / total_absolute_score) × 100

where:
- active_weighted_score = sum of all positive weighted scores
- not_working_weighted_score = abs(sum of all negative weighted scores)
- total_absolute_score = active_weighted_score + not_working_weighted_score
```

**Benefits**:
- Recent reports have more impact on uptime
- High-trust users' reports are more influential
- More accurate representation of current charger status

## Implementation Details

### Files Modified

1. **`backend/app/services/charger_service.py`**
   - Added helper functions:
     - `calculate_time_decay_weight()` - Exponential decay calculation
     - `normalize_trust_score()` - Convert trust score to multiplier
     - `calculate_weighted_verification_score()` - Combined scoring
     - `check_rate_limit()` - Per-charger rate limiting
     - `detect_spam_velocity()` - Global velocity checking
   - Enhanced `verify_charger()` - Implements full advanced algorithm

2. **`backend/app/services/gamification_service.py`**
   - Added `update_user_trust_score()` - Auto-update trust scores
   - Modified `award_charger_coins()` - Updates trust score after contribution
   - Modified `award_verification_coins()` - Updates trust score after verification

### Database Queries Optimized

- Batch user query to get trust scores (single query instead of N queries)
- Time-based filtering at database level (last 90 days only)
- Efficient rate limit checks with indexed timestamp queries

## Security & Anti-Abuse Features

### Rate Limiting
- **Per-charger**: 5-minute cooldown prevents rapid status flipping
- **Global**: 12 verifications/hour prevents mass manipulation

### Trust Score System
- New accounts have limited influence (0.5× weight)
- Trust grows with genuine contributions
- Difficult to manipulate (requires sustained contributions)

### Time Decay
- Prevents old verification farming from having lasting impact
- Makes manipulation expensive (requires ongoing effort)

### Temporal Expiration
- 90-day cutoff prevents ancient verifications from mattering
- Attackers can't benefit from old verification history

## Migration from Old Algorithm

### Backward Compatibility
- All existing verifications are preserved
- Old verifications automatically get time-decay weights
- Users with 0 trust score are assigned one on-the-fly
- No database migrations required

### Gradual Transition
- First verification by any user triggers trust score calculation
- System becomes more accurate as trust scores are established
- Old chargers with only old verifications will show lower levels (accurate!)

## Configuration & Tuning

### Adjustable Parameters

Located in `charger_service.py`:

```python
# Time decay
half_life_days = 30.0                # Days for weight to halve
verification_age_cutoff_days = 90    # Maximum age to consider

# Rate limiting
rate_limit_minutes = 5               # Per-charger cooldown
time_window_minutes = 60             # Velocity check window
max_verifications = 12               # Max in velocity window

# Verification levels (weighted score thresholds)
LEVEL_5_THRESHOLD = 6.0
LEVEL_4_THRESHOLD = 4.0
LEVEL_3_THRESHOLD = 2.0
LEVEL_1_THRESHOLD = 2.0              # Not-working weighted score
```

### Recommended Tuning

For **stricter** verification (slower level increases):
- Increase thresholds: `LEVEL_5_THRESHOLD = 8.0`
- Faster decay: `half_life_days = 20.0`
- Shorter memory: `verification_age_cutoff_days = 60`

For **more lenient** verification (faster response to changes):
- Decrease thresholds: `LEVEL_5_THRESHOLD = 4.0`
- Slower decay: `half_life_days = 45.0`
- Longer memory: `verification_age_cutoff_days = 120`

## Testing Recommendations

### Unit Tests
- Test time-decay calculation at various ages
- Test trust score normalization edge cases
- Test weighted score calculation with different combinations
- Test rate limiting and spam detection

### Integration Tests
- Test charger level changes with mixed trust users
- Test uptime calculation accuracy
- Test rate limit enforcement
- Test spam velocity detection

### Load Tests
- Verify database query performance with batch user lookups
- Test concurrent verification handling
- Test rate limit behavior under high load

## Monitoring & Analytics

### Metrics to Track
- Average verification level changes per charger
- Trust score distribution across user base
- Rate limit hit rate (should be < 1% for legitimate users)
- Spam detection trigger rate
- Average weighted score per verification level

### Red Flags
- High rate limit hit rate (> 5%) - may need adjustment
- Spam detection triggering often - potential attack
- Trust scores not growing - users not contributing
- Verification levels not changing - algorithm too conservative

## Future Enhancements

### Potential Improvements
1. **Machine Learning**: Predict charger reliability from patterns
2. **Geo-fencing**: Weight verifications by proximity to charger
3. **Device Verification**: Bonus trust for actual charging session data
4. **Reputation Decay**: Gradually decrease trust for inactive users
5. **Anomaly Detection**: Flag unusual verification patterns
6. **Cross-charger Analysis**: Detect users who only report specific stations

### Scalability Considerations
- Consider caching user trust scores for high-traffic scenarios
- Implement background jobs for trust score recalculation
- Add database indices on timestamp columns for faster queries
- Consider materialized views for aggregate weighted scores

## Conclusion

The advanced verification algorithm provides:
- ✅ **Accuracy**: Recent, trusted verifications matter most
- ✅ **Security**: Rate limiting and spam detection prevent abuse
- ✅ **Fairness**: All users can build trust through contributions
- ✅ **Responsiveness**: Time decay ensures current status is reflected
- ✅ **Scalability**: Efficient queries and batch operations
- ✅ **Flexibility**: Tunable parameters for different use cases

This creates a robust, tamper-resistant verification system that accurately reflects real-world charger reliability.
