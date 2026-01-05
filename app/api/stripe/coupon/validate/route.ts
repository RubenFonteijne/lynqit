import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { valid: false, error: "Kortingscode is verplicht" },
        { status: 400 }
      );
    }

    const stripe = await getStripeClient();
    const codeToSearch = code.trim().toUpperCase();

    // Try to find the promotion code in Stripe
    try {
      const promotionCodes = await stripe.promotionCodes.list({
        active: true,
        limit: 100,
      });

      // Search for exact match (case-insensitive)
      const matchingPromoCode = promotionCodes.data.find(pc => 
        pc.code.toUpperCase() === codeToSearch
      );

      if (matchingPromoCode) {
        return NextResponse.json({
          valid: true,
          coupon: {
            id: matchingPromoCode.coupon.id,
            promotionCodeId: matchingPromoCode.id,
            name: matchingPromoCode.coupon.name || matchingPromoCode.code,
            percentOff: matchingPromoCode.coupon.percent_off,
            amountOff: matchingPromoCode.coupon.amount_off,
            currency: matchingPromoCode.coupon.currency,
            duration: matchingPromoCode.coupon.duration,
          },
        });
      }

      // If promotion code not found, try to find coupon directly by ID or name
      const coupons = await stripe.coupons.list({
        limit: 100,
      });
      const matchingCoupon = coupons.data.find(c => 
        c.id.toUpperCase() === codeToSearch || 
        c.name?.toUpperCase() === codeToSearch
      );

      if (matchingCoupon) {
        return NextResponse.json({
          valid: true,
          coupon: {
            id: matchingCoupon.id,
            name: matchingCoupon.name || matchingCoupon.id,
            percentOff: matchingCoupon.percent_off,
            amountOff: matchingCoupon.amount_off,
            currency: matchingCoupon.currency,
            duration: matchingCoupon.duration,
          },
        });
      }

      // Code not found in Stripe
      return NextResponse.json({
        valid: false,
        error: "Kortingscode niet gevonden",
      });
    } catch (error: any) {
      console.error("Error validating Stripe coupon:", error);
      return NextResponse.json(
        { valid: false, error: "Fout bij valideren van kortingscode" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in coupon validation:", error);
    return NextResponse.json(
      { valid: false, error: "Fout bij valideren van kortingscode" },
      { status: 500 }
    );
  }
}

