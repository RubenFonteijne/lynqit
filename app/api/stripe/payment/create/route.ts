import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getUserByEmail, updateUser } from "@/lib/users";
import { getPageById, updatePage, createPage } from "@/lib/lynqit-pages";
import type { SubscriptionPlan } from "@/lib/lynqit-pages";
import { SUBSCRIPTION_PRICES, calculatePriceWithBTW } from "@/lib/pricing";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, plan, pageId, priceId, paymentMethod, slug, password, createAccount } = body;

    // For new registrations (createAccount = true), we don't need existing user/page
    const isNewRegistration = createAccount === true;
    
    if (!email || !plan) {
      return NextResponse.json(
        { error: "Email en plan zijn verplicht" },
        { status: 400 }
      );
    }

    // Plan can be "start", "pro", or any other plan name from Stripe products
    // We'll accept any plan name, not just "start" or "pro"
    if (!plan || typeof plan !== "string") {
      return NextResponse.json(
        { error: "Plan is required" },
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
          { error: "Page ID is required for existing user updates" },
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
      page = await getPageById(pageId);
      if (!page) {
        return NextResponse.json(
          { error: "Page not found" },
          { status: 404 }
        );
      }
    }

    // Discount codes have been removed - no validation needed

    const stripe = await getStripeClient();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
    // Create or get customer
    let customerId: string | undefined = user?.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email.toLowerCase(),
        name: email.split("@")[0],
        metadata: {
          email: email,
          ...(isNewRegistration && { slug, password, createAccount: "true" }),
        },
      });
      
      customerId = customer.id;
      
      // Save customer ID to user (if user exists)
      if (user) {
        await updateUser(user.email, {
          stripeCustomerId: customerId,
        });
      }
    }

    // Use provided priceId if available, otherwise create/get product and price
    let finalPriceId: string | undefined;
    
    if (priceId && typeof priceId === 'string') {
      // Verify the price exists and is active
      try {
        const price = await stripe.prices.retrieve(priceId);
        if (!price.active) {
          throw new Error("Price is not active");
        }
        finalPriceId = price.id;
      } catch (error) {
        console.error("Invalid priceId provided, creating new price:", error);
        // Will create price below
        finalPriceId = undefined as any;
      }
    }
    
    if (!finalPriceId) {
      // Fallback: create or get product and price (for backward compatibility)
      // Use original price without discount - Stripe will apply the coupon
      // Only use SUBSCRIPTION_PRICES if plan is "start" or "pro", otherwise we need priceId
      let basePriceExBTW: number;
      if (plan === "start" || plan === "pro") {
        basePriceExBTW = SUBSCRIPTION_PRICES[plan as "start" | "pro"];
      } else {
        // If plan is not start/pro, we must have priceId - return error
        return NextResponse.json(
          { error: "Price ID is required for this plan" },
          { status: 400 }
        );
      }
      const basePriceWithBTW = calculatePriceWithBTW(basePriceExBTW);
      const amountInCents = Math.round(basePriceWithBTW * 100);
      
      let product = await stripe.products.search({
        query: `name:'Lynqit ${plan}' AND active:'true'`,
        limit: 1,
      });

      let productId: string;
      if (product.data.length > 0) {
        productId = product.data[0].id;
      } else {
        const newProduct = await stripe.products.create({
          name: `Lynqit ${plan} subscription`,
          description: `Monthly subscription for Lynqit ${plan} plan`,
        });
        productId = newProduct.id;
      }

      let price = await stripe.prices.search({
        query: `product:'${productId}' AND active:'true' AND type:'recurring'`,
        limit: 1,
      });

      if (price.data.length > 0 && price.data[0].unit_amount === amountInCents) {
        finalPriceId = price.data[0].id;
      } else {
        const newPrice = await stripe.prices.create({
          product: productId,
          currency: 'eur',
          unit_amount: amountInCents,
          recurring: {
            interval: 'month',
          },
        });
        finalPriceId = newPrice.id;
      }
    }

    // Create checkout session with the price ID
    const checkoutSessionConfig: any = {
      customer: customerId,
      payment_method_types: [paymentMethod],
      line_items: [{
        price: finalPriceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${baseUrl}/payment/success?email=${encodeURIComponent(email)}&plan=${plan}&provider=stripe${pageId ? `&pageId=${pageId}` : ''}`,
      cancel_url: `${baseUrl}/register?email=${encodeURIComponent(email)}&plan=${plan}&provider=stripe${pageId ? `&pageId=${pageId}` : ''}`,
      metadata: {
        email,
        plan,
        pageId: pageId || undefined,
        slug: isNewRegistration ? slug : undefined,
        password: isNewRegistration ? password : undefined,
        createAccount: isNewRegistration ? "true" : undefined,
      },
      subscription_data: {
        metadata: {
          email,
          plan,
          pageId: pageId || undefined,
          userId: user?.email || email,
          slug: isNewRegistration ? slug : undefined,
          password: isNewRegistration ? password : undefined,
          createAccount: isNewRegistration ? "true" : undefined,
        },
      },
    };


    // Instead of creating a checkout session, create a subscription with payment intent
    // This allows us to use Stripe Elements for embedded payment
    const subscriptionData: any = {
      customer: customerId,
      items: [{
        price: finalPriceId,
        quantity: 1,
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: [paymentMethod],
        save_default_payment_method: 'on_subscription',
      },
      metadata: {
        email,
        plan,
        pageId: pageId || undefined,
        userId: user?.email || email,
        slug: isNewRegistration ? slug : undefined,
        password: isNewRegistration ? password : undefined,
        createAccount: isNewRegistration ? "true" : undefined,
      },
    };


    const subscription = await stripe.subscriptions.create(subscriptionData);

    // Get the latest invoice and its payment intent
    const invoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);
    const paymentIntentId = typeof invoice.payment_intent === 'string' 
      ? invoice.payment_intent 
      : invoice.payment_intent?.id || null;

    if (!paymentIntentId || typeof paymentIntentId !== 'string') {
      return NextResponse.json(
        { error: "Failed to create payment intent" },
        { status: 500 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Get publishable key
    const { getStripePublishableKey } = await import("@/lib/stripe");
    const publishableKey = await getStripePublishableKey();

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      subscriptionId: subscription.id,
      publishableKey: publishableKey,
    });
  } catch (error: any) {
    console.error("Stripe payment creation error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while creating payment" },
      { status: 500 }
    );
  }
}

