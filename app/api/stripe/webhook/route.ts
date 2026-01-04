import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getUserByEmail, updateUser } from "@/lib/users";
import { getPageById, updatePage, deletePage, createPage, getPages } from "@/lib/lynqit-pages";
import type { SubscriptionPlan } from "@/lib/lynqit-pages";
import { getDiscountCodeById, incrementDiscountCodeUsage } from "@/lib/discount-codes";
import { createServerClient } from "@/lib/supabase-server";
import Stripe from "stripe";

// Stripe webhook secret from environment or settings
const getWebhookSecret = async (): Promise<string | undefined> => {
  // In production, this should come from settings or environment variable
  return process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET_TEST;
};

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

    const webhookSecret = await getWebhookSecret();
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

      case "customer.subscription.created":
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

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
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

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  const email = metadata.email;
  const plan = metadata.plan as SubscriptionPlan;
  const pageId = metadata.pageId;
  const slug = metadata.slug;
  const password = metadata.password;
  const createAccount = metadata.createAccount === "true";

  if (!email || !plan) {
    console.error("Missing email or plan in checkout session metadata");
    return;
  }

  // Create account if this is a new registration
  if (createAccount && slug && password) {
    let user = await getUserByEmail(email);
    
    if (!user) {
      try {
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
      } catch (error: any) {
        console.error("Error creating account in webhook:", error);
        return;
      }
    } else {
      // Update existing user with Stripe customer ID
      await updateUser(email, {
        stripeCustomerId: session.customer as string,
      });
    }

    // Create page if it doesn't exist
    if (slug && user) {
      try {
        const newPage = await createPage(
          user.email,
          slug,
          {
            subscriptionPlan: plan,
            subscriptionStatus: "expired", // Will be set to active below
          }
        );
        
        // Get subscription from Stripe
        const stripe = await getStripeClient();
        const subscriptionId = session.subscription as string;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await updatePage(newPage.id, {
            subscriptionPlan: plan,
            subscriptionStatus: subscription.status === "active" ? "active" : "expired",
            subscriptionStartDate: new Date(subscription.current_period_start * 1000).toISOString(),
            subscriptionEndDate: new Date(subscription.current_period_end * 1000).toISOString(),
            stripeSubscriptionId: subscriptionId,
          });
        }
      } catch (error: any) {
        console.error("Error creating page in webhook:", error);
      }
    }
  } else if (pageId) {
    // Update existing page
    const page = await getPageById(pageId);
    if (page) {
      const stripe = await getStripeClient();
      const subscriptionId = session.subscription as string;
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await updatePage(pageId, {
          subscriptionPlan: plan,
          subscriptionStatus: subscription.status === "active" ? "active" : "expired",
          subscriptionStartDate: new Date(subscription.current_period_start * 1000).toISOString(),
          subscriptionEndDate: new Date(subscription.current_period_end * 1000).toISOString(),
          stripeSubscriptionId: subscriptionId,
        });
      }
    }
  }

  // Increment discount code usage if applied
  if (metadata.discountCodeId && metadata.appliedDiscount === "true") {
    try {
      await incrementDiscountCodeUsage(metadata.discountCodeId);
    } catch (error) {
      console.error("Error incrementing discount code usage:", error);
    }
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const metadata = subscription.metadata || {};
  const email = metadata.email;
  const plan = metadata.plan as SubscriptionPlan;
  const pageId = metadata.pageId;

  if (!email || !plan) {
    console.error("Missing email or plan in subscription metadata");
    return;
  }

  // Find page by subscription ID
  const pages = await getPages();
  const page = pages.find((p) => p.stripeSubscriptionId === subscription.id);

  if (!page) {
    console.error("Page not found for subscription:", subscription.id);
    return;
  }

  const now = new Date();
  const subscriptionEndDate = new Date(subscription.current_period_end * 1000);

  await updatePage(page.id, {
    subscriptionPlan: plan,
    subscriptionStatus: subscription.status === "active" ? "active" : "expired",
    subscriptionStartDate: subscription.start_date 
      ? new Date(subscription.start_date * 1000).toISOString()
      : page.subscriptionStartDate || now.toISOString(),
    subscriptionEndDate: subscriptionEndDate.toISOString(),
    stripeSubscriptionId: subscription.id,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const pages = await getPages();
  const page = pages.find((p) => p.stripeSubscriptionId === subscription.id);

  if (!page) {
    console.error("Page not found for subscription:", subscription.id);
    return;
  }

  // Only delete page if it was just created (expired status with paid plan)
  if (page.subscriptionStatus === "expired" && page.subscriptionPlan !== "free") {
    await deletePage(page.id);
    console.log(`Deleted page ${page.id} due to cancelled subscription`);
  } else {
    // For existing pages, just revert to free plan
    await updatePage(page.id, {
      subscriptionPlan: "free",
      subscriptionStatus: "expired",
      stripeSubscriptionId: undefined,
    });
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Update subscription dates when payment succeeds
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

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Handle failed payment - could send notification or update status
  console.log("Invoice payment failed:", invoice.id);
  // For now, just log it - Stripe will retry automatically
}

