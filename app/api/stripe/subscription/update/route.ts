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

async function getStripeClientAndSubscription(
  subscriptionId: string,
  liveApiKey?: string | null,
  testApiKey?: string | null
): Promise<{ stripe: Stripe; subscription: Stripe.Subscription; mode: "live" | "test" }> {
  let lastError: unknown = null;

  if (liveApiKey) {
    try {
      const stripe = createStripeClient(liveApiKey);
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return { stripe, subscription, mode: "live" };
    } catch (e: any) {
      lastError = e;
      if (e?.code !== "resource_missing") {
        throw e;
      }
    }
  }

  if (testApiKey) {
    try {
      const stripe = createStripeClient(testApiKey);
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return { stripe, subscription, mode: "test" };
    } catch (e: any) {
      lastError = e;
      throw e;
    }
  }

  throw lastError || new Error("Stripe API key is not configured");
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
    
    // Determine which API keys are available
    const liveApiKey = settings.stripeSecretKeyLive || process.env.STRIPE_SECRET_KEY_LIVE;
    const testApiKey = settings.stripeSecretKeyTest || process.env.STRIPE_SECRET_KEY_TEST;

    if (!liveApiKey && !testApiKey) {
      return NextResponse.json(
        { error: "Stripe API key is not configured" },
        { status: 500 }
      );
    }

    // Retrieve subscription by trying live first, then test (prevents mode mismatch 500s)
    const { stripe, subscription, mode } = await getStripeClientAndSubscription(
      subscriptionId,
      liveApiKey,
      testApiKey
    );

    // Get the current subscription item
    const currentItem = subscription.items.data[0];
    if (!currentItem?.id) {
      return NextResponse.json(
        { error: "Subscription has no items to update", mode },
        { status: 400 }
      );
    }

    // Update subscription with new price
    let updatedSubscription: Stripe.Subscription;
    try {
      updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: currentItem.id,
          price: newPriceId,
        }],
        proration_behavior: 'always_invoice', // Prorate the change
      });
    } catch (e: any) {
      // Common cause: priceId is from the other Stripe mode (test vs live)
      if (e?.code === "resource_missing") {
        return NextResponse.json(
          {
            error: "Price ID not found in the same Stripe mode as the subscription",
            details: e?.message,
            mode,
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Failed to update subscription", details: e?.message || String(e), mode },
        { status: 500 }
      );
    }

    // Update page in database if pageId is provided
    if (pageId) {
      try {
        // Determine plan from price
        let price: Stripe.Price;
        try {
          price = await stripe.prices.retrieve(newPriceId);
        } catch (e: any) {
          if (e?.code === "resource_missing") {
            // Don't fail the whole request, but do give a useful log
            console.error("[API /api/stripe/subscription/update] Price not found in mode", mode, newPriceId);
            price = null as any;
          } else {
            throw e;
          }
        }

        if (!price) {
          // Can't infer plan, but we can still keep subscription ids in sync
          await updatePage(pageId, {
            subscriptionStatus: updatedSubscription.status === 'active' ? 'active' : 'cancelled',
            stripeSubscriptionId: updatedSubscription.id,
            subscriptionStartDate: new Date(updatedSubscription.created * 1000).toISOString(),
            subscriptionEndDate: (updatedSubscription as any).current_period_end 
              ? new Date((updatedSubscription as any).current_period_end * 1000).toISOString()
              : undefined,
          });
          return NextResponse.json({
            success: true,
            subscription: { id: updatedSubscription.id, status: updatedSubscription.status },
            mode,
            warning: "Updated subscription, but could not retrieve price in this Stripe mode to infer plan metadata.",
          });
        }

        const product = typeof price.product === 'string' 
          ? await stripe.products.retrieve(price.product)
          : price.product;
        
        // Check if product is not deleted before accessing metadata
        const plan = (typeof product === 'object' && product !== null && !('deleted' in product && product.deleted))
          ? (product.metadata?.plan as "free" | "start" | "pro" || "start")
          : "start";
        
        await updatePage(pageId, {
          subscriptionPlan: plan,
          subscriptionStatus: updatedSubscription.status === 'active' ? 'active' : 'cancelled',
          stripeSubscriptionId: updatedSubscription.id,
          subscriptionStartDate: new Date(updatedSubscription.created * 1000).toISOString(),
          subscriptionEndDate: (updatedSubscription as any).current_period_end 
            ? new Date((updatedSubscription as any).current_period_end * 1000).toISOString()
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
