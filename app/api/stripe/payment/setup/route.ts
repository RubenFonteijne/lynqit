import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getUserByEmail, updateUser } from "@/lib/users";
import { getPageById } from "@/lib/lynqit-pages";
import { validateDiscountCode } from "@/lib/discount-codes";
import { SUBSCRIPTION_PRICES, calculatePriceWithBTW } from "@/lib/pricing";
import { getStripePublishableKey } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, plan, pageId, priceId, paymentMethod, discountCode, slug, password, createAccount } = body;

    const isNewRegistration = createAccount === true;
    
    if (!email || !plan) {
      return NextResponse.json(
        { error: "Email en plan zijn verplicht" },
        { status: 400 }
      );
    }

    if (!plan || typeof plan !== "string") {
      return NextResponse.json(
        { error: "Plan is required" },
        { status: 400 }
      );
    }

    if (isNewRegistration && (!slug || !password)) {
      return NextResponse.json(
        { error: "Slug en password zijn verplicht voor nieuwe registratie" },
        { status: 400 }
      );
    }

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

    // Validate discount code if provided and try to find Stripe coupon
    let stripeCouponId: string | undefined;
    let stripePromotionCodeId: string | undefined;
    let discountCodeId: string | undefined;
    
    if (discountCode) {
      const stripe = await getStripeClient();
      const codeToSearch = discountCode.trim().toUpperCase();
      
      try {
        const promotionCodes = await stripe.promotionCodes.list({
          active: true,
          limit: 100,
        });
        
        const matchingPromoCode = promotionCodes.data.find(pc => 
          pc.code.toUpperCase() === codeToSearch
        );
        
        if (matchingPromoCode) {
          stripeCouponId = matchingPromoCode.coupon.id;
          stripePromotionCodeId = matchingPromoCode.id;
        } else {
          const coupons = await stripe.coupons.list({
            limit: 100,
          });
          const matchingCoupon = coupons.data.find(c => 
            c.id.toUpperCase() === codeToSearch || 
            c.name?.toUpperCase() === codeToSearch
          );
          if (matchingCoupon) {
            stripeCouponId = matchingCoupon.id;
          }
        }
      } catch (error) {
        console.error("Error looking up Stripe coupon:", error);
      }
      
      if (plan === "start" || plan === "pro") {
        try {
          const validation = await validateDiscountCode(discountCode, plan as "start" | "pro");
          if (validation.valid && validation.discountCode) {
            discountCodeId = validation.discountCode.id;
          }
        } catch (error) {
          console.log("Discount code not found in database, but checking Stripe...");
        }
      }
    }

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
      
      if (user) {
        await updateUser(user.email, {
          stripeCustomerId: customerId,
        });
      }
    }

    // Use provided priceId if available
    let finalPriceId: string;
    
    if (priceId && typeof priceId === 'string') {
      try {
        const price = await stripe.prices.retrieve(priceId);
        if (!price.active) {
          throw new Error("Price is not active");
        }
        finalPriceId = price.id;
      } catch (error) {
        console.error("Invalid priceId provided:", error);
        return NextResponse.json(
          { error: "Invalid price ID" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Price ID is required" },
        { status: 400 }
      );
    }

    // Create subscription with payment_behavior: 'default_incomplete'
    // This allows us to collect payment method first, then confirm
    const subscriptionData: any = {
      customer: customerId,
      items: [{
        price: finalPriceId,
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: [paymentMethod || 'card'],
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
        discountCode: discountCode || undefined,
        discountCodeId: discountCodeId || undefined,
      },
    };

    // Apply coupon if available
    if (stripeCouponId) {
      subscriptionData.coupon = stripeCouponId;
    }

    const subscription = await stripe.subscriptions.create(subscriptionData);

    // Get the latest invoice and its payment intent
    const invoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);
    const paymentIntentId = invoice.payment_intent;

    if (!paymentIntentId || typeof paymentIntentId !== 'string') {
      return NextResponse.json(
        { error: "Failed to create payment intent" },
        { status: 500 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Get publishable key
    const publishableKey = await getStripePublishableKey();

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      subscriptionId: subscription.id,
      publishableKey: publishableKey,
    });
  } catch (error: any) {
    console.error("Stripe payment setup error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while setting up payment" },
      { status: 500 }
    );
  }
}

