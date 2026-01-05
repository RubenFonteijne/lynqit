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
    let recurringDiscountApplied = false;

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
        } else if (validation.discountCode.discountType === "recurring") {
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

    // Stripe uses cents, so multiply by 100
    const amountInCents = Math.round(priceWithBTW * 100);
    
    // Create or get product first
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

    // Create or get price for this product
    let price = await stripe.prices.search({
      query: `product:'${productId}' AND active:'true' AND type:'recurring'`,
      limit: 1,
    });

    let priceId: string;
    if (price.data.length > 0 && price.data[0].unit_amount === amountInCents) {
      priceId = price.data[0].id;
    } else {
      const newPrice = await stripe.prices.create({
        product: productId,
        currency: 'eur',
        unit_amount: amountInCents,
        recurring: {
          interval: 'month',
        },
      });
      priceId = newPrice.id;
    }

    // Create checkout session with the price ID
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: [paymentMethod],
      line_items: [{
        price: priceId,
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
        discountCodeId: discountCodeId || undefined,
        appliedDiscount: appliedDiscount ? "true" : undefined,
        recurringDiscount: recurringDiscountApplied ? "true" : undefined,
        firstPaymentPrice: appliedDiscount ? priceWithBTW.toFixed(2) : undefined,
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
          discountCodeId: discountCodeId || undefined,
          appliedDiscount: appliedDiscount ? "true" : undefined,
          recurringDiscount: recurringDiscountApplied ? "true" : undefined,
          firstPaymentPrice: appliedDiscount ? priceWithBTW.toFixed(2) : undefined,
        },
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
    });
  } catch (error: any) {
    console.error("Stripe payment creation error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while creating payment" },
      { status: 500 }
    );
  }
}

