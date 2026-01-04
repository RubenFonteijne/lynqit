import { NextRequest, NextResponse } from "next/server";
import { getMollieClient } from "@/lib/mollie";

export async function GET(request: NextRequest) {
  try {
    const mollieClient = await getMollieClient();
    
    // Get available payment methods from Mollie
    // For subscriptions, we need to check which methods are available
    // Mollie subscriptions support: creditcard, paypal, sepadirectdebit, directdebit
    let methods;
    try {
      methods = await mollieClient.methods.list();
    } catch (methodsError: any) {
      console.error("Error fetching methods from Mollie:", methodsError);
      // If methods.list() fails, return default methods
      // This can happen if the API key doesn't have permissions or if there's an auth issue
      return NextResponse.json({
        methods: [
          { id: 'creditcard', description: 'Creditcard', available: true },
          { id: 'paypal', description: 'PayPal', available: true },
        ],
      });
    }
    
    // Methods that are suitable for subscriptions (recurring payments)
    const subscriptionSupportedMethods = ['creditcard', 'paypal', 'sepadirectdebit', 'directdebit'];
    
    // Filter methods that are available and suitable for subscriptions
    const subscriptionMethods = methods.filter(method => {
      const methodId = method.id.toLowerCase();
      return subscriptionSupportedMethods.includes(methodId) && 
             method.status === 'activated' && 
             method.available;
    });

    // Map to a simpler format with user-friendly descriptions
    const methodDescriptions: Record<string, string> = {
      'creditcard': 'Creditcard',
      'paypal': 'PayPal',
      'sepadirectdebit': 'SEPA Direct Debit',
      'directdebit': 'Direct Debit',
    };

    const availableMethods = subscriptionMethods.map(method => ({
      id: method.id,
      description: methodDescriptions[method.id.toLowerCase()] || method.description,
      available: method.available,
    }));

    // Always include creditcard and paypal as fallback (most common for subscriptions)
    // These are the most reliable methods for subscriptions
    const defaultMethods = [
      { id: 'creditcard', description: 'Creditcard', available: true },
      { id: 'paypal', description: 'PayPal', available: true },
    ];

    // Merge and deduplicate, prioritizing default methods
    const allMethods = [...defaultMethods];
    availableMethods.forEach(method => {
      if (!allMethods.find(m => m.id.toLowerCase() === method.id.toLowerCase())) {
        allMethods.push(method);
      }
    });

    return NextResponse.json({
      methods: allMethods,
    });
  } catch (error: any) {
    console.error("Error fetching payment methods:", error);
    // Return default methods if Mollie API fails
    return NextResponse.json({
      methods: [
        { id: 'creditcard', description: 'Creditcard', available: true },
        { id: 'paypal', description: 'PayPal', available: true },
      ],
    });
  }
}

