import { NextRequest, NextResponse } from "next/server";
import {
  createPage,
  getPageBySlug,
} from "@/lib/lynqit-pages";
import { createServerClientFromRequest } from "@/lib/supabase-server";
import { getUserByEmail } from "@/lib/users";

// POST - Create a demo page with Pro plan (admin only)
export async function POST(request: NextRequest) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization');
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");
    
    let userEmail: string | null = null;
    
    // Try to get user from Bearer token first
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7);
      const supabase = createServerClientFromRequest(request);
      
      // Verify the access token and get user
      const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

      if (!userError && user && user.email) {
        userEmail = user.email;
      }
    }
    
    // Fallback: use email from query parameter if token auth failed
    if (!userEmail && email) {
      userEmail = email;
    }
    
    if (!userEmail) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userData = await getUserByEmail(userEmail);
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
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

    // Create page with Pro plan and active status (no payment required)
    const page = await createPage(userEmail, slug, {
      subscriptionPlan: 'pro',
      subscriptionStatus: 'active',
      isDemo: true,
    });

    return NextResponse.json({ page }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating demo page:", error);
    return NextResponse.json(
      { error: error.message || "Er is een fout opgetreden bij het aanmaken van de demo pagina" },
      { status: 400 }
    );
  }
}

