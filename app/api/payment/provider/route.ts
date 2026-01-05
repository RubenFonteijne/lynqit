import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

// GET - Get current payment provider setting
export async function GET(request: NextRequest) {
  try {
    // Always return Stripe as the payment provider
    return NextResponse.json({
      provider: "stripe",
    });
  } catch (error) {
    console.error("Error fetching payment provider:", error);
    return NextResponse.json(
      { provider: "stripe" },
      { status: 200 }
    );
  }
}

