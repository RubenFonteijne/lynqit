import { NextRequest, NextResponse } from "next/server";
import { getMollieClient } from "@/lib/mollie";
import { getUserByEmail } from "@/lib/users";
import { getPages, updatePage } from "@/lib/lynqit-pages";
import type { SubscriptionPlan } from "@/lib/lynqit-pages";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
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

    if (!user.mollieCustomerId) {
      return NextResponse.json(
        { error: "User does not have a Mollie customer ID" },
        { status: 400 }
      );
    }

    const mollieClient = await getMollieClient();
    
    // Get all pages for this user
    const pages = await getPages();
    const userPages = pages.filter((p) => p.userId === email && p.mollieSubscriptionId);

    const updatedPages = [];

    // Sync each page's subscription with Mollie
    for (const page of userPages) {
      if (!page.mollieSubscriptionId || !user.mollieCustomerId) continue;

      try {
        // Get subscription from Mollie
        // Based on error analysis: first parameter is subscriptionId, second is customerId
        const subscription = await (mollieClient.customerSubscriptions as any).get(
          page.mollieSubscriptionId,
          user.mollieCustomerId
        );

        // Update page with latest subscription data
        if (subscription.status === "active") {
          const now = new Date();
          const subscriptionEndDate = subscription.nextPaymentDate
            ? new Date(subscription.nextPaymentDate)
            : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

          await updatePage(page.id, {
            subscriptionStatus: "active",
            subscriptionStartDate: subscription.startDate
              ? new Date(subscription.startDate).toISOString()
              : page.subscriptionStartDate || now.toISOString(),
            subscriptionEndDate: subscriptionEndDate.toISOString(),
          });

          updatedPages.push({
            pageId: page.id,
            subscriptionStartDate: subscription.startDate
              ? new Date(subscription.startDate).toISOString()
              : page.subscriptionStartDate || now.toISOString(),
            subscriptionEndDate: subscriptionEndDate.toISOString(),
            status: subscription.status,
          });
        } else if (subscription.status === "canceled" || subscription.status === "suspended") {
          // Subscription is cancelled or suspended
          await updatePage(page.id, {
            subscriptionStatus: "expired",
          });

          updatedPages.push({
            pageId: page.id,
            status: subscription.status,
          });
        }
      } catch (error: any) {
        // If subscription not found in Mollie, skip it
        if (error.message?.includes("not found")) {
          console.log(`Subscription ${page.mollieSubscriptionId} not found in Mollie for page ${page.id}`);
          continue;
        }
        console.error(`Error syncing subscription for page ${page.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      updatedPages,
    });
  } catch (error: any) {
    console.error("Subscription sync error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while syncing subscriptions" },
      { status: 500 }
    );
  }
}

