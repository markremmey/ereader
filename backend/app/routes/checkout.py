import os
import stripe

from fastapi import APIRouter, Depends, HTTPException
from ..users import current_active_user
from ..models import User  # Your ORM user model
from sqlalchemy.ext.asyncio import AsyncSession
from .. import database, models

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
router = APIRouter(prefix="/payments", tags=["payments"])

@router.post("/create-checkout-session")
async def create_checkout_session(
    db: AsyncSession = Depends(database.get_db),
    current_user: models.User = Depends(current_active_user),
):
    if not current_user.stripe_customer_id:
        # Create or retrieve a Stripe Customer
        customer = stripe.Customer.create(email=current_user.email)
        current_user = await db.merge(current_user)
        current_user.stripe_customer_id = customer.id
        await db.commit()
        await db.refresh(current_user)

    try:
        session = stripe.checkout.Session.create(
            customer=current_user.stripe_customer_id,
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{"price": os.getenv("STRIPE_PRICE_ID"), "quantity": 1}],
            success_url=f"{os.getenv('FRONTEND_URL')}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{os.getenv('FRONTEND_URL')}/billing/cancel",
            metadata={"user_id": str(current_user.id)},
        )
        return {"sessionId": session.id}
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
