import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSettings } from "@/lib/settings";

// Helper function to create Stripe client with specific API key
function createStripeClient(apiKey: string): Stripe {
  return new Stripe(apiKey, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
  });
}

// POST - Create Stripe Checkout Session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, priceId, slug } = body;

    if (!email || !priceId) {
      return NextResponse.json(
        { error: "Email and priceId are required" },
        { status: 400 }
      );
    }

    const settings = await getSettings();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Determine which API key to use (prefer live, fallback to test)
    const liveApiKey = settings.stripeSecretKeyLive || process.env.STRIPE_SECRET_KEY_LIVE;
    const testApiKey = settings.stripeSecretKeyTest || process.env.STRIPE_SECRET_KEY_TEST;
    const apiKey = liveApiKey || testApiKey;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Stripe API key is not configured" },
        { status: 500 }
      );
    }

    const stripe = createStripeClient(apiKey);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: email,
      allow_promotion_codes: true,
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/register?email=${encodeURIComponent(email)}${slug ? `&slug=${encodeURIComponent(slug)}` : ''}`,
      metadata: {
        email,
        slug: slug || '',
      },
      subscription_data: {
        metadata: {
          email,
          slug: slug || '',
        },
      },
    });

    return NextResponse.json({ 
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error);
    return NextResponse.json(
      { error: "An error occurred while creating checkout session", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
