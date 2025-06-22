import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export interface CheckoutSessionResponse {
  sessionId: string;
}

export const handleSubscribe = async (currentUser: { id: string; email: string }): Promise<void> => {
  try {
    const stripe = await stripePromise;
    if (!stripe) {
      console.error('Failed to load Stripe');
      return;
    }

    // Call backend to create a Checkout Session
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payments/create-checkout-session`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        priceId: import.meta.env.VITE_STRIPE_PRICE_ID,
        successUrl: `${window.location.origin}/success`,
        cancelUrl: `${window.location.origin}/cancel`,
        user_id: currentUser?.id,
        user_email: currentUser?.email,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to create checkout session: ${res.status} ${res.statusText}`);
    }

    const data: CheckoutSessionResponse = await res.json();
    
    if (data.sessionId) {
      const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
      if (result.error) {
        console.error('Stripe checkout error:', result.error.message);
      }
    } else {
      console.error("Failed to create Stripe Checkout session");
    }
  } catch (error) {
    console.error('Error during subscription:', error);
  }
};