import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getUserByEmail, updateUser } from "@/lib/users";
import { createPage, updatePage, getPages } from "@/lib/lynqit-pages";
import { createServerClient } from "@/lib/supabase-server";
import Stripe from "stripe";

/**
 * Stripe webhook handler
 * Handles checkout.session.completed and subscription events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET_TEST;
    if (!webhookSecret) {
      console.error("Stripe webhook secret not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const stripe = await getStripeClient();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    console.log("Stripe webhook event received:", event.type, event.id);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred processing webhook" },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed
 * Creates user account and page if this is a new registration
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  const email = metadata.email;
  const slug = metadata.slug;
  const password = metadata.password;

  if (!email || !slug || !password) {
    console.error("Missing required metadata in checkout session");
    return;
  }

  // Check if user already exists
  let user = await getUserByEmail(email);
  
  if (!user) {
    // Create user account via Supabase Auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase configuration");
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
    const { data: authData, error: authError } = await supabaseAnon.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${baseUrl}/account-confirmed`,
      },
    });

    if (authError || !authData.user) {
      console.error("Error creating user account:", authError);
      throw new Error(authError?.message || "Failed to create user account");
    }

    // Create user in database
    const supabaseAdmin = createServerClient();
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: email.toLowerCase(),
        role: 'user',
        stripe_customer_id: session.customer as string,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (createError) {
      console.error("Error creating user in database:", createError);
      throw new Error(`Failed to create user in database: ${createError.message}`);
    }

    user = {
      id: newUser.id,
      email: newUser.email,
      role: (newUser.role || 'user') as 'admin' | 'user',
      stripeCustomerId: newUser.stripe_customer_id,
      createdAt: newUser.created_at || new Date().toISOString(),
      updatedAt: newUser.updated_at,
    };

    console.log("Created user account for:", email);
  } else {
    // Update existing user with Stripe customer ID if needed
    if (session.customer && !user.stripeCustomerId) {
      await updateUser(email, { stripeCustomerId: session.customer as string });
    }
  }

  // Get subscription from session
  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error("No subscription ID in checkout session");
    return;
  }

  const stripe = await getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;
  
  if (!priceId) {
    console.error("No price ID in subscription");
    return;
  }

  // Determine plan from price
  const price = await stripe.prices.retrieve(priceId);
  const product = await stripe.products.retrieve(price.product as string);
  const plan = product.name.toLowerCase().includes('pro') ? 'pro' : 
               product.name.toLowerCase().includes('start') ? 'start' : 'free';

  // Create or update page
  const pages = await getPages();
  const existingPage = pages.find(p => p.userId === user.id && p.slug === slug);

  // Map Stripe subscription status to our status
  const mapSubscriptionStatus = (stripeStatus: string): "active" | "cancelled" | "expired" | undefined => {
    if (stripeStatus === 'active' || stripeStatus === 'trialing') {
      return 'active';
    }
    if (stripeStatus === 'canceled' || stripeStatus === 'cancelled') {
      return 'cancelled';
    }
    if (stripeStatus === 'past_due' || stripeStatus === 'unpaid' || stripeStatus === 'incomplete_expired') {
      return 'expired';
    }
    return undefined; // For other statuses like 'incomplete', 'paused', etc.
  };

  const subscriptionStatus = mapSubscriptionStatus(subscription.status);

  if (existingPage) {
    // Update existing page
    await updatePage(existingPage.id, {
      stripeSubscriptionId: subscriptionId,
      subscriptionPlan: plan as any,
      subscriptionStatus: subscriptionStatus,
      subscriptionStartDate: new Date(subscription.current_period_start * 1000).toISOString(),
      subscriptionEndDate: new Date(subscription.current_period_end * 1000).toISOString(),
    });
  } else {
    // Create new page
    await createPage({
      userId: user.id,
      slug: slug,
      title: slug,
      subscriptionPlan: plan as any,
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: subscriptionStatus,
      subscriptionStartDate: new Date(subscription.current_period_start * 1000).toISOString(),
      subscriptionEndDate: new Date(subscription.current_period_end * 1000).toISOString(),
    });
  }

  console.log("Checkout completed for:", email, "subscription:", subscriptionId);
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const pages = await getPages();
  const page = pages.find(p => p.stripeSubscriptionId === subscription.id);

  if (page) {
    // Map Stripe subscription status to our status
    let subscriptionStatus: "active" | "cancelled" | "expired" | undefined;
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      subscriptionStatus = 'active';
    } else if (subscription.status === 'canceled' || subscription.status === 'cancelled') {
      subscriptionStatus = 'cancelled';
    } else if (subscription.status === 'past_due' || subscription.status === 'unpaid' || subscription.status === 'incomplete_expired') {
      subscriptionStatus = 'expired';
    }

    await updatePage(page.id, {
      subscriptionStatus: subscriptionStatus,
      subscriptionEndDate: new Date(subscription.current_period_end * 1000).toISOString(),
    });
  }
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const pages = await getPages();
  const page = pages.find(p => p.stripeSubscriptionId === subscription.id);

  if (page) {
    await updatePage(page.id, {
      subscriptionStatus: 'cancelled',
    });
  }
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    const subscriptionId = typeof invoice.subscription === 'string' 
      ? invoice.subscription 
      : invoice.subscription.id;
    
    const pages = await getPages();
    const page = pages.find((p) => p.stripeSubscriptionId === subscriptionId);

    if (page) {
      const stripe = await getStripeClient();
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      await updatePage(page.id, {
        subscriptionStatus: "active",
        subscriptionEndDate: new Date(subscription.current_period_end * 1000).toISOString(),
      });
    }
  }
}
