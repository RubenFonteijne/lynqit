import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, deleteUser } from "@/lib/users";
import { getPagesByUser, deletePage } from "@/lib/lynqit-pages";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> | { email: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const email = decodeURIComponent(resolvedParams.email);

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Prevent deleting admin account
    if (user.role === "admin") {
      return NextResponse.json(
        { error: "Cannot delete admin account" },
        { status: 403 }
      );
    }

    // Get all pages for this user
    const pages = await getPagesByUser(email);
    
    // Delete all pages belonging to this user
    let deletedPagesCount = 0;
    for (const page of pages) {
      try {
        await deletePage(page.id);
        deletedPagesCount++;
      } catch (error) {
        console.error(`Error deleting page ${page.id}:`, error);
      }
    }

    // Delete the user
    await deleteUser(email);

    return NextResponse.json({
      success: true,
      message: `User ${email} and all associated pages have been deleted`,
      deletedPagesCount,
    });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while deleting user" },
      { status: 500 }
    );
  }
}

