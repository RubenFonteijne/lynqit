import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSettings } from "@/lib/settings";

function createStripeClient(apiKey: string): Stripe {
  return new Stripe(apiKey, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
  });
}

// GET - Retrieve Stripe subscription details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const subscriptionId = resolvedParams.id;

    console.log("[API /api/stripe/subscription/[id]] Received subscription ID:", subscriptionId);

    if (!subscriptionId) {
      console.error("[API /api/stripe/subscription/[id]] No subscription ID provided");
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    const settings = await getSettings();
    
    // Try both test and live mode to find the subscription
    const testApiKey = settings.stripeSecretKeyTest || process.env.STRIPE_SECRET_KEY_TEST;
    const liveApiKey = settings.stripeSecretKeyLive || process.env.STRIPE_SECRET_KEY_LIVE;
    
    let subscription: Stripe.Subscription | null = null;
    let mode: 'test' | 'live' | null = null;
    let error: Error | null = null;

    // Try live mode first
    if (liveApiKey) {
      try {
        const stripe = createStripeClient(liveApiKey);
        subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ['customer', 'items.data.price.product', 'latest_invoice', 'default_payment_method'],
        });
        mode = 'live';
      } catch (e: any) {
        if (e.code !== 'resource_missing') {
          error = e;
        }
      }
    }

    // If not found in live, try test mode
    if (!subscription && testApiKey) {
      try {
        const stripe = createStripeClient(testApiKey);
        subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ['customer', 'items.data.price.product', 'latest_invoice', 'default_payment_method'],
        });
        mode = 'test';
      } catch (e: any) {
        if (!error) {
          error = e;
        }
      }
    }

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found", details: error?.message || "Subscription not found in test or live mode" },
        { status: 404 }
      );
    }

    // Explicit type assertion to ensure TypeScript recognizes all Subscription properties
    const sub = subscription as Stripe.Subscription;

    // Format subscription data for frontend (only requested fields)
    const subscriptionData = {
      id: sub.id,
      status: sub.status,
      mode,
      customerDetails: typeof sub.customer === 'object' && sub.customer !== null && !('deleted' in sub.customer && sub.customer.deleted) ? {
        id: sub.customer.id,
        email: sub.customer.email || null,
        name: sub.customer.name || null,
        phone: sub.customer.phone || null,
      } : null,
      items: sub.items.data.map(item => ({
        id: item.id,
        price: {
          id: item.price.id,
          unit_amount: item.price.unit_amount,
          currency: item.price.currency,
          recurring: item.price.recurring,
          product: typeof item.price.product === 'object' && item.price.product !== null && !('deleted' in item.price.product && item.price.product.deleted) ? {
            id: item.price.product.id,
            name: item.price.product.name || null,
            description: item.price.product.description || null,
          } : (typeof item.price.product === 'string' ? item.price.product : null),
        },
        quantity: item.quantity,
      })),
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      cancel_at_period_end: sub.cancel_at_period_end,
      canceled_at: sub.canceled_at,
      cancel_at: sub.cancel_at,
      default_payment_method_details: typeof sub.default_payment_method === 'object' && sub.default_payment_method !== null ? {
        type: sub.default_payment_method.type,
        card: sub.default_payment_method.card ? {
          brand: sub.default_payment_method.card.brand,
          last4: sub.default_payment_method.card.last4,
          exp_month: sub.default_payment_method.card.exp_month,
          exp_year: sub.default_payment_method.card.exp_year,
        } : null,
      } : null,
      latest_invoice_details: typeof sub.latest_invoice === 'object' && sub.latest_invoice !== null ? {
        id: sub.latest_invoice.id,
        amount_due: sub.latest_invoice.amount_due,
        amount_paid: sub.latest_invoice.amount_paid,
        currency: sub.latest_invoice.currency,
        status: sub.latest_invoice.status,
        hosted_invoice_url: sub.latest_invoice.hosted_invoice_url,
        invoice_pdf: sub.latest_invoice.invoice_pdf,
      } : null,
    };

    return NextResponse.json({ subscription: subscriptionData });
  } catch (error) {
    console.error("Error fetching Stripe subscription:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching subscription", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
