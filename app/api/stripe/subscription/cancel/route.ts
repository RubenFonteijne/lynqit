import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSettings } from "@/lib/settings";
import { updatePage } from "@/lib/lynqit-pages";

// Helper function to create Stripe client with specific API key
function createStripeClient(apiKey: string): Stripe {
  return new Stripe(apiKey, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
  });
}

// POST - Cancel Stripe subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, pageId, cancelImmediately = false } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    const settings = await getSettings();
    
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

    // Cancel subscription
    const canceledSubscription = cancelImmediately
      ? await stripe.subscriptions.cancel(subscriptionId)
      : await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });

    // Update page in database if pageId is provided
    if (pageId) {
      try {
        await updatePage(pageId, {
          subscriptionStatus: canceledSubscription.status === 'canceled' ? 'cancelled' : 'active',
          stripeSubscriptionId: canceledSubscription.id,
        });
      } catch (pageError) {
        console.error("Error updating page:", pageError);
        // Continue even if page update fails
      }
    }

    return NextResponse.json({ 
      success: true,
      subscription: {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
        cancel_at_period_end: (canceledSubscription as any).cancel_at_period_end,
      }
    });
  } catch (error) {
    console.error("Error canceling Stripe subscription:", error);
    return NextResponse.json(
      { error: "An error occurred while canceling subscription", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
