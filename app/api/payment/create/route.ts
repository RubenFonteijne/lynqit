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
    const { email, plan, pageId, paymentMethod, discountCode, slug, password, createAccount } = body;

    // For new registrations (createAccount = true), we don't need existing user/page
    const isNewRegistration = createAccount === true;
    
    if (!email || !plan) {
      return NextResponse.json(
        { error: "Email en plan zijn verplicht" },
        { status: 400 }
      );
    }

    if (plan !== "start" && plan !== "pro") {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'start' or 'pro'" },
        { status: 400 }
      );
    }

    // For new registrations, slug and password are required
    if (isNewRegistration && (!slug || !password)) {
      return NextResponse.json(
        { error: "Slug en password zijn verplicht voor nieuwe registratie" },
        { status: 400 }
      );
    }

    // For existing users, verify user and page exist
    let user = null;
    let page = null;
    
    if (!isNewRegistration) {
      if (!pageId) {
        return NextResponse.json(
          { error: "PageId is verplicht voor bestaande gebruikers" },
          { status: 400 }
        );
      }

      user = await getUserByEmail(email);
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // Verify page exists and belongs to user
      page = await getPageById(pageId);
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
    let customerId: string | undefined = user?.mollieCustomerId;
    
    // Ensure customerId is a valid string (not empty)
    if (customerId && customerId.trim() === "") {
      customerId = undefined;
    }
    
    // Try to use existing customer, but create new one if it fails (mode mismatch)
    if (customerId && user) {
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
      console.log("No existing customer ID, creating new customer for email:", email, "isNewRegistration:", isNewRegistration);
      let customer;
      try {
        // For new registrations, include slug and password in metadata
        const customerMetadata: any = {
          email: email,
        };
        
        if (isNewRegistration) {
          customerMetadata.slug = slug;
          customerMetadata.password = password; // Will be used to create account after payment
          customerMetadata.createAccount = "true";
          console.log("Creating customer for new registration with slug:", slug);
        } else if (user) {
          customerMetadata.userId = user.email;
        }
        
        customer = await mollieClient.customers.create({
          name: email.split("@")[0],
          email: email,
          metadata: customerMetadata,
        });
        
        console.log("Mollie customer created successfully:", customer?.id);
      } catch (customerError: any) {
        console.error("Mollie customer creation error:", customerError);
        const errorMessage = customerError?.message || customerError?.toString() || "Unknown error";
        
        // Check if it's an authentication error
        if (errorMessage.includes("authenticate") || errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
          return NextResponse.json(
            { error: "Mollie authenticatie fout. Controleer of de Mollie API key correct is geconfigureerd in de admin settings." },
            { status: 401 }
          );
        }
        
        return NextResponse.json(
          { error: `Fout bij aanmaken van klant in Mollie: ${errorMessage}` },
          { status: 500 }
        );
      }
      
      if (!customer) {
        console.error("Failed to create customer - customer object is null/undefined");
        return NextResponse.json(
          { error: "Failed to create customer in Mollie: customer object is null" },
          { status: 500 }
        );
      }
      
      if (!customer.id || typeof customer.id !== "string" || customer.id.trim() === "") {
        console.error("Failed to create customer - customer.id is invalid", customer.id, typeof customer.id, "Full customer object:", JSON.stringify(customer, null, 2));
        return NextResponse.json(
          { error: "Failed to create customer in Mollie: customer ID is invalid" },
          { status: 500 }
        );
      }
      
      customerId = customer.id;
      
      console.log("Created Mollie customer with ID:", customerId, "Type:", typeof customerId, "Length:", customerId.length);

      // Save customer ID to user (if user exists)
      if (user) {
        await updateUser(user.email, {
          mollieCustomerId: customerId,
        });
      }
    }

    // Ensure customerId is set and is a string before proceeding
    if (!customerId || typeof customerId !== "string" || customerId.trim() === "") {
      console.error("Customer ID is invalid before creating subscription:", customerId, typeof customerId, "isNewRegistration:", isNewRegistration);
      return NextResponse.json(
        { error: "Customer ID is required but was not found or created. Please try again." },
        { status: 500 }
      );
    }

    // Type guard: ensure customerId is definitely a string at this point
    const finalCustomerId: string = customerId;

    // Create monthly subscription (not a one-time payment)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const isLocalhost = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1") || baseUrl.includes("0.0.0.0");
    
    // Validate base URL for production
    if (!isLocalhost && (!baseUrl.startsWith("https://") || baseUrl === "http://localhost:3000")) {
      console.warn("WARNING: NEXT_PUBLIC_BASE_URL is not set correctly for production. Using:", baseUrl);
      // Return error if base URL is not HTTPS in production
      if (process.env.NODE_ENV === "production" && !baseUrl.startsWith("https://")) {
        return NextResponse.json(
          { error: "NEXT_PUBLIC_BASE_URL moet een HTTPS URL zijn in productie. Controleer je environment variables." },
          { status: 500 }
        );
      }
    }
    
    // Only set webhook URL if not localhost (Mollie can't reach localhost)
    // For local development, use a tunneling service like ngrok or skip webhook
    const webhookUrl = isLocalhost ? undefined : `${baseUrl}/api/subscription/webhook`;
    
    // Validate redirect URL - must be HTTPS in production
    const redirectUrl = `${baseUrl}/payment/success?email=${encodeURIComponent(email)}&plan=${plan}&pageId=${pageId}`;
    
    // Log webhook URL for debugging
    if (webhookUrl) {
      console.log("Webhook URL:", webhookUrl);
      console.log("Redirect URL:", redirectUrl);
    }
    
    if (isLocalhost) {
      console.warn("WARNING: Running in localhost mode. Webhook will not be set. Mollie may show 'offline' status.");
      console.warn("TIP: Voor development, gebruik ngrok of een andere tunneling service en zet NEXT_PUBLIC_BASE_URL naar de ngrok URL.");
    } else {
      console.log("INFO: Using production webhook URL:", webhookUrl);
      console.log("INFO: Test webhook reachability at:", `${baseUrl}/api/subscription/webhook/test`);
    }
    
    // Determine payment method: use provided method or default to creditcard
    // For test mode, allow iDEAL as fallback
    const isLocalTestMode = isLocalhost || process.env.NODE_ENV === "development";
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
    
    if (paymentMethod && methodMap[paymentMethod.toLowerCase()]) {
      selectedPaymentMethod = methodMap[paymentMethod.toLowerCase()];
    } else if (isLocalTestMode) {
      // Fallback to iDEAL in test mode if no method specified
      selectedPaymentMethod = PaymentMethod.ideal;
    } else {
      // Default to creditcard in production
      selectedPaymentMethod = PaymentMethod.creditcard;
    }
    
    console.log("Creating subscription with customerId:", finalCustomerId, "Type:", typeof finalCustomerId);

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
    let subscription;
    try {
      subscription = await (mollieClient.customerSubscriptions as any).create(finalCustomerId, {
        amount: {
          currency: "EUR",
          value: subscriptionPriceWithBTW.toFixed(2),
        },
        interval: "1 month", // Monthly subscription
        description: `Lynqit ${plan} subscription`,
        method: selectedPaymentMethod,
        webhookUrl: webhookUrl,
        redirectUrl: redirectUrl,
        metadata: {
          email,
          plan,
          pageId: pageId || undefined,
          userId: user?.email || email,
          slug: isNewRegistration ? slug : undefined,
          password: isNewRegistration ? password : undefined,
          createAccount: isNewRegistration ? "true" : undefined,
          discountCodeId: discountCodeId || undefined,
          appliedDiscount: appliedDiscount ? "true" : undefined,
          recurringDiscount: recurringDiscountApplied ? "true" : undefined,
          firstPaymentPrice: appliedDiscount ? firstPaymentPriceWithBTW.toFixed(2) : undefined,
        },
      });
    } catch (subscriptionError: any) {
      console.error("Mollie subscription creation error:", subscriptionError);
      const errorMessage = subscriptionError?.message || subscriptionError?.toString() || "Unknown error";
      
      // Check if it's an authentication error
      if (errorMessage.includes("authenticate") || errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
        return NextResponse.json(
          { error: "Mollie authenticatie fout. Controleer of de Mollie API key correct is geconfigureerd in de admin settings." },
          { status: 401 }
        );
      }
      
      // Check if it's a payment method error
      if (errorMessage.includes("method") || errorMessage.includes("not available")) {
        return NextResponse.json(
          { error: `Betaalmethode ${selectedPaymentMethod} is niet beschikbaar. Probeer een andere betaalmethode.` },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: `Fout bij aanmaken van abonnement: ${errorMessage}` },
        { status: 500 }
      );
    }

    // Update page with pending subscription info (only if page exists)
    // For new registrations, page will be created in webhook after payment
    // Subscription will be confirmed by webhook after first payment
    // Don't set status to "active" yet - wait for successful payment
    // Discount code usage will be incremented in the payment webhook after successful payment
    if (pageId && page) {
      await updatePage(pageId, {
        subscriptionPlan: plan as SubscriptionPlan,
        subscriptionStatus: "expired", // Will be set to "active" by webhook after successful payment
        mollieSubscriptionId: subscription.id,
      });
    }

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

