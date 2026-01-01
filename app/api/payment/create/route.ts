import { NextRequest, NextResponse } from "next/server";
import { getMollieClient, SUBSCRIPTION_PRICES, calculatePriceWithBTW } from "@/lib/mollie";
import { getUserByEmail, updateUser, isAdminUserAsync } from "@/lib/users";
import { getPageById, updatePage } from "@/lib/lynqit-pages";
import type { SubscriptionPlan } from "@/lib/lynqit-pages";
import { SequenceType, PaymentMethod } from "@mollie/api-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, plan, pageId } = body;

    if (!email || !plan || !pageId) {
      return NextResponse.json(
        { error: "Email, plan en pageId zijn verplicht" },
        { status: 400 }
      );
    }

    if (plan !== "start" && plan !== "pro") {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'start' or 'pro'" },
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
    if (page.userId !== email && !(await isAdminUserAsync(email))) {
      return NextResponse.json(
        { error: "Page does not belong to user" },
        { status: 403 }
      );
    }

    const priceExBTW = SUBSCRIPTION_PRICES[plan as keyof typeof SUBSCRIPTION_PRICES];
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

    // Create or get customer
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

    // Create first payment to get mandate for SEPA Direct Debit
    // For SEPA subscriptions, we need to create the first payment to get the mandate
    // The subscription will be created after the first payment is successful (in webhook)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const isLocalhost = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");
    
    // Only set webhook URL if not localhost (Mollie can't reach localhost)
    // For local development, use a tunneling service like ngrok or skip webhook
    const webhookUrl = isLocalhost ? undefined : `${baseUrl}/api/payment/webhook`;
    
    // For test/localhost: use iDEAL or creditcard (which work better in test mode)
    // For production: use directdebit with sequenceType.first for SEPA subscriptions
    const isTestMode = isLocalhost || process.env.NODE_ENV === "development";
    const paymentMethod = isTestMode ? PaymentMethod.ideal : PaymentMethod.directdebit;
    const sequenceType = isTestMode ? undefined : SequenceType.first;
    
    const firstPayment = await mollieClient.payments.create({
      amount: {
        currency: "EUR",
        value: priceWithBTW.toFixed(2),
      },
      description: `Lynqit ${plan} subscription - First payment`,
      customerId: customerId,
      ...(sequenceType && { sequenceType }), // Only include sequenceType if set
      method: paymentMethod,
      redirectUrl: `${baseUrl}/payment/success?email=${encodeURIComponent(email)}&plan=${plan}&pageId=${pageId}`,
      ...(webhookUrl && { webhookUrl }), // Only include webhookUrl if it's set
      metadata: {
        email,
        plan,
        pageId, // Store pageId in metadata
        userId: user.email,
        createSubscription: "true", // Flag to create subscription after payment
        isTestMode: isTestMode.toString(), // Track if this is a test payment
      },
    });

    // Update page with pending subscription info
    // Subscription will be confirmed by webhook after payment
    await updatePage(pageId, {
      subscriptionPlan: plan as SubscriptionPlan,
      subscriptionStatus: "active", // Will be confirmed by webhook after payment
    });

    // Get checkout URL from payment links
    const checkoutUrl = firstPayment._links?.checkout?.href;
    
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
    console.error("Payment creation error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while creating payment" },
      { status: 500 }
    );
  }
}

