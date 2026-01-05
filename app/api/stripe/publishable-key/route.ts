import { NextRequest, NextResponse } from "next/server";
import { getStripePublishableKey } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  try {
    const publishableKey = await getStripePublishableKey();
    
    if (!publishableKey) {
      return NextResponse.json(
        { error: "Stripe publishable key not configured" },
        { status: 500 }
      );
    }

    return NextResponse.json({ publishableKey });
  } catch (error: any) {
    console.error("Error fetching Stripe publishable key:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch publishable key" },
      { status: 500 }
    );
  }
}

