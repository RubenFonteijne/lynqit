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

// GET - Find Stripe subscriptions by customer email
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const settings = await getSettings();
    
    // Try both test and live mode to find subscriptions
    const testApiKey = settings.stripeSecretKeyTest || process.env.STRIPE_SECRET_KEY_TEST;
    const liveApiKey = settings.stripeSecretKeyLive || process.env.STRIPE_SECRET_KEY_LIVE;
    
    let subscriptions: Stripe.Subscription[] = [];
    let mode: 'test' | 'live' | null = null;
    const searchEmail = email.toLowerCase();

    // Try live mode first - use multiple search strategies
    if (liveApiKey) {
      try {
        console.log("[API /api/stripe/subscription/find-by-email] Searching in live mode for email:", searchEmail);
        const stripe = createStripeClient(liveApiKey);
        
        // Strategy 1: Find customer by email, then get subscriptions
        const customers = await stripe.customers.list({
          email: searchEmail,
          limit: 10, // Get more customers in case of duplicates
        });
        
        console.log("[API /api/stripe/subscription/find-by-email] Found", customers.data.length, "customers in live mode");
        
        if (customers.data.length > 0) {
          // Get subscriptions for all matching customers
          for (const customer of customers.data) {
            const customerSubscriptions = await stripe.subscriptions.list({
              customer: customer.id,
              limit: 100,
              expand: ['data.customer', 'data.items.data.price.product', 'data.latest_invoice', 'data.default_payment_method'],
            });
            subscriptions.push(...customerSubscriptions.data);
          }
          mode = 'live';
          console.log("[API /api/stripe/subscription/find-by-email] Found", subscriptions.length, "subscriptions via customers in live mode");
        }
        
        // Strategy 2: If no subscriptions found, search all subscriptions and filter by customer email or metadata
        if (subscriptions.length === 0) {
          console.log("[API /api/stripe/subscription/find-by-email] No subscriptions via customers, searching all subscriptions in live mode...");
          const allSubscriptions = await stripe.subscriptions.list({
            limit: 100,
            expand: ['data.customer', 'data.items.data.price.product', 'data.latest_invoice', 'data.default_payment_method'],
          });
          
          // Filter subscriptions by customer email or metadata
          const matchingSubscriptions = allSubscriptions.data.filter(sub => {
            if (typeof sub.customer === 'object' && sub.customer && !('deleted' in sub.customer && sub.customer.deleted)) {
              const customerEmail = sub.customer.email?.toLowerCase();
              if (customerEmail === searchEmail) {
                return true;
              }
            }
            // Also check metadata
            if (sub.metadata?.email?.toLowerCase() === searchEmail) {
              return true;
            }
            return false;
          });
          
          if (matchingSubscriptions.length > 0) {
            subscriptions = matchingSubscriptions;
            mode = 'live';
            console.log("[API /api/stripe/subscription/find-by-email] Found", subscriptions.length, "subscriptions via full search in live mode");
          }
        }
      } catch (e: any) {
        console.error("[API /api/stripe/subscription/find-by-email] Error in live mode:", e.message);
      }
    }

    // If not found in live, try test mode with same strategies
    if (subscriptions.length === 0 && testApiKey) {
      try {
        console.log("[API /api/stripe/subscription/find-by-email] Searching in test mode for email:", searchEmail);
        const stripe = createStripeClient(testApiKey);
        
        // Strategy 1: Find customer by email, then get subscriptions
        const customers = await stripe.customers.list({
          email: searchEmail,
          limit: 10,
        });
        
        console.log("[API /api/stripe/subscription/find-by-email] Found", customers.data.length, "customers in test mode");
        
        if (customers.data.length > 0) {
          // Get subscriptions for all matching customers
          for (const customer of customers.data) {
            const customerSubscriptions = await stripe.subscriptions.list({
              customer: customer.id,
              limit: 100,
              expand: ['data.customer', 'data.items.data.price.product', 'data.latest_invoice', 'data.default_payment_method'],
            });
            subscriptions.push(...customerSubscriptions.data);
          }
          mode = 'test';
          console.log("[API /api/stripe/subscription/find-by-email] Found", subscriptions.length, "subscriptions via customers in test mode");
        }
        
        // Strategy 2: If no subscriptions found, search all subscriptions and filter
        if (subscriptions.length === 0) {
          console.log("[API /api/stripe/subscription/find-by-email] No subscriptions via customers, searching all subscriptions in test mode...");
          const allSubscriptions = await stripe.subscriptions.list({
            limit: 100,
            expand: ['data.customer', 'data.items.data.price.product', 'data.latest_invoice', 'data.default_payment_method'],
          });
          
          // Filter subscriptions by customer email or metadata
          const matchingSubscriptions = allSubscriptions.data.filter(sub => {
            if (typeof sub.customer === 'object' && sub.customer && !('deleted' in sub.customer && sub.customer.deleted)) {
              const customerEmail = sub.customer.email?.toLowerCase();
              if (customerEmail === searchEmail) {
                return true;
              }
            }
            // Also check metadata
            if (sub.metadata?.email?.toLowerCase() === searchEmail) {
              return true;
            }
            return false;
          });
          
          if (matchingSubscriptions.length > 0) {
            subscriptions = matchingSubscriptions;
            mode = 'test';
            console.log("[API /api/stripe/subscription/find-by-email] Found", subscriptions.length, "subscriptions via full search in test mode");
          }
        }
      } catch (e: any) {
        console.error("[API /api/stripe/subscription/find-by-email] Error in test mode:", e.message);
      }
    }

    // If still no subscriptions found, try finding via invoices (fallback method)
    if (subscriptions.length === 0) {
      console.log("[API /api/stripe/subscription/find-by-email] No subscriptions found via customer search, trying via invoices...");
      
      // Try live mode first
      if (liveApiKey) {
        try {
          const stripe = createStripeClient(liveApiKey);
          const invoices = await stripe.invoices.list({
            customer_email: email.toLowerCase(),
            limit: 100,
            expand: ['data.subscription'],
          });
          
          console.log("[API /api/stripe/subscription/find-by-email] Found", invoices.data.length, "invoices in live mode");
          
          // Extract unique subscriptions from invoices
          const subscriptionIds = new Set<string>();
          for (const invoice of invoices.data) {
            let subscriptionId: string | null = null;
            if (typeof invoice.subscription === 'string') {
              subscriptionId = invoice.subscription;
            } else if (invoice.subscription && typeof invoice.subscription === 'object') {
              subscriptionId = invoice.subscription.id;
            }
            if (subscriptionId) {
              subscriptionIds.add(subscriptionId);
              console.log("[API /api/stripe/subscription/find-by-email] Found subscription ID in invoice:", subscriptionId);
            }
          }
          
          if (subscriptionIds.size > 0) {
            console.log("[API /api/stripe/subscription/find-by-email] Found", subscriptionIds.size, "unique subscriptions via invoices in live mode");
            // Fetch full subscription details for each subscription ID
            const subscriptionPromises = Array.from(subscriptionIds).map(subId => 
              stripe.subscriptions.retrieve(subId, {
                expand: ['customer', 'items.data.price.product', 'latest_invoice', 'default_payment_method'],
              }).catch((err) => {
                console.error("[API /api/stripe/subscription/find-by-email] Error retrieving subscription", subId, ":", err.message);
                return null;
              })
            );
            const fetchedSubscriptions = await Promise.all(subscriptionPromises);
            subscriptions = fetchedSubscriptions.filter(sub => sub !== null) as Stripe.Subscription[];
            mode = 'live';
            console.log("[API /api/stripe/subscription/find-by-email] Successfully retrieved", subscriptions.length, "subscriptions from invoices in live mode");
          }
        } catch (e: any) {
          console.error("[API /api/stripe/subscription/find-by-email] Error finding via invoices in live mode:", e.message);
        }
      }
      
      // Try test mode if still no subscriptions
      if (subscriptions.length === 0 && testApiKey) {
        try {
          const stripe = createStripeClient(testApiKey);
          const invoices = await stripe.invoices.list({
            customer_email: email.toLowerCase(),
            limit: 100,
            expand: ['data.subscription'],
          });
          
          console.log("[API /api/stripe/subscription/find-by-email] Found", invoices.data.length, "invoices in test mode");
          
          // Extract unique subscriptions from invoices
          const subscriptionIds = new Set<string>();
          for (const invoice of invoices.data) {
            let subscriptionId: string | null = null;
            if (typeof invoice.subscription === 'string') {
              subscriptionId = invoice.subscription;
            } else if (invoice.subscription && typeof invoice.subscription === 'object') {
              subscriptionId = invoice.subscription.id;
            }
            if (subscriptionId) {
              subscriptionIds.add(subscriptionId);
              console.log("[API /api/stripe/subscription/find-by-email] Found subscription ID in invoice:", subscriptionId);
            }
          }
          
          if (subscriptionIds.size > 0) {
            console.log("[API /api/stripe/subscription/find-by-email] Found", subscriptionIds.size, "unique subscriptions via invoices in test mode");
            // Fetch full subscription details for each subscription ID
            const subscriptionPromises = Array.from(subscriptionIds).map(subId => 
              stripe.subscriptions.retrieve(subId, {
                expand: ['customer', 'items.data.price.product', 'latest_invoice', 'default_payment_method'],
              }).catch((err) => {
                console.error("[API /api/stripe/subscription/find-by-email] Error retrieving subscription", subId, ":", err.message);
                return null;
              })
            );
            const fetchedSubscriptions = await Promise.all(subscriptionPromises);
            subscriptions = fetchedSubscriptions.filter(sub => sub !== null) as Stripe.Subscription[];
            mode = 'test';
            console.log("[API /api/stripe/subscription/find-by-email] Successfully retrieved", subscriptions.length, "subscriptions from invoices in test mode");
          }
        } catch (e: any) {
          console.error("[API /api/stripe/subscription/find-by-email] Error finding via invoices in test mode:", e.message);
        }
      }
    }
    
    console.log("[API /api/stripe/subscription/find-by-email] Total subscriptions found:", subscriptions.length);

    // Format subscriptions data for frontend (only requested fields)
    // Use (subscription as any) for period properties to avoid TypeScript errors
    const subscriptionsData = subscriptions.map(subscription => {
      // Check if customer is not deleted before accessing properties
      const customer = typeof subscription.customer === 'object' && subscription.customer !== null && !('deleted' in subscription.customer && subscription.customer.deleted) 
        ? subscription.customer 
        : null;
      
      return {
        id: subscription.id,
        status: subscription.status,
        mode,
        customerDetails: customer ? {
          id: customer.id,
          email: customer.email || null,
          name: customer.name || null,
          phone: customer.phone || null,
        } : null,
      items: subscription.items.data.map(item => ({
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
      current_period_start: (subscription as any).current_period_start,
      current_period_end: (subscription as any).current_period_end,
      cancel_at_period_end: (subscription as any).cancel_at_period_end,
      canceled_at: (subscription as any).canceled_at,
      cancel_at: (subscription as any).cancel_at,
      default_payment_method_details: typeof subscription.default_payment_method === 'object' && subscription.default_payment_method !== null ? {
        type: subscription.default_payment_method.type,
        card: subscription.default_payment_method.card ? {
          brand: subscription.default_payment_method.card.brand,
          last4: subscription.default_payment_method.card.last4,
          exp_month: subscription.default_payment_method.card.exp_month,
          exp_year: subscription.default_payment_method.card.exp_year,
        } : null,
      } : null,
      latest_invoice_details: typeof subscription.latest_invoice === 'object' && subscription.latest_invoice !== null ? {
        id: subscription.latest_invoice.id,
        amount_due: subscription.latest_invoice.amount_due,
        amount_paid: subscription.latest_invoice.amount_paid,
        currency: subscription.latest_invoice.currency,
        status: subscription.latest_invoice.status,
        hosted_invoice_url: subscription.latest_invoice.hosted_invoice_url,
        invoice_pdf: subscription.latest_invoice.invoice_pdf,
      } : null,
      };
    });

    return NextResponse.json({ subscriptions: subscriptionsData });
  } catch (error) {
    console.error("Error finding Stripe subscriptions by email:", error);
    return NextResponse.json(
      { error: "An error occurred while finding subscriptions", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
