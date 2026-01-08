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

// GET - Get all invoices for a customer by email
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
    
    // Try both test and live mode to find invoices
    const testApiKey = settings.stripeSecretKeyTest || process.env.STRIPE_SECRET_KEY_TEST;
    const liveApiKey = settings.stripeSecretKeyLive || process.env.STRIPE_SECRET_KEY_LIVE;
    
    let invoices: Stripe.Invoice[] = [];
    let mode: 'test' | 'live' | null = null;

    // Try live mode first
    if (liveApiKey) {
      try {
        const stripe = createStripeClient(liveApiKey);
        const customers = await stripe.customers.list({
          email: email.toLowerCase(),
          limit: 1,
        });
        
        if (customers.data.length > 0) {
          const customerInvoices = await stripe.invoices.list({
            customer: customers.data[0].id,
            limit: 100,
            expand: ['data.subscription'],
          });
          invoices = customerInvoices.data;
          mode = 'live';
          console.log("[API /api/stripe/invoices] Found", invoices.length, "invoices in live mode");
          if (invoices.length > 0) {
            const firstInvoice = invoices[0] as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null };
            console.log("[API /api/stripe/invoices] First invoice subscription:", firstInvoice.subscription);
          }
        }
      } catch (e: any) {
        console.error("[API /api/stripe/invoices] Error in live mode:", e.message);
      }
    }

    // If not found in live, try test mode
    if (invoices.length === 0 && testApiKey) {
      try {
        const stripe = createStripeClient(testApiKey);
        const customers = await stripe.customers.list({
          email: email.toLowerCase(),
          limit: 1,
        });
        
        if (customers.data.length > 0) {
          const customerInvoices = await stripe.invoices.list({
            customer: customers.data[0].id,
            limit: 100,
            expand: ['data.subscription'],
          });
          invoices = customerInvoices.data;
          mode = 'test';
          console.log("[API /api/stripe/invoices] Found", invoices.length, "invoices in test mode");
          if (invoices.length > 0) {
            const firstInvoice = invoices[0] as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null };
            console.log("[API /api/stripe/invoices] First invoice subscription:", firstInvoice.subscription);
          }
        }
      } catch (e: any) {
        console.error("[API /api/stripe/invoices] Error in test mode:", e.message);
      }
    }

    // Format invoices for frontend
    const invoicesData = invoices.map(invoice => {
      // Extract subscription ID - can be string, object, or null
      // Type assertion needed because subscription might not be in the type definition
      const invoiceWithSubscription = invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null };
      let subscriptionId: string | null = null;
      if (invoiceWithSubscription.subscription) {
        if (typeof invoiceWithSubscription.subscription === 'string') {
          subscriptionId = invoiceWithSubscription.subscription;
        } else if (typeof invoiceWithSubscription.subscription === 'object' && invoiceWithSubscription.subscription !== null) {
          subscriptionId = invoiceWithSubscription.subscription.id || null;
        }
      }
      
      console.log("[API /api/stripe/invoices] Invoice", invoice.id, "subscription:", invoiceWithSubscription.subscription, "extracted ID:", subscriptionId);
      
      return {
        id: invoice.id,
        number: invoice.number,
        amount_due: invoice.amount_due,
        amount_paid: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status,
        created: invoice.created,
        due_date: invoice.due_date,
        hosted_invoice_url: invoice.hosted_invoice_url,
        invoice_pdf: invoice.invoice_pdf,
        subscription: subscriptionId,
        customer_email: invoice.customer_email,
        customer_name: invoice.customer_name,
        line_items: invoice.lines?.data.map(item => ({
          description: item.description,
          amount: item.amount,
          currency: item.currency,
          quantity: item.quantity,
        })) || [],
      };
    });

    return NextResponse.json({ 
      invoices: invoicesData,
      mode,
    });
  } catch (error) {
    console.error("Error fetching Stripe invoices:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching invoices", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
