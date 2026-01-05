import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getUserByEmail, updateUser } from "@/lib/users";
import { getPageById, updatePage, createPage } from "@/lib/lynqit-pages";
import type { SubscriptionPlan } from "@/lib/lynqit-pages";
import { validateDiscountCode } from "@/lib/discount-codes";
import { SUBSCRIPTION_PRICES, calculatePriceWithBTW, calculatePriceWithDiscount } from "@/lib/pricing";

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

    // Calculate price with discount
    let finalPriceExBTW: number = SUBSCRIPTION_PRICES[plan as "start" | "pro"];
    let discountCodeId: string | undefined;
    let appliedDiscount = false;

    if (discountCode) {
      const validation = await validateDiscountCode(discountCode, plan as "start" | "pro");
      if (validation.valid && validation.discountCode) {
        discountCodeId = validation.discountCode.id;
        
        if (validation.discountCode.discountType === "first_payment") {
          finalPriceExBTW = calculatePriceWithDiscount(
            finalPriceExBTW,
            validation.discountCode.discountValue,
            validation.discountCode.isPercentage
          );
          appliedDiscount = true;
        }
      } else {
        return NextResponse.json(
          { error: validation.error || "Ongeldige kortingscode" },
          { status: 400 }
        );
      }
    }

    const priceWithBTW = calculatePriceWithBTW(finalPriceExBTW);

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

    // Create Stripe subscription
    // Stripe uses cents, so multiply by 100
    const amountInCents = Math.round(priceWithBTW * 100);
    
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Lynqit ${plan} subscription`,
            description: `Monthly subscription for Lynqit ${plan} plan`,
          },
          recurring: {
            interval: 'month',
          },
          unit_amount: amountInCents,
        },
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
        discountCodeId: discountCodeId || undefined,
        appliedDiscount: appliedDiscount ? "true" : undefined,
      },
    });

    // Create payment intent for first payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      customer: customerId,
      payment_method_types: [paymentMethod],
      metadata: {
        email,
        plan,
        subscriptionId: subscription.id,
        pageId: pageId || undefined,
        slug: isNewRegistration ? slug : undefined,
        createAccount: isNewRegistration ? "true" : undefined,
      },
    });

    // Update page if it exists (for upgrades)
    if (pageId && page) {
      await updatePage(pageId, {
        subscriptionPlan: plan as SubscriptionPlan,
        subscriptionStatus: "expired", // Will be set to "active" by webhook after successful payment
        stripeSubscriptionId: subscription.id,
      });
    }

    // Get checkout URL
    // For Stripe, we use the subscription's latest_invoice.payment_intent.client_secret
    // or create a checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: [paymentMethod],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Lynqit ${plan} subscription`,
            description: `Monthly subscription for Lynqit ${plan} plan`,
          },
          recurring: {
            interval: 'month',
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${baseUrl}/payment/success?email=${encodeURIComponent(email)}&plan=${plan}${pageId ? `&pageId=${pageId}` : ''}`,
      cancel_url: `${baseUrl}/register?error=payment_cancelled`,
      metadata: {
        email,
        plan,
        pageId: pageId || undefined,
        slug: isNewRegistration ? slug : undefined,
        password: isNewRegistration ? password : undefined,
        createAccount: isNewRegistration ? "true" : undefined,
        discountCodeId: discountCodeId || undefined,
        appliedDiscount: appliedDiscount ? "true" : undefined,
      },
    });

    if (!checkoutSession.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentUrl: checkoutSession.url,
      subscriptionId: subscription.id,
    });
  } catch (error: any) {
    console.error("Stripe payment creation error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while creating payment" },
      { status: 500 }
    );
  }
}

