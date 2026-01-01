import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, updateUser } from "@/lib/users";
import type { SubscriptionPlan } from "@/lib/lynqit-pages";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, plan } = body;

    if (!email || !plan) {
      return NextResponse.json(
        { error: "Email and plan are required" },
        { status: 400 }
      );
    }

    if (plan !== "free" && plan !== "start" && plan !== "pro") {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Note: Subscription plan is stored on pages, not users
    // This endpoint might not be needed anymore, but keeping it for backward compatibility
    const updatedUser = await updateUser(email, {
      // Users don't have subscriptionPlan, it's on pages
    });

    return NextResponse.json({
      success: true,
      user: updatedUser ? {
        email: updatedUser.email,
      } : null,
    });
  } catch (error: any) {
    console.error("Subscription update error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred updating subscription" },
      { status: 500 }
    );
  }
}

