import { NextRequest, NextResponse } from "next/server";
import { getPageById, updatePage, getPageBySlug, deletePage } from "@/lib/lynqit-pages";
import { isAdminUserAsync } from "@/lib/users";

// PUT - Update page slug and title (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const body = await request.json();
    const { userId, slug, title, newUserId } = body;

    // Check if userId is provided (from authenticated user)
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify user is admin
    const isAdmin = await isAdminUserAsync(userId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get the page
    const page = await getPageById(resolvedParams.id);
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // If slug is being changed, check if new slug is available
    if (slug && slug !== page.slug) {
      // Validate slug format
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return NextResponse.json(
          { error: "Slug mag alleen kleine letters, cijfers en streepjes bevatten" },
          { status: 400 }
        );
      }

      const existingPage = await getPageBySlug(slug);
      if (existingPage && existingPage.id !== page.id) {
        return NextResponse.json(
          { error: "Deze URL is al bezet. Kies een andere URL." },
          { status: 400 }
        );
      }
    }

    // Update the page
    const updates: Partial<typeof page> = {};
    if (slug !== undefined) {
      updates.slug = slug;
    }
    if (title !== undefined) {
      updates.title = title;
    }
    if (newUserId !== undefined) {
      updates.userId = newUserId; // Email of the new user
    }

    // Allow userId update for admin operations
    const updatedPage = await updatePage(resolvedParams.id, updates, true);
    return NextResponse.json({ page: updatedPage });
  } catch (error: any) {
    console.error("Error updating page:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while updating the page" },
      { status: 400 }
    );
  }
}

// DELETE - Delete a page (admin only)
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

    // Verify user is admin
    const isAdmin = await isAdminUserAsync(userId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get the page before deleting
    const page = await getPageById(resolvedParams.id);
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
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

