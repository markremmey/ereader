from fastapi import Request, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db  # your DB session dependency
from app.models import User
import stripe
import os
from fastapi import APIRouter
from sqlalchemy import select

router = APIRouter(tags=["webhook"])

WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, WEBHOOK_SECRET)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")  # Reject invalid
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {e}")


    # Handle the event types we care about
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']    # Stripe Checkout Session object
        customer_id = session.get('customer')
        subscription_id = session.get('subscription')
        # Mark user as subscribed in our DB:
        user_id = session['metadata'].get('user_id')
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user:
            user.is_subscribed = True
            user.stripe_customer_id = customer_id
            user.stripe_subscription_id = subscription_id
            await db.commit()
    elif event['type'] == 'invoice.payment_failed':
        # Subscription payment failed – mark user as not subscribed (or grace period handling)
        invoice = event['data']['object']
        customer_id = invoice.get('customer')
        result = await db.execute(select(User).where(User.stripe_customer_id == customer_id))
        user = result.scalar_one_or_none()
        if user:
            user.is_subscribed = False
            await db.commit()
    elif event['type'] == 'customer.subscription.deleted':
        # Subscription canceled – mark user as unsubscribed
        sub = event['data']['object']
        customer_id = sub.get('customer')
        result = await db.execute(select(User).where(User.stripe_customer_id == customer_id))
        user = result.scalar_one_or_none()
        if user:
            user.is_subscribed = False
            await db.commit()
    # ... (handle other event types like invoice.paid if needed)

    return {"status": "success"}  # Respond 200 OK
