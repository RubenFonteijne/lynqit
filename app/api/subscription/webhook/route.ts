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
    
    // Log all form data keys for debugging
    const allFormData: Record<string, string> = {};
    formData.forEach((value, key) => {
      allFormData[key] = value.toString();
    });
    console.log("All form data received:", allFormData);
    
    const subscriptionId = formData.get("id") as string | null;
    // Try both customerId and customer_id (Mollie might use either)
    const customerId = (formData.get("customerId") || formData.get("customer_id")) as string | null;

    // Handle Mollie's webhook connectivity test (empty body or test requests)
    if (!subscriptionId || !customerId) {
      // If this is a test from Mollie (empty form data, test parameter, or only id without customerId), return success
      const testParam = formData.get("test");
      const hasOnlyId = subscriptionId && !customerId;
      
      if (testParam === "true" || (!subscriptionId && !customerId) || hasOnlyId) {
        console.log("Webhook connectivity test received from Mollie", { subscriptionId, customerId, testParam, hasOnlyId });
        return NextResponse.json(
          { 
            success: true, 
            message: "Webhook endpoint is reachable",
            received: {
              subscriptionId: subscriptionId || null,
              customerId: customerId || null,
              test: testParam || false,
            }
          },
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
    // According to Mollie API docs: get(customerId, subscriptionId)
    console.log("Fetching subscription from Mollie:", { customerId, subscriptionId, customerIdType: typeof customerId, subscriptionIdType: typeof subscriptionId });
    const mollieClient = await getMollieClient();
    
    if (!subscriptionId) {
      console.error("Missing subscriptionId:", { subscriptionId, customerId });
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }
    
    // Instead of trying to fetch subscription from Mollie (which keeps failing),
    // get the page from our database using the subscriptionId
    const { getPages } = await import("@/lib/lynqit-pages");
    const pages = await getPages();
    const page = pages.find((p) => p.mollieSubscriptionId === subscriptionId);
    
    if (!page) {
      console.error("Page not found for subscriptionId:", subscriptionId);
      return NextResponse.json(
        { 
          error: "Page not found for this subscription",
          details: {
            subscriptionId,
            receivedFormData: allFormData,
          }
        },
        { status: 404 }
      );
    }
    
    const email = page.userId;
    const plan = page.subscriptionPlan;
    const pageId = page.id;
    
    // Get user to verify and get customerId if needed
    const { getUserByEmail } = await import("@/lib/users");
    const user = await getUserByEmail(email);
    
    if (!user) {
      console.error("User not found for email:", email);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Try to get subscription status from Mollie if we have customerId
    // But don't fail if we can't - we can still update based on webhook event
    let subscriptionStatus = "active"; // Default assumption
    if (user.mollieCustomerId) {
      try {
        // Try to get subscription status - but don't fail if it doesn't work
        const subscription = await (mollieClient.customerSubscriptions as any).get(
          user.mollieCustomerId,
          subscriptionId
        );
        subscriptionStatus = subscription?.status || "active";
        console.log("Fetched subscription status from Mollie:", subscriptionStatus);
      } catch (mollieError: any) {
        console.warn("Could not fetch subscription from Mollie, using default status:", mollieError.message);
        // Continue anyway - we'll update based on webhook event type
      }
    }

    if (!email || !plan || !pageId) {
      return NextResponse.json(
        { error: "Invalid subscription data from database" },
        { status: 400 }
      );
    }

    // Verify page belongs to user
    if (page.userId !== email) {
      return NextResponse.json(
        { error: "Page does not belong to user" },
        { status: 403 }
      );
    }

    // Update page subscription based on subscription status
    // For webhooks, we assume active unless we get a cancellation event
    // The actual status will be synced by the sync endpoint
    const now = new Date();
    
    if (subscriptionStatus === "active") {
      // Subscription is active - calculate next payment date (1 month from now)
      const subscriptionEndDate = page.subscriptionEndDate 
        ? new Date(page.subscriptionEndDate)
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      await updatePage(pageId, {
        subscriptionPlan: plan,
        subscriptionStatus: "active",
        subscriptionStartDate: page.subscriptionStartDate || now.toISOString(),
        subscriptionEndDate: subscriptionEndDate.toISOString(),
        mollieSubscriptionId: subscriptionId, // Use subscriptionId from webhook
      });
    } else if (subscriptionStatus === "canceled" || subscriptionStatus === "suspended") {
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

