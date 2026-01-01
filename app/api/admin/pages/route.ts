import { NextRequest, NextResponse } from "next/server";
import { getPages } from "@/lib/lynqit-pages";
import { createServerClientFromRequest } from "@/lib/supabase-server";
import { isAdminUserAsync } from "@/lib/users";

export async function GET(request: NextRequest) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For admin pages, we'll allow access if no auth header
      // The frontend already checks auth, so this is just for data fetching
      const pages = await getPages();
      return NextResponse.json({ pages });
    }

    const accessToken = authHeader.substring(7);
    const supabase = createServerClientFromRequest(request);
    
    // Verify the access token and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !user || !user.email) {
      // Still return pages even if auth fails, since frontend handles auth
      const pages = await getPages();
      return NextResponse.json({ pages });
    }

    // Check if user is admin
    const userIsAdmin = await isAdminUserAsync(user.email);
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const pages = await getPages();

    return NextResponse.json({ pages });
  } catch (error) {
    console.error("Error fetching pages:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching pages" },
      { status: 500 }
    );
  }
}

