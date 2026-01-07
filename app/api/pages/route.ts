import { NextRequest, NextResponse } from "next/server";
import {
  getPagesByUser,
  createPage,
  getPageBySlug,
} from "@/lib/lynqit-pages";
import { createServerClientFromRequest } from "@/lib/supabase-server";

// GET - Get all pages for the current user (requires authentication)
export async function GET(request: NextRequest) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization');
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");
    
    console.log(`[API /api/pages] Request received:`, {
      hasAuthHeader: !!authHeader,
      hasEmailParam: !!email,
      authHeaderPrefix: authHeader?.substring(0, 20) || 'none',
    });
    
    let userEmail: string | null = null;
    
    // Try to get user from Bearer token first
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7);
      const supabase = createServerClientFromRequest(request);
      
      // Verify the access token and get user
      const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

      console.log(`[API /api/pages] Token verification:`, {
        hasUser: !!user,
        hasEmail: !!user?.email,
        userError: userError?.message || null,
      });

      if (!userError && user && user.email) {
        userEmail = user.email;
        console.log(`[API /api/pages] Authenticated via token for: ${userEmail}`);
      }
    }
    
    // Fallback: use email from query parameter if token auth failed
    if (!userEmail && email) {
      userEmail = email;
      console.log(`[API /api/pages] Using email parameter: ${userEmail}`);
    }
    
    if (!userEmail) {
      console.error(`[API /api/pages] No authentication: no token and no email parameter`);
      return NextResponse.json(
        { error: "Authentication required", details: "No valid token or email parameter provided" },
        { status: 401 }
      );
    }

    // Use the existing getPagesByUser function (it's already optimized)
    const pages = await getPagesByUser(userEmail);
    console.log(`[API /api/pages] Fetched ${pages.length} pages for user: ${userEmail}`);
    return NextResponse.json({ pages });
  } catch (error) {
    console.error("[API /api/pages] Error fetching pages:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching pages", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST - Create a new page (requires authentication)
export async function POST(request: NextRequest) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    const supabase = createServerClientFromRequest(request);
    
    // Verify the access token and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !user || !user.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { slug } = body;

    if (!slug) {
      return NextResponse.json(
        { error: "slug is required" },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Slug mag alleen kleine letters, cijfers en streepjes bevatten" },
        { status: 400 }
      );
    }

    // Check if slug already exists before creating
    const existingPage = await getPageBySlug(slug);
    if (existingPage) {
      return NextResponse.json(
        { error: "Deze URL is al bezet. Kies een andere URL." },
        { status: 400 }
      );
    }

    const page = await createPage(user.email, slug);
    return NextResponse.json({ page }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating page:", error);
    return NextResponse.json(
      { error: error.message || "Er is een fout opgetreden bij het aanmaken van de pagina" },
      { status: 400 }
    );
  }
}
