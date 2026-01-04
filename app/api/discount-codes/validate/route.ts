import { NextRequest, NextResponse } from "next/server";
import { validateDiscountCode } from "@/lib/discount-codes";

// GET - Validate a discount code
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const plan = searchParams.get("plan") as "start" | "pro" | null;

    if (!code) {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    if (!plan || (plan !== "start" && plan !== "pro")) {
      return NextResponse.json(
        { error: "Valid plan (start or pro) is required" },
        { status: 400 }
      );
    }

    const validation = await validateDiscountCode(code, plan);

    if (!validation.valid) {
      return NextResponse.json({
        valid: false,
        error: validation.error,
      });
    }

    return NextResponse.json({
      valid: true,
      discountCode: validation.discountCode,
    });
  } catch (error: any) {
    console.error("Error validating discount code:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while validating discount code" },
      { status: 500 }
    );
  }
}

