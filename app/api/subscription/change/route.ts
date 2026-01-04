import { NextRequest, NextResponse } from "next/server";
import { getMollieClient, SUBSCRIPTION_PRICES, calculatePriceWithBTW } from "@/lib/mollie";
import { getUserByEmail, isAdminUserAsync, updateUser } from "@/lib/users";
import { getPageById, updatePage } from "@/lib/lynqit-pages";
import type { SubscriptionPlan } from "@/lib/lynqit-pages";
import { PaymentMethod } from "@mollie/api-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, pageId, newPlan, paymentMethod } = body;

    if (!email || !pageId || !newPlan) {
      return NextResponse.json(
        { error: "Email, pageId en newPlan zijn verplicht" },
        { status: 400 }
      );
    }

    if (newPlan !== "start" && newPlan !== "pro" && newPlan !== "free") {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'start', 'pro', or 'free'" },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify page exists and belongs to user
    const page = await getPageById(pageId);
    if (!page) {
      return NextResponse.json(
        { error: "Page not found" },
        { status: 404 }
      );
    }

    // Check if user owns the page or is admin
    const isAdmin = await isAdminUserAsync(email);
    if (page.userId !== email && !isAdmin) {
      return NextResponse.json(
        { error: "Page does not belong to user" },
        { status: 403 }
      );
    }

    // Handle downgrade to free (no payment needed)
    if (newPlan === "free") {
      // Cancel existing subscription if it exists
      if (page.mollieSubscriptionId && user.mollieCustomerId) {
        let mollieClient;
        try {
          mollieClient = await getMollieClient();
          if (mollieClient) {
            try {
              await (mollieClient.customerSubscriptions as any).cancel(
                user.mollieCustomerId!,
                page.mollieSubscriptionId!
              );
            } catch (error: any) {
              // Subscription might already be cancelled, continue anyway
              console.log("Subscription cancellation note:", error.message);
            }
          }
        } catch (error: any) {
          console.error("Failed to get Mollie client:", error);
          // Continue anyway to update the page
        }
      }

      // Update page to free plan
      await updatePage(pageId, {
        subscriptionPlan: "free",
        subscriptionStatus: "expired",
        mollieSubscriptionId: undefined,
        subscriptionEndDate: undefined,
        subscriptionStartDate: undefined,
      });

      return NextResponse.json({
        success: true,
        message: "Downgraded to free plan successfully",
      });
    }

    const priceExBTW = SUBSCRIPTION_PRICES[newPlan as keyof typeof SUBSCRIPTION_PRICES];
    const priceWithBTW = calculatePriceWithBTW(priceExBTW);

    let mollieClient;
    try {
      mollieClient = await getMollieClient();
    } catch (error: any) {
      console.error("Failed to get Mollie client:", error);
      return NextResponse.json(
        { error: error.message || "Mollie API key is not configured. Please set it in admin settings." },
        { status: 500 }
      );
    }

    if (!mollieClient) {
      return NextResponse.json(
        { error: "Failed to initialize Mollie client. Please check your API key in admin settings." },
        { status: 500 }
      );
    }

    // Get or create customer
    // Check if we're in test mode to handle customer ID mode mismatch
    const settings = await import("@/lib/settings").then(m => m.getSettings());
    const isTestMode = settings.useTestMode ?? false;
    
    let customerId: string | undefined = user.mollieCustomerId;
    
    // Ensure customerId is a valid string (not empty)
    if (customerId && customerId.trim() === "") {
      customerId = undefined;
    }
    
    // Try to use existing customer, but create new one if it fails (mode mismatch)
    if (customerId) {
      try {
        // Try to get the customer to verify it exists in current mode
        await mollieClient.customers.get(customerId);
      } catch (error: any) {
        // If customer doesn't exist or wrong mode, reset and create new one
        if (error.message?.includes("wrong mode") || error.message?.includes("not found")) {
          console.log(`Customer ${customerId} not available in current mode, creating new customer`);
          customerId = undefined; // Reset to create new customer
          // Clear the old customer ID from user
          await updateUser(user.email, {
            mollieCustomerId: undefined,
          });
        } else {
          throw error; // Re-throw if it's a different error
        }
      }
    }
    
    if (!customerId) {
      const customer = await mollieClient.customers.create({
        name: user.email.split("@")[0],
        email: user.email,
        metadata: {
          userId: user.email,
        },
      });
      
      if (!customer || !customer.id) {
        console.error("Failed to create customer - customer or customer.id is undefined", customer);
        return NextResponse.json(
          { error: "Failed to create customer in Mollie" },
          { status: 500 }
        );
      }
      
      customerId = customer.id;

      // Save customer ID to user
      await updateUser(user.email, {
        mollieCustomerId: customerId,
      });
    }

    // If page has an existing subscription, cancel it first
    if (page.mollieSubscriptionId && customerId) {
      try {
        await (mollieClient.customerSubscriptions as any).cancel(customerId!, page.mollieSubscriptionId!);
      } catch (error: any) {
        // Subscription might already be cancelled, continue anyway
        console.log("Subscription cancellation note:", error.message);
      }
    }

    // Ensure customerId is set and is a string before creating subscription
    if (!customerId || typeof customerId !== "string") {
      console.error("Customer ID is invalid before creating subscription:", customerId, typeof customerId);
      return NextResponse.json(
        { error: "Customer ID is required but was not found or created" },
        { status: 500 }
      );
    }

    console.log("Creating subscription with customerId:", customerId);

    // Create new subscription for the new plan (monthly recurring)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const isLocalhost = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");
    const webhookUrl = isLocalhost ? undefined : `${baseUrl}/api/subscription/webhook`;
    const isLocalTestMode = isLocalhost || process.env.NODE_ENV === "development";
    
    // Get payment method from request body, default to creditcard
    const requestedPaymentMethod = paymentMethod;
    let selectedPaymentMethod: PaymentMethod;
    
    // Map payment method string to Mollie PaymentMethod enum
    // Mollie subscriptions support: creditcard, paypal, sepa, directdebit
    const methodMap: Record<string, PaymentMethod> = {
      'creditcard': PaymentMethod.creditcard,
      'paypal': PaymentMethod.paypal,
      'sepa': PaymentMethod.directdebit, // SEPA Direct Debit uses directdebit in Mollie API
      'sepadirectdebit': PaymentMethod.directdebit, // Alias for sepa
      'directdebit': PaymentMethod.directdebit,
      'ideal': PaymentMethod.ideal,
    };
    
    if (requestedPaymentMethod && methodMap[requestedPaymentMethod.toLowerCase()]) {
      selectedPaymentMethod = methodMap[requestedPaymentMethod.toLowerCase()];
    } else if (isLocalTestMode) {
      // Fallback to iDEAL in test mode if no method specified
      selectedPaymentMethod = PaymentMethod.ideal;
    } else {
      // Default to creditcard in production
      selectedPaymentMethod = PaymentMethod.creditcard;
    }

    // Create new subscription with monthly interval
    const subscription = await (mollieClient.customerSubscriptions as any).create(customerId, {
      amount: {
        currency: "EUR",
        value: priceWithBTW.toFixed(2),
      },
      interval: "1 month", // Monthly subscription
      description: `Lynqit ${newPlan} subscription`,
      method: selectedPaymentMethod,
      webhookUrl: webhookUrl,
      redirectUrl: `${baseUrl}/payment/success?email=${encodeURIComponent(email)}&plan=${newPlan}&pageId=${pageId}`,
      metadata: {
        email,
        plan: newPlan,
        pageId,
        userId: user.email,
        isPlanChange: "true",
      },
    });

    // Update page with new plan (will be confirmed by webhook after first payment)
    await updatePage(pageId, {
      subscriptionPlan: newPlan as SubscriptionPlan,
      subscriptionStatus: "expired", // Will be set to "active" by webhook after successful payment
      mollieSubscriptionId: subscription.id,
    });

    // Get checkout URL from subscription links (for first payment)
    const checkoutUrl = subscription._links?.payment?.href || subscription._links?.checkout?.href;
    
    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Failed to get payment checkout URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentUrl: checkoutUrl,
    });
  } catch (error: any) {
    console.error("Subscription change error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while changing subscription" },
      { status: 500 }
    );
  }
}

