import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

// GET - Get current payment provider setting
export async function GET(request: NextRequest) {
  try {
    const settings = await getSettings();
    
    return NextResponse.json({
      provider: settings.paymentProvider || "mollie", // Default to mollie for backward compatibility
    });
  } catch (error) {
    console.error("Error fetching payment provider:", error);
    return NextResponse.json(
      { provider: "mollie" }, // Default to mollie on error
      { status: 200 }
    );
  }
}

