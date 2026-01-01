import { NextRequest, NextResponse } from "next/server";
import { getMollieClient, SUBSCRIPTION_PRICES, calculatePriceWithBTW } from "@/lib/mollie";
import { getUserByEmail, isAdminUserAsync, updateUser } from "@/lib/users";
import { getPageById, updatePage } from "@/lib/lynqit-pages";
import type { SubscriptionPlan } from "@/lib/lynqit-pages";
import { SequenceType, PaymentMethod } from "@mollie/api-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, pageId, newPlan } = body;

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
    let customerId = user.mollieCustomerId;
    if (!customerId) {
      const customer = await mollieClient.customers.create({
        name: user.email.split("@")[0],
        email: user.email,
        metadata: {
          userId: user.email,
        },
      });
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

    // Create new payment for the new plan
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const isLocalhost = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");
    const webhookUrl = isLocalhost ? undefined : `${baseUrl}/api/payment/webhook`;
    const isTestMode = isLocalhost || process.env.NODE_ENV === "development";
    const paymentMethod = isTestMode ? PaymentMethod.ideal : PaymentMethod.directdebit;
    
    // Only use sequenceType for SEPA Direct Debit (not for other payment methods)
    const useSequenceType = !isTestMode && paymentMethod === PaymentMethod.directdebit;

    const payment = await mollieClient.payments.create({
      amount: {
        currency: "EUR",
        value: priceWithBTW.toFixed(2),
      },
      description: `Lynqit ${newPlan} subscription - Plan change`,
      customerId: customerId,
      ...(useSequenceType && { sequenceType: SequenceType.first }), // Only include sequenceType for SEPA Direct Debit
      method: paymentMethod,
      redirectUrl: `${baseUrl}/payment/success?email=${encodeURIComponent(email)}&plan=${newPlan}&pageId=${pageId}`,
      ...(webhookUrl && { webhookUrl }),
      metadata: {
        email,
        plan: newPlan,
        pageId,
        userId: user.email,
        createSubscription: "true",
        isTestMode: isTestMode.toString(),
        isPlanChange: "true",
      },
    });

    // Update page with new plan (will be confirmed by webhook)
    await updatePage(pageId, {
      subscriptionPlan: newPlan as SubscriptionPlan,
      subscriptionStatus: "active",
    });

    const checkoutUrl = payment._links?.checkout?.href;
    
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

