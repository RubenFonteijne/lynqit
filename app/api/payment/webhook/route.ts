import { NextRequest, NextResponse } from "next/server";
import { getMollieClient } from "@/lib/mollie";
import { getUserByEmail } from "@/lib/users";
import { getPageById, updatePage } from "@/lib/lynqit-pages";
import type { SubscriptionPlan } from "@/lib/lynqit-pages";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const paymentId = body.id;

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    // Get payment from Mollie
    const mollieClient = await getMollieClient();
    const payment = await mollieClient.payments.get(paymentId);

    const email = payment.metadata?.email as string;
    const plan = payment.metadata?.plan as SubscriptionPlan;
    const pageId = payment.metadata?.pageId as string;

    if (!email || !plan || !pageId) {
      return NextResponse.json(
        { error: "Invalid payment metadata" },
        { status: 400 }
      );
    }

    const user = getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const page = getPageById(pageId);
    if (!page || page.userId !== email) {
      return NextResponse.json(
        { error: "Page not found or does not belong to user" },
        { status: 404 }
      );
    }

    // Update page subscription based on payment status
    if (payment.status === "paid") {
      // Payment successful - activate subscription for this page
      const now = new Date();
      const subscriptionEndDate = new Date(now);
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1); // 1 month from now

      const subscriptionId = payment.metadata?.subscriptionId as string | undefined;

      updatePage(pageId, {
        subscriptionPlan: plan,
        subscriptionStatus: "active",
        subscriptionStartDate: now.toISOString(),
        subscriptionEndDate: subscriptionEndDate.toISOString(),
        mollieSubscriptionId: subscriptionId || page.mollieSubscriptionId,
      });
    } else if (payment.status === "failed" || payment.status === "canceled" || payment.status === "expired") {
      // Payment failed - revert page to free plan
      updatePage(pageId, {
        subscriptionPlan: "free",
        subscriptionStatus: "expired",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred processing webhook" },
      { status: 500 }
    );
  }
}

