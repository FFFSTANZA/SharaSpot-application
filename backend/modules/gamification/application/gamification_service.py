"""Gamification and coin system service"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.coin.domain.coin import CoinTransaction as CoinModel
from app.core.db_models import User, CoinTransaction


async def log_coin_transaction(user_id: str, action: str, amount: int, description: str, db: AsyncSession) -> CoinModel:
    """Log a coin transaction"""
    transaction = CoinTransaction(
        user_id=user_id,
        action=action,
        amount=amount,
        description=description
    )
    db.add(transaction)
    await db.flush()

    # Convert to Pydantic model
    return CoinModel(
        id=transaction.id,
        user_id=transaction.user_id,
        action=transaction.action,
        amount=transaction.amount,
        description=transaction.description,
        timestamp=transaction.timestamp
    )


async def calculate_trust_score(user_id: str, db: AsyncSession) -> float:
    """Calculate user's trust score based on contributions"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return 0.0

    chargers_added = user.chargers_added
    verifications_count = user.verifications_count
    photos_uploaded = user.photos_uploaded

    # Simple trust score formula (max 100)
    score = min(100, (chargers_added * 10) + (verifications_count * 2) + (photos_uploaded * 3))
    return round(score, 1)


async def update_user_trust_score(user_id: str, db: AsyncSession) -> float:
    """Calculate and update user's trust score in database"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return 0.0

    # Calculate new trust score
    new_score = await calculate_trust_score(user_id, db)

    # Update in database
    user.trust_score = new_score
    await db.flush()

    return new_score


async def award_charger_coins(user_id: str, charger_name: str, photos_count: int, db: AsyncSession) -> int:
    """Award coins for adding a charger"""
    # Base reward for adding charger
    coins_earned = 5

    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return 0

    # Update user coins and stats
    user.shara_coins += coins_earned
    user.chargers_added += 1
    await db.flush()

    await log_coin_transaction(
        user_id,
        "add_charger",
        coins_earned,
        f"Added charger: {charger_name}",
        db
    )

    # Award additional coins for photos
    if photos_count > 0:
        photo_coins = photos_count * 3
        user.shara_coins += photo_coins
        user.photos_uploaded += photos_count
        await db.flush()

        await log_coin_transaction(
            user_id,
            "upload_photo",
            photo_coins,
            f"Uploaded {photos_count} photo(s) for {charger_name}",
            db
        )
        coins_earned += photo_coins

    # Update trust score after contribution
    await update_user_trust_score(user_id, db)

    return coins_earned


async def award_verification_coins(
    user_id: str,
    charger_name: str,
    action: str,
    request_data: dict,
    db: AsyncSession
) -> dict:
    """Award coins for verifying a charger (Gold Tier System - up to 9 coins)"""
    coins_reward = 2  # Base reward
    bonus_coins = 0
    bonus_reasons = []

    # Port context bonus (+1 if provided 2+ of 3 fields)
    port_context_fields = [
        request_data.get('port_type_used'),
        request_data.get('ports_available'),
        request_data.get('charging_success')
    ]
    port_context_count = sum(1 for field in port_context_fields if field is not None)
    if port_context_count >= 2:
        bonus_coins += 1
        bonus_reasons.append("Port context")

    # Operational details bonus (+1 if provided both fields)
    if request_data.get('payment_method') and request_data.get('station_lighting'):
        bonus_coins += 1
        bonus_reasons.append("Operational details")

    # Quality ratings bonus (+1-3 based on completeness)
    quality_fields = [
        request_data.get('cleanliness_rating'),
        request_data.get('charging_speed_rating'),
        request_data.get('amenities_rating'),
        request_data.get('would_recommend')
    ]
    quality_count = sum(1 for field in quality_fields if field is not None)
    if quality_count >= 3:
        bonus_coins += 3
        bonus_reasons.append("Complete feedback")
    elif quality_count >= 2:
        bonus_coins += 2
        bonus_reasons.append("Detailed feedback")
    elif quality_count >= 1:
        bonus_coins += 1
        bonus_reasons.append("Extra feedback")

    # Wait time bonus (+1)
    if request_data.get('wait_time') is not None:
        bonus_coins += 1
        bonus_reasons.append("Wait time info")

    # Photo evidence bonus (+2, only for not_working reports)
    if request_data.get('photo_url') and action == "not_working":
        bonus_coins += 2
        bonus_reasons.append("Photo evidence")

    # Calculate total with cap at 9 coins
    total_coins = min(coins_reward + bonus_coins, 9)

    # Get user and update
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user:
        user.shara_coins += total_coins
        user.verifications_count += 1
        await db.flush()

    # Log coin transaction
    description = f"Verified charger as {action}: {charger_name}"
    if bonus_reasons:
        description += f" ({', '.join(bonus_reasons)})"

    await log_coin_transaction(
        user_id,
        "verify_charger",
        total_coins,
        description,
        db
    )

    # Update trust score after contribution
    await update_user_trust_score(user_id, db)

    return {
        "total_coins": total_coins,
        "base_coins": coins_reward,
        "bonus_coins": bonus_coins,
        "bonus_reasons": bonus_reasons
    }


async def get_coin_transactions(user_id: str, db: AsyncSession):
    """Get user's coin transaction history"""
    # Get transactions
    result = await db.execute(
        select(CoinTransaction)
        .where(CoinTransaction.user_id == user_id)
        .order_by(CoinTransaction.timestamp.desc())
        .limit(100)
    )
    transactions = result.scalars().all()

    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    return {
        "total_coins": user.shara_coins if user else 0,
        "coins_earned": (user.shara_coins + user.coins_redeemed) if user else 0,
        "coins_redeemed": user.coins_redeemed if user else 0,
        "transactions": [
            {
                "id": t.id,
                "user_id": t.user_id,
                "action": t.action,
                "amount": t.amount,
                "description": t.description,
                "timestamp": t.timestamp
            }
            for t in transactions
        ]
    }
