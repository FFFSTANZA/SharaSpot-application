"""Gamification and coin system service"""
from ..models.coin import CoinTransaction
from ..core import get_database


async def log_coin_transaction(user_id: str, action: str, amount: int, description: str) -> CoinTransaction:
    """Log a coin transaction"""
    db = get_database()

    transaction = CoinTransaction(
        user_id=user_id,
        action=action,
        amount=amount,
        description=description
    )
    await db.coin_transactions.insert_one(transaction.dict())
    return transaction


async def calculate_trust_score(user_id: str) -> float:
    """Calculate user's trust score based on contributions"""
    db = get_database()

    user_doc = await db.users.find_one({"id": user_id})
    if not user_doc:
        return 0.0

    chargers_added = user_doc.get('chargers_added', 0)
    verifications_count = user_doc.get('verifications_count', 0)
    photos_uploaded = user_doc.get('photos_uploaded', 0)

    # Simple trust score formula (max 100)
    score = min(100, (chargers_added * 10) + (verifications_count * 2) + (photos_uploaded * 3))
    return round(score, 1)


async def award_charger_coins(user_id: str, charger_name: str, photos_count: int = 0) -> int:
    """Award coins for adding a charger"""
    db = get_database()

    # Base reward for adding charger
    coins_earned = 5
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"shara_coins": coins_earned, "chargers_added": 1}}
    )

    await log_coin_transaction(
        user_id,
        "add_charger",
        coins_earned,
        f"Added charger: {charger_name}"
    )

    # Award additional coins for photos
    if photos_count > 0:
        photo_coins = photos_count * 3
        await db.users.update_one(
            {"id": user_id},
            {"$inc": {"shara_coins": photo_coins, "photos_uploaded": photos_count}}
        )
        await log_coin_transaction(
            user_id,
            "upload_photo",
            photo_coins,
            f"Uploaded {photos_count} photo(s) for {charger_name}"
        )
        coins_earned += photo_coins

    return coins_earned


async def award_verification_coins(
    user_id: str,
    charger_name: str,
    action: str,
    request_data: dict
) -> dict:
    """Award coins for verifying a charger (Gold Tier System - up to 9 coins)"""
    db = get_database()

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

    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"shara_coins": total_coins, "verifications_count": 1}}
    )

    # Log coin transaction
    description = f"Verified charger as {action}: {charger_name}"
    if bonus_reasons:
        description += f" ({', '.join(bonus_reasons)})"

    await log_coin_transaction(
        user_id,
        "verify_charger",
        total_coins,
        description
    )

    return {
        "total_coins": total_coins,
        "base_coins": coins_reward,
        "bonus_coins": bonus_coins,
        "bonus_reasons": bonus_reasons
    }


async def get_coin_transactions(user_id: str):
    """Get user's coin transaction history"""
    db = get_database()

    transactions = await db.coin_transactions.find(
        {"user_id": user_id}
    ).sort("timestamp", -1).to_list(100)

    user = await db.users.find_one({"id": user_id})

    return {
        "total_coins": user.get('shara_coins', 0),
        "coins_earned": user.get('shara_coins', 0) + user.get('coins_redeemed', 0),
        "coins_redeemed": user.get('coins_redeemed', 0),
        "transactions": transactions
    }
