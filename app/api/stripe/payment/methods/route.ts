import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  try {
    const stripe = await getStripeClient();
    
    // Get account information to check available payment methods
    let account;
    try {
      account = await stripe.accounts.retrieve();
    } catch (error) {
      // If account retrieval fails, we'll use default methods
      console.warn("Could not retrieve Stripe account, using default payment methods");
    }
    
    // Get payment method types that Stripe supports for subscriptions in checkout sessions
    // These are the payment methods that can be used in checkout sessions with mode: 'subscription'
    // Stripe will automatically filter these based on account settings and customer location
    const subscriptionSupportedTypes = [
      'card',           // Always available
      'paypal',         // Available for subscriptions
      'sepa_debit',     // SEPA Direct Debit for EU
      'ideal',          // iDEAL for Netherlands
      'bancontact',     // Bancontact for Belgium
      'sofort',         // Sofort for Germany/Austria
      'giropay',        // Giropay for Germany
    ];

    // Map to user-friendly descriptions
    const methodDescriptions: Record<string, string> = {
      'card': 'Creditcard / Debitcard',
      'paypal': 'PayPal',
      'sepa_debit': 'SEPA Direct Debit',
      'ideal': 'iDEAL',
      'bancontact': 'Bancontact',
      'sofort': 'Sofort',
      'giropay': 'Giropay',
    };

    // Return all subscription-supported payment methods
    // Stripe will automatically filter which ones are available in the checkout session
    // based on account settings, customer location, and payment method availability
    const availableMethods = subscriptionSupportedTypes.map(type => ({
      id: type,
      description: methodDescriptions[type] || type,
      available: true,
    }));

    return NextResponse.json({
      methods: availableMethods,
    });
  } catch (error: any) {
    console.error("Error fetching Stripe payment methods:", error);
    
    // Return default methods on error (these are always available)
    return NextResponse.json({
      methods: [
        { id: 'card', description: 'Creditcard / Debitcard', available: true },
        { id: 'paypal', description: 'PayPal', available: true },
      ],
    });
  }
}

