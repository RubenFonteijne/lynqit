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
    
    let subscription;
    let finalCustomerId = customerId;
    
    // If customerId is not provided in webhook, try to get it from database
    if (!finalCustomerId || finalCustomerId.trim() === "") {
      console.log("No customerId in webhook or empty, trying to find it in database via subscriptionId");
      const { getPages } = await import("@/lib/lynqit-pages");
      const pages = await getPages();
      const pageWithSubscription = pages.find((p) => p.mollieSubscriptionId === subscriptionId);
      
      if (pageWithSubscription) {
        const { getUserByEmail } = await import("@/lib/users");
        const user = await getUserByEmail(pageWithSubscription.userId);
        if (user && user.mollieCustomerId && user.mollieCustomerId.trim() !== "") {
          finalCustomerId = user.mollieCustomerId;
          console.log("Found customerId in database:", finalCustomerId);
        } else {
          console.error("User found but no valid mollieCustomerId:", {
            userId: pageWithSubscription.userId,
            hasMollieCustomerId: !!user?.mollieCustomerId,
            mollieCustomerId: user?.mollieCustomerId,
          });
        }
      } else {
        console.error("No page found with subscriptionId:", subscriptionId);
      }
    }
    
    // Validate customerId before using it
    if (!finalCustomerId || typeof finalCustomerId !== "string" || finalCustomerId.trim() === "") {
      console.error("Cannot fetch subscription: customerId is required but not available", {
        subscriptionId,
        customerIdFromWebhook: customerId,
        finalCustomerId,
        finalCustomerIdType: typeof finalCustomerId,
        allFormDataKeys: Object.keys(allFormData),
        allFormData: allFormData,
      });
      return NextResponse.json(
        { 
          error: "Customer ID is required to fetch subscription. It was not provided in the webhook and could not be found in the database.",
          details: {
            subscriptionId,
            receivedFormData: allFormData,
            customerIdFromWebhook: customerId,
            finalCustomerId: finalCustomerId || null,
          }
        },
        { status: 400 }
      );
    }
    
    // Verify customerId format (should start with 'cst_')
    if (!finalCustomerId.startsWith("cst_")) {
      console.error("Invalid customerId format:", finalCustomerId);
      return NextResponse.json(
        { 
          error: "Invalid customer ID format. Expected format: cst_xxxxx",
          details: {
            subscriptionId,
            customerId: finalCustomerId,
          }
        },
        { status: 400 }
      );
    }
    
    // Verify subscriptionId format (should start with 'sub_')
    if (!subscriptionId.startsWith("sub_")) {
      console.error("Invalid subscriptionId format:", subscriptionId);
      return NextResponse.json(
        { 
          error: "Invalid subscription ID format. Expected format: sub_xxxxx",
          details: {
            subscriptionId,
            customerId: finalCustomerId,
          }
        },
        { status: 400 }
      );
    }
    
    try {
      console.log("Fetching subscription with get(customerId, subscriptionId):", { 
        finalCustomerId, 
        subscriptionId,
        customerIdLength: finalCustomerId.length,
        subscriptionIdLength: subscriptionId.length,
      });
      
      // First verify the customer exists (optional but helpful for debugging)
      try {
        const customer = await mollieClient.customers.get(finalCustomerId);
        console.log("Customer verified:", { customerId: customer.id, email: customer.email });
      } catch (customerError: any) {
        console.warn("Customer verification failed (continuing anyway):", customerError.message);
      }
      
      subscription = await (mollieClient.customerSubscriptions as any).get(finalCustomerId, subscriptionId);
      console.log("Successfully fetched subscription:", { 
        subscriptionId, 
        status: subscription?.status,
        customerId: subscription?.customerId,
      });
    } catch (error: any) {
      console.error("Failed to fetch subscription from Mollie:", {
        error: error.message,
        errorType: error.constructor?.name,
        errorField: error.field,
        errorStatus: error.status,
        subscriptionId,
        customerId: finalCustomerId,
        customerIdType: typeof finalCustomerId,
        customerIdLength: finalCustomerId?.length,
        subscriptionIdType: typeof subscriptionId,
        subscriptionIdLength: subscriptionId?.length,
      });
      return NextResponse.json(
        { 
          error: `Failed to fetch subscription: ${error.message || "Unknown error"}`,
          details: {
            subscriptionId,
            customerId: finalCustomerId,
            mollieError: error.message,
            errorField: error.field,
            errorStatus: error.status,
          }
        },
        { status: 500 }
      );
    }
    
    if (!subscription) {
      return NextResponse.json(
        { error: "Failed to fetch subscription from Mollie" },
        { status: 500 }
      );
    }

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

