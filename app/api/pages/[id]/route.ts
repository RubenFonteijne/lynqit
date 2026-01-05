import { NextRequest, NextResponse } from "next/server";
import {
  getPageById,
  updatePage,
  deletePage,
  userOwnsPage,
} from "@/lib/lynqit-pages";
import { isAdminUserAsync } from "@/lib/users";

// GET - Get a specific page (requires authentication and ownership)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    
    // Check if userId is provided (from authenticated user)
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const page = await getPageById(resolvedParams.id);

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Check if user owns this page or is admin
    if (page.userId !== userId && !(await isAdminUserAsync(userId))) {
      return NextResponse.json(
        { error: "You don't have permission to access this page" },
        { status: 403 }
      );
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error("Error fetching page:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the page" },
      { status: 500 }
    );
  }
}

// PUT - Update a page (requires authentication and ownership)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const body = await request.json();
    const { userId, ...updates } = body;

    // Check if userId is provided (from authenticated user)
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify user owns this page
    if (!(await userOwnsPage(userId, resolvedParams.id))) {
      return NextResponse.json(
        { error: "You don't have permission to update this page" },
        { status: 403 }
      );
    }

    const page = await updatePage(resolvedParams.id, updates);
    return NextResponse.json({ page });
  } catch (error: any) {
    console.error("Error updating page:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while updating the page" },
      { status: 400 }
    );
  }
}

// DELETE - Delete a page (requires authentication and ownership)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    // Check if userId is provided (from authenticated user)
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify user owns this page
    if (!(await userOwnsPage(userId, resolvedParams.id))) {
      return NextResponse.json(
        { error: "You don't have permission to delete this page" },
        { status: 403 }
      );
    }

    // Get the page before deleting
    const page = await getPageById(resolvedParams.id);
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // If page has a paid subscription, mark subscription as cancelled
    // Note: The actual Stripe subscription cancellation should be done manually or via webhook
    // The page will be deleted, but the subscription will remain active until manually cancelled
    if (page.stripeSubscriptionId && page.subscriptionPlan && page.subscriptionPlan !== "free") {
      // Mark subscription as cancelled in our system
      // The actual Stripe subscription should be cancelled separately
      console.log(`Page ${page.id} with subscription ${page.stripeSubscriptionId} is being deleted. Subscription should be cancelled manually in Stripe.`);
    }

    // Delete the page
    await deletePage(resolvedParams.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting page:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while deleting the page" },
      { status: 400 }
    );
  }
}
