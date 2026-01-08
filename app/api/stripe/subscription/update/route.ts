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

// POST - Update Stripe subscription (upgrade/downgrade)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, newPriceId, pageId } = body;

    if (!subscriptionId || !newPriceId) {
      return NextResponse.json(
        { error: "Subscription ID and new price ID are required" },
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

    // Retrieve current subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Get the current subscription item
    const currentItem = subscription.items.data[0];

    // Update subscription with new price
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: currentItem.id,
        price: newPriceId,
      }],
      proration_behavior: 'always_invoice', // Prorate the change
    });

    // Update page in database if pageId is provided
    if (pageId) {
      try {
        // Determine plan from price
        const price = await stripe.prices.retrieve(newPriceId);
        const product = typeof price.product === 'string' 
          ? await stripe.products.retrieve(price.product)
          : price.product;
        
        const plan = product.metadata?.plan as "free" | "start" | "pro" || "start";
        
        await updatePage(pageId, {
          subscriptionPlan: plan,
          subscriptionStatus: updatedSubscription.status === 'active' ? 'active' : 'cancelled',
          stripeSubscriptionId: updatedSubscription.id,
          subscriptionStartDate: new Date(updatedSubscription.created * 1000).toISOString(),
          subscriptionEndDate: updatedSubscription.current_period_end 
            ? new Date(updatedSubscription.current_period_end * 1000).toISOString()
            : undefined,
        });
      } catch (pageError) {
        console.error("Error updating page:", pageError);
        // Continue even if page update fails
      }
    }

    return NextResponse.json({ 
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
      }
    });
  } catch (error) {
    console.error("Error updating Stripe subscription:", error);
    return NextResponse.json(
      { error: "An error occurred while updating subscription", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
