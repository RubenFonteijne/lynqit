import { NextRequest, NextResponse } from "next/server";
import { getDiscountCodeById, updateDiscountCode, deleteDiscountCode } from "@/lib/discount-codes";
import { isAdminUserAsync } from "@/lib/users";
import type { UpdateDiscountCodeInput } from "@/lib/discount-codes";

// GET - Get a specific discount code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
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

    const discountCode = await getDiscountCodeById(resolvedParams.id);
    if (!discountCode) {
      return NextResponse.json({ error: "Discount code not found" }, { status: 404 });
    }

    return NextResponse.json({ discountCode });
  } catch (error: any) {
    console.error("Error fetching discount code:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while fetching discount code" },
      { status: 500 }
    );
  }
}

// PUT - Update a discount code
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const body = await request.json();
    const { userId, ...updateData } = body;

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

    const discountCode = await updateDiscountCode(resolvedParams.id, updateData as UpdateDiscountCodeInput);
    return NextResponse.json({ discountCode });
  } catch (error: any) {
    console.error("Error updating discount code:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while updating discount code" },
      { status: 400 }
    );
  }
}

// DELETE - Delete a discount code
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
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

    const discountCode = await getDiscountCodeById(resolvedParams.id);
    if (!discountCode) {
      return NextResponse.json({ error: "Discount code not found" }, { status: 404 });
    }

    await deleteDiscountCode(resolvedParams.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting discount code:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while deleting discount code" },
      { status: 400 }
    );
  }
}

