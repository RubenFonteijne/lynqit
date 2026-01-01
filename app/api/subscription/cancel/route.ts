import { NextRequest, NextResponse } from "next/server";
import { getMollieClient } from "@/lib/mollie";
import { getUserByEmail, isAdminUserAsync } from "@/lib/users";
import { getPageById, updatePage } from "@/lib/lynqit-pages";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, pageId } = body;

    if (!email || !pageId) {
      return NextResponse.json(
        { error: "Email en pageId zijn verplicht" },
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

    // Verify page exists and belongs to user
    const page = await getPageById(pageId);
    if (!page) {
      return NextResponse.json(
        { error: "Page not found" },
        { status: 404 }
      );
    }

    // Check if user owns the page or is admin
    const isAdmin = await isAdminUserAsync(email);
    if (page.userId !== email && !isAdmin) {
      return NextResponse.json(
        { error: "Page does not belong to user" },
        { status: 403 }
      );
    }

    // Check if page has a subscription
    if (!page.mollieSubscriptionId || !page.subscriptionPlan || page.subscriptionPlan === "free") {
      return NextResponse.json(
        { error: "Page does not have an active subscription to cancel" },
        { status: 400 }
      );
    }

    let mollieClient;
    try {
      mollieClient = await getMollieClient();
    } catch (error: any) {
      console.error("Failed to get Mollie client:", error);
      return NextResponse.json(
        { error: error.message || "Mollie API key is not configured. Please set it in admin settings." },
        { status: 500 }
      );
    }

    if (!mollieClient || !user.mollieCustomerId) {
      return NextResponse.json(
        { error: "Failed to initialize Mollie client or customer ID not found." },
        { status: 500 }
      );
    }

    // Cancel subscription in Mollie
    try {
      await (mollieClient.customerSubscriptions as any).cancel(
        user.mollieCustomerId!,
        page.mollieSubscriptionId!
      );
    } catch (error: any) {
      // If subscription is already cancelled or doesn't exist, continue
      console.log("Subscription cancellation note:", error.message);
    }

    // Update page to mark subscription as cancelled
    // The subscription will remain active until the end of the billing period
    // We'll keep the plan but mark status as cancelled
    await updatePage(pageId, {
      subscriptionStatus: "cancelled",
      // Keep the plan and dates so user can still use until end of period
    });

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled successfully. The page will remain available until the end of the billing period.",
    });
  } catch (error: any) {
    console.error("Subscription cancellation error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while cancelling subscription" },
      { status: 500 }
    );
  }
}

