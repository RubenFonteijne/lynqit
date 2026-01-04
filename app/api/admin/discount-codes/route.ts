import { NextRequest, NextResponse } from "next/server";
import { getAllDiscountCodes, createDiscountCode } from "@/lib/discount-codes";
import { isAdminUserAsync } from "@/lib/users";
import type { CreateDiscountCodeInput } from "@/lib/discount-codes";

// GET - Get all discount codes
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const isAdmin = await isAdminUserAsync(userId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const discountCodes = await getAllDiscountCodes();
    return NextResponse.json({ discountCodes });
  } catch (error: any) {
    console.error("Error fetching discount codes:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while fetching discount codes" },
      { status: 500 }
    );
  }
}

// POST - Create a new discount code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...discountCodeData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const isAdmin = await isAdminUserAsync(userId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    if (!discountCodeData.code || !discountCodeData.discountType || discountCodeData.discountValue === undefined) {
      return NextResponse.json(
        { error: "Code, discountType, and discountValue are required" },
        { status: 400 }
      );
    }

    const discountCode = await createDiscountCode(discountCodeData as CreateDiscountCodeInput);
    return NextResponse.json({ discountCode });
  } catch (error: any) {
    console.error("Error creating discount code:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while creating discount code" },
      { status: 400 }
    );
  }
}

