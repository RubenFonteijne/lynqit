import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  try {
    const stripe = await getStripeClient();
    
    // Get available payment methods from Stripe
    // Stripe supports many payment methods, but for subscriptions we focus on:
    // card, paypal, sepa_debit, etc.
    const paymentMethods = await stripe.paymentMethods.list({
      limit: 100, // Get all available payment methods
    });

    // Get payment method types that Stripe supports
    // For subscriptions, we can use: card, paypal, sepa_debit, etc.
    // We'll return the types that Stripe supports for subscriptions
    const subscriptionSupportedTypes = [
      'card',
      'paypal',
      'sepa_debit',
      'ideal',
      'bancontact',
      'sofort',
      'giropay',
    ];

    // Map to a simpler format
    const methodDescriptions: Record<string, string> = {
      'card': 'Creditcard / Debitcard',
      'paypal': 'PayPal',
      'sepa_debit': 'SEPA Direct Debit',
      'ideal': 'iDEAL',
      'bancontact': 'Bancontact',
      'sofort': 'Sofort',
      'giropay': 'Giropay',
    };

    // Return available payment method types for subscriptions
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
    // Return default methods on error
    return NextResponse.json({
      methods: [
        { id: 'card', description: 'Creditcard / Debitcard', available: true },
        { id: 'paypal', description: 'PayPal', available: true },
      ],
    });
  }
}

