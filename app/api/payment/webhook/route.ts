import { NextRequest, NextResponse } from "next/server";
import { getMollieClient } from "@/lib/mollie";
import { getUserByEmail } from "@/lib/users";
import { getPageById, updatePage, deletePage } from "@/lib/lynqit-pages";
import type { SubscriptionPlan } from "@/lib/lynqit-pages";
import { getDiscountCodeById, incrementDiscountCodeUsage } from "@/lib/discount-codes";

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

    const metadata = payment.metadata as { 
      email?: string; 
      plan?: SubscriptionPlan; 
      pageId?: string; 
      subscriptionId?: string;
      discountCodeId?: string;
      appliedDiscount?: string;
    } | undefined;
    const email = metadata?.email;
    const plan = metadata?.plan;
    const pageId = metadata?.pageId;

    if (!email || !plan || !pageId) {
      return NextResponse.json(
        { error: "Invalid payment metadata" },
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

    const page = await getPageById(pageId);
    if (!page || page.userId !== email) {
      return NextResponse.json(
        { error: "Page not found or does not belong to user" },
        { status: 404 }
      );
    }

    // Update page subscription based on payment status
    if (payment.status === "paid") {
      // Payment successful - this is likely the first payment for a subscription
      const now = new Date();
      const subscriptionEndDate = new Date(now);
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1); // 1 month from now

      // Check if this payment is linked to a subscription
      // Mollie payments for subscriptions have a subscriptionId property
      const subscriptionId = (payment as any).subscriptionId || metadata?.subscriptionId || page.mollieSubscriptionId;

      // Increment discount code usage if applied
      if (metadata?.discountCodeId && metadata?.appliedDiscount === "true") {
        try {
          await incrementDiscountCodeUsage(metadata.discountCodeId);
        } catch (error) {
          console.error("Error incrementing discount code usage:", error);
          // Don't fail the webhook if discount code update fails
        }
      }

      if (subscriptionId) {
        // Payment is part of a subscription - activate the subscription
        // The subscription webhook will handle future monthly payments
        await updatePage(pageId, {
          subscriptionPlan: plan,
          subscriptionStatus: "active",
          subscriptionStartDate: now.toISOString(),
          subscriptionEndDate: subscriptionEndDate.toISOString(),
          mollieSubscriptionId: subscriptionId,
        });
      } else {
        // No subscription ID - this might be a legacy payment, activate directly
        await updatePage(pageId, {
          subscriptionPlan: plan,
          subscriptionStatus: "active",
          subscriptionStartDate: now.toISOString(),
          subscriptionEndDate: subscriptionEndDate.toISOString(),
        });
      }
    } else if (payment.status === "failed" || payment.status === "canceled" || payment.status === "expired") {
      // Payment failed - delete the page since payment was not completed
      // Only delete if this was a new page creation (not an upgrade)
      // Check if page was just created (has expired status and paid plan)
      if (page.subscriptionStatus === "expired" && page.subscriptionPlan !== "free") {
        await deletePage(pageId);
        console.log(`Deleted page ${pageId} due to failed payment`);
      } else {
        // For existing pages (upgrades), just revert to free plan
        await updatePage(pageId, {
          subscriptionPlan: "free",
          subscriptionStatus: "expired",
        });
      }
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

