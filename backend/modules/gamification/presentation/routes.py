"""
Gamification API routes.

This is the presentation layer that exposes gamification functionality via REST API.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from decimal import Decimal
from uuid import UUID

from app.core.security import get_current_user
from ..application.commands import (
    AwardCoinsCommand,
    AwardCoinsHandler,
    SpendCoinsCommand,
    SpendCoinsHandler,
)
from ..application.queries import (
    GetCoinBalanceQuery,
    GetCoinBalanceHandler,
    GetTransactionsQuery,
    GetTransactionsHandler,
)

router = APIRouter(prefix="/api/gamification", tags=["Gamification"])


# Request/Response Schemas
class AwardCoinsRequest(BaseModel):
    """Request to award coins."""

    user_id: UUID
    amount: Decimal
    reason: str
    metadata: dict | None = None


class SpendCoinsRequest(BaseModel):
    """Request to spend coins."""

    amount: Decimal
    reason: str
    metadata: dict | None = None


class CoinBalanceResponse(BaseModel):
    """Response with coin balance."""

    user_id: UUID
    balance: Decimal


class TransactionResponse(BaseModel):
    """Response with transaction details."""

    id: UUID
    user_id: UUID
    amount: Decimal
    transaction_type: str
    reason: str
    metadata: dict
    created_at: str


class TransactionsListResponse(BaseModel):
    """Response with list of transactions."""

    transactions: list[TransactionResponse]
    total: int


# Routes
@router.get("/balance", response_model=CoinBalanceResponse)
async def get_coin_balance(current_user: dict = Depends(get_current_user)):
    """Get current user's coin balance."""
    # TODO: Inject handler via dependency injection
    # For now, this is a placeholder showing the API structure
    query = GetCoinBalanceQuery(user_id=UUID(current_user["user_id"]))
    # result = await handler.handle(query)
    # return CoinBalanceResponse(**result.to_dict())
    return {"user_id": current_user["user_id"], "balance": 0}


@router.get("/transactions", response_model=TransactionsListResponse)
async def get_transactions(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
):
    """Get current user's transaction history."""
    query = GetTransactionsQuery(
        user_id=UUID(current_user["user_id"]), skip=skip, limit=limit
    )
    # result = await handler.handle(query)
    return {"transactions": [], "total": 0}


@router.post("/award", response_model=TransactionResponse)
async def award_coins(
    request: AwardCoinsRequest, current_user: dict = Depends(get_current_user)
):
    """Award coins to a user (admin only)."""
    # TODO: Add admin check
    command = AwardCoinsCommand(
        user_id=request.user_id,
        amount=request.amount,
        reason=request.reason,
        metadata=request.metadata,
    )
    # result = await handler.handle(command)
    raise HTTPException(501, "Not implemented")


@router.post("/spend", response_model=TransactionResponse)
async def spend_coins(
    request: SpendCoinsRequest, current_user: dict = Depends(get_current_user)
):
    """Spend coins."""
    command = SpendCoinsCommand(
        user_id=UUID(current_user["user_id"]),
        amount=request.amount,
        reason=request.reason,
        metadata=request.metadata,
    )
    # result = await handler.handle(command)
    raise HTTPException(501, "Not implemented")
