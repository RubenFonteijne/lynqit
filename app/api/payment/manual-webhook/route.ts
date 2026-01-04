import { NextRequest, NextResponse } from "next/server";
import { getMollieClient } from "@/lib/mollie";

/**
 * Development helper: Manually trigger webhook for a payment/subscription
 * This is useful when testing on localhost where Mollie can't reach the webhook
 * 
 * Usage:
 * POST /api/payment/manual-webhook
 * Body: { subscriptionId: "sub_xxx", customerId: "cst_xxx" }
 * 
 * Or for payment webhook:
 * POST /api/payment/manual-webhook
 * Body: { paymentId: "tr_xxx" }
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { subscriptionId, customerId, paymentId } = body;

    if (paymentId) {
      // Trigger payment webhook
      const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/payment/webhook`;
      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: paymentId }),
      });

      const webhookData = await webhookResponse.json();
      return NextResponse.json({
        success: true,
        message: "Payment webhook triggered",
        webhookResponse: webhookData,
      });
    }

    if (subscriptionId && customerId) {
      // Trigger subscription webhook
      // Based on create() signature: create(customerId, data), so get() should be: get(customerId, subscriptionId)
      const mollieClient = await getMollieClient();
      const subscription = await mollieClient.customerSubscriptions.get(customerId, subscriptionId);

      const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/subscription/webhook`;
      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: subscriptionId,
          customerId: customerId,
        }),
      });

      const webhookData = await webhookResponse.json();
      return NextResponse.json({
        success: true,
        message: "Subscription webhook triggered",
        subscription: {
          id: subscription.id,
          status: subscription.status,
          customerId: subscription.customerId,
        },
        webhookResponse: webhookData,
      });
    }

    return NextResponse.json(
      { error: "Either paymentId or both subscriptionId and customerId are required" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Manual webhook error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while triggering webhook" },
      { status: 500 }
    );
  }
}

