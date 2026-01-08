import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSettings } from "@/lib/settings";
import { createPage } from "@/lib/lynqit-pages";
import { getUserByEmail } from "@/lib/users";

// Helper function to create Stripe client with specific API key
function createStripeClient(apiKey: string): Stripe {
  return new Stripe(apiKey, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
  });
}

// POST - Create a free Stripe subscription directly (without checkout)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, priceId, slug } = body;

    console.log("[API /api/stripe/subscription/create-free] Request received:", { email, priceId, slug });

    if (!email || !priceId) {
      console.error("[API /api/stripe/subscription/create-free] Missing required fields:", { email: !!email, priceId: !!priceId });
      return NextResponse.json(
        { error: "Email and priceId are required" },
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

    console.log("[API /api/stripe/subscription/create-free] Creating/finding customer for:", email.toLowerCase());

    // Get or create customer
    const customers = await stripe.customers.list({
      email: email.toLowerCase(),
      limit: 1,
    });

    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
      console.log("[API /api/stripe/subscription/create-free] Found existing customer:", customer.id);
    } else {
      customer = await stripe.customers.create({
        email: email.toLowerCase(),
        metadata: {
          email: email.toLowerCase(),
          slug: slug || '',
        },
      });
      console.log("[API /api/stripe/subscription/create-free] Created new customer:", customer.id);
    }

    // Create subscription with $0 price
    // For free subscriptions, we can create them directly without payment
    console.log("[API /api/stripe/subscription/create-free] Creating subscription with priceId:", priceId);
    
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price: priceId,
        },
      ],
      metadata: {
        email: email.toLowerCase(),
        slug: slug || '',
      },
      expand: ['latest_invoice'],
    });

    console.log("[API /api/stripe/subscription/create-free] Subscription created:", subscription.id);

    // For free subscriptions, the invoice should already be paid automatically
    // But let's make sure by checking and paying if needed
    if (subscription.latest_invoice && typeof subscription.latest_invoice === 'object') {
      const invoice = subscription.latest_invoice;
      if (invoice.amount_due === 0 && invoice.status === 'open') {
        // Mark invoice as paid for free subscriptions
        await stripe.invoices.pay(invoice.id);
      }
    }

    // Get user and create/update page
    const user = await getUserByEmail(email.toLowerCase());
    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please register first." },
        { status: 404 }
      );
    }

    // Create or update page with subscription info
    let page;
    try {
      console.log("[API /api/stripe/subscription/create-free] Creating/updating page for user:", user.email, "slug:", slug);
      
      // Try to get existing page by slug
      const { getPageBySlug } = await import("@/lib/lynqit-pages");
      const existingPage = await getPageBySlug(slug);
      
      if (existingPage) {
        console.log("[API /api/stripe/subscription/create-free] Found existing page:", existingPage.id);
        // Update existing page
        const { updatePage } = await import("@/lib/lynqit-pages");
        page = await updatePage(existingPage.id, {
          subscriptionPlan: 'free',
          subscriptionStatus: 'active',
          stripeSubscriptionId: subscription.id,
          subscriptionStartDate: new Date(subscription.created * 1000).toISOString(),
          subscriptionEndDate: subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : undefined,
        });
        console.log("[API /api/stripe/subscription/create-free] Updated page with subscription ID:", subscription.id);
      } else {
        console.log("[API /api/stripe/subscription/create-free] Creating new page");
        // Create new page
        page = await createPage(user.email, slug, {
          subscriptionPlan: 'free',
          subscriptionStatus: 'active',
        });
        console.log("[API /api/stripe/subscription/create-free] Created page:", page.id);
        
        // Update page with Stripe subscription ID
        const { updatePage } = await import("@/lib/lynqit-pages");
        page = await updatePage(page.id, {
          stripeSubscriptionId: subscription.id,
          subscriptionStartDate: new Date(subscription.created * 1000).toISOString(),
          subscriptionEndDate: subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : undefined,
        });
        console.log("[API /api/stripe/subscription/create-free] Updated new page with subscription ID:", subscription.id);
      }
    } catch (pageError) {
      console.error("[API /api/stripe/subscription/create-free] Error creating/updating page:", pageError);
      // Continue even if page creation fails
    }

    return NextResponse.json({ 
      subscriptionId: subscription.id,
      customerId: customer.id,
      page: page ? { id: page.id, slug: page.slug } : null,
    });
  } catch (error) {
    console.error("Error creating free Stripe subscription:", error);
    return NextResponse.json(
      { error: "An error occurred while creating subscription", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
