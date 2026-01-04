import { NextRequest, NextResponse } from "next/server";
import { getMollieClient } from "@/lib/mollie";
import { getUserByEmail } from "@/lib/users";
import { getPages, updatePage } from "@/lib/lynqit-pages";
import type { SubscriptionPlan } from "@/lib/lynqit-pages";

// OPTIONS handler for CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// GET handler for testing/debugging - returns endpoint info
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Subscription webhook endpoint",
    method: "POST only",
    description: "This endpoint accepts POST requests from Mollie for subscription updates",
    testEndpoint: "/api/subscription/webhook/test",
    status: "online",
  }, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Mollie sends webhooks as form-url-encoded (id=sub_..., customerId=cst_...)
    // Read body only once using formData() for App Router
    const formData = await request.formData();
    const subscriptionId = formData.get("id") as string | null;
    const customerId = formData.get("customerId") as string | null;

    // Handle Mollie's webhook connectivity test (empty body or test requests)
    if (!subscriptionId || !customerId) {
      // If this is a test from Mollie (empty body or test data), return success
      if (!body || Object.keys(body).length === 0 || body.test === true) {
        console.log("Webhook connectivity test received from Mollie");
        return NextResponse.json(
          { success: true, message: "Webhook endpoint is reachable" },
          { 
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
      
      return NextResponse.json(
        { error: "Subscription ID and Customer ID are required" },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Get subscription from Mollie
    const mollieClient = await getMollieClient();
    const subscription = await mollieClient.customerSubscriptions.get(customerId, subscriptionId);

    const metadata = subscription.metadata as { email?: string; plan?: SubscriptionPlan; pageId?: string } | undefined;
    const email = metadata?.email;
    const plan = metadata?.plan;
    const pageId = metadata?.pageId;

    if (!email || !plan || !pageId) {
      return NextResponse.json(
        { error: "Invalid subscription metadata" },
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

    // Find page by ID and verify ownership
    const pages = await getPages();
    const page = pages.find((p) => p.id === pageId && p.userId === email);

    if (!page) {
      return NextResponse.json(
        { error: "Page not found or does not belong to user" },
        { status: 404 }
      );
    }

    // Update page subscription based on subscription status
    if (subscription.status === "active") {
      // Subscription is active - calculate next payment date
      const now = new Date();
      // Use nextPaymentDate from subscription if available, otherwise calculate 1 month from now
      const subscriptionEndDate = subscription.nextPaymentDate 
        ? new Date(subscription.nextPaymentDate)
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      await updatePage(pageId, {
        subscriptionPlan: plan,
        subscriptionStatus: "active",
        subscriptionStartDate: subscription.startDate || page.subscriptionStartDate || now.toISOString(),
        subscriptionEndDate: subscriptionEndDate.toISOString(),
        mollieSubscriptionId: subscription.id,
      });
    } else if (subscription.status === "canceled" || subscription.status === "suspended") {
      // Subscription cancelled or suspended - revert to free
      // Only delete page if it was just created (expired status with paid plan)
      if (page.subscriptionStatus === "expired" && page.subscriptionPlan !== "free") {
        const { deletePage } = await import("@/lib/lynqit-pages");
        await deletePage(pageId);
        console.log(`Deleted page ${pageId} due to cancelled subscription`);
      } else {
        // For existing pages, just revert to free plan
        await updatePage(pageId, {
          subscriptionPlan: "free",
          subscriptionStatus: "expired",
          mollieSubscriptionId: undefined,
        });
      }
    }

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error("Subscription webhook error:", error);
    // Always return 200 to Mollie even on errors (to prevent retries of invalid requests)
    // But log the error for debugging
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "An error occurred processing subscription webhook" 
      },
      { 
        status: 200, // Return 200 so Mollie doesn't retry
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

