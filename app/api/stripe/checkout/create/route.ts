import { NextRequest, NextResponse } from "next/server";
import { getStripeClient, getStripePublishableKey } from "@/lib/stripe";
import { getUserByEmail, updateUser } from "@/lib/users";
import { createPage } from "@/lib/lynqit-pages";

/**
 * Create Stripe Checkout Session for subscription
 * Simple, clean implementation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, priceId, slug, password } = body;

    // Validate required fields
    if (!email || !priceId || !slug || !password) {
      return NextResponse.json(
        { error: "Email, priceId, slug en password zijn verplicht" },
        { status: 400 }
      );
    }

    const stripe = await getStripeClient();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Create or get Stripe customer
    let customerId: string;
    const user = await getUserByEmail(email);
    
    if (user?.stripeCustomerId) {
      customerId = user.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: email.toLowerCase(),
        metadata: {
          email: email,
          slug: slug,
        },
      });
      customerId = customer.id;
      
      // Save customer ID if user exists
      if (user) {
        await updateUser(email, { stripeCustomerId: customerId });
      }
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/register?email=${encodeURIComponent(email)}`,
      metadata: {
        email: email,
        slug: slug,
        password: password, // Will be used in webhook to create account
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Fout bij aanmaken van checkout session" },
      { status: 500 }
    );
  }
}

