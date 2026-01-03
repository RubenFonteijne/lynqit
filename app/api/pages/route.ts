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

    // Use the existing getPagesByUser function (it's already optimized)
    const pages = await getPagesByUser(user.email);
    return NextResponse.json({ pages });
  } catch (error) {
    console.error("Error fetching pages:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching pages" },
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
