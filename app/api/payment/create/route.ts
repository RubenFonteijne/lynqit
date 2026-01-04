import { NextRequest, NextResponse } from "next/server";
import { getMollieClient, SUBSCRIPTION_PRICES, calculatePriceWithBTW } from "@/lib/mollie";
import { getUserByEmail, updateUser, isAdminUserAsync } from "@/lib/users";
import { getPageById, updatePage } from "@/lib/lynqit-pages";
import type { SubscriptionPlan } from "@/lib/lynqit-pages";
import { PaymentMethod } from "@mollie/api-client";
import { validateDiscountCode } from "@/lib/discount-codes";
import { calculatePriceWithDiscount } from "@/lib/pricing";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, plan, pageId, paymentMethod, discountCode } = body;

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

    // Validate and apply discount code if provided
    let finalPriceExBTW: number = SUBSCRIPTION_PRICES[plan as keyof typeof SUBSCRIPTION_PRICES];
    let discountCodeId: string | undefined;
    let appliedDiscount = false;
    let recurringDiscountApplied = false;

    if (discountCode) {
      const validation = await validateDiscountCode(discountCode, plan as "start" | "pro");
      if (validation.valid && validation.discountCode) {
        discountCodeId = validation.discountCode.id;
        
        // Apply discount based on type
        if (validation.discountCode.discountType === "first_payment") {
          // Only apply to first payment
          finalPriceExBTW = calculatePriceWithDiscount(
            finalPriceExBTW,
            validation.discountCode.discountValue,
            validation.discountCode.isPercentage
          );
          appliedDiscount = true;
        } else if (validation.discountCode.discountType === "recurring") {
          // Apply to subscription price (all payments)
          finalPriceExBTW = calculatePriceWithDiscount(
            finalPriceExBTW,
            validation.discountCode.discountValue,
            validation.discountCode.isPercentage
          );
          recurringDiscountApplied = true;
        }
      } else {
        return NextResponse.json(
          { error: validation.error || "Ongeldige kortingscode" },
          { status: 400 }
        );
      }
    }

    const priceWithBTW = calculatePriceWithBTW(finalPriceExBTW);

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

    // Create monthly subscription (not a one-time payment)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const isLocalhost = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");
    
    // Only set webhook URL if not localhost (Mollie can't reach localhost)
    // For local development, use a tunneling service like ngrok or skip webhook
    const webhookUrl = isLocalhost ? undefined : `${baseUrl}/api/subscription/webhook`;
    
    // Determine payment method: use provided method or default to creditcard
    // For test mode, allow iDEAL as fallback
    const isLocalTestMode = isLocalhost || process.env.NODE_ENV === "development";
    let selectedPaymentMethod: PaymentMethod;
    
    if (paymentMethod === "paypal") {
      selectedPaymentMethod = PaymentMethod.paypal;
    } else if (paymentMethod === "creditcard") {
      selectedPaymentMethod = PaymentMethod.creditcard;
    } else if (isLocalTestMode) {
      // Fallback to iDEAL in test mode if no method specified
      selectedPaymentMethod = PaymentMethod.ideal;
    } else {
      // Default to creditcard in production
      selectedPaymentMethod = PaymentMethod.creditcard;
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

    // For first payment only discounts, we need to handle it differently
    // Mollie subscriptions have a fixed price, so for first_payment discounts,
    // we'll use the discounted price for the subscription but note it in metadata
    // For recurring discounts, the subscription price is already adjusted
    
    // Determine the subscription price
    // If it's a first_payment discount, use regular price (discount applied only to first payment)
    // If it's a recurring discount, use discounted price (applies to all payments)
    const subscriptionPriceExBTW: number = recurringDiscountApplied 
      ? finalPriceExBTW 
      : SUBSCRIPTION_PRICES[plan as keyof typeof SUBSCRIPTION_PRICES];
    const subscriptionPriceWithBTW = calculatePriceWithBTW(subscriptionPriceExBTW);
    
    // For first payment, use discounted price if applicable
    const firstPaymentPriceWithBTW = appliedDiscount ? priceWithBTW : subscriptionPriceWithBTW;

    // Create subscription with monthly interval
    // Mollie subscriptions require a first payment to be authorized
    // We'll create the subscription and get the payment URL for the first payment
    const subscription = await (mollieClient.customerSubscriptions as any).create(customerId, {
      amount: {
        currency: "EUR",
        value: subscriptionPriceWithBTW.toFixed(2),
      },
      interval: "1 month", // Monthly subscription
      description: `Lynqit ${plan} subscription`,
      method: selectedPaymentMethod,
      webhookUrl: webhookUrl,
      redirectUrl: `${baseUrl}/payment/success?email=${encodeURIComponent(email)}&plan=${plan}&pageId=${pageId}`,
      metadata: {
        email,
        plan,
        pageId,
        userId: user.email,
        discountCodeId: discountCodeId || undefined,
        appliedDiscount: appliedDiscount ? "true" : undefined,
        recurringDiscount: recurringDiscountApplied ? "true" : undefined,
        firstPaymentPrice: appliedDiscount ? firstPaymentPriceWithBTW.toFixed(2) : undefined,
      },
    });

    // Update page with pending subscription info
    // Subscription will be confirmed by webhook after first payment
    // Don't set status to "active" yet - wait for successful payment
    // Discount code usage will be incremented in the payment webhook after successful payment
    await updatePage(pageId, {
      subscriptionPlan: plan as SubscriptionPlan,
      subscriptionStatus: "expired", // Will be set to "active" by webhook after successful payment
      mollieSubscriptionId: subscription.id,
    });

    // Get checkout URL from subscription links (for first payment)
    // Mollie subscriptions create a payment for the first charge
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
    console.error("Payment creation error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while creating payment" },
      { status: 500 }
    );
  }
}

