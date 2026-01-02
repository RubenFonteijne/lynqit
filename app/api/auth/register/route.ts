import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { createUser } from "@/lib/users";
import { createPage } from "@/lib/lynqit-pages";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, slug } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
    });

    if (authError || !authData.user) {
      if (authError?.message?.includes("already registered")) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: authError?.message || "An error occurred during registration" },
        { status: 400 }
      );
    }

    // Create user in database (without password, as Supabase Auth handles it)
    const user = await createUser(email, password, "user");

    // Create page if slug is provided (using service role key, so no auth needed)
    let page = null;
    if (slug && slug.trim()) {
      try {
        // Clean up slug
        const cleanedSlug = slug.trim().toLowerCase().replace(/^-+|-+$/g, "");
        
        if (cleanedSlug && /^[a-z0-9-]+$/.test(cleanedSlug)) {
          page = await createPage(email, cleanedSlug);
        }
      } catch (pageError: any) {
        // Log error but don't fail registration if page creation fails
        console.error("Error creating page during registration:", pageError);
        // Continue with registration even if page creation fails
      }
    }

    // Return user info
    // Note: session might be null if email confirmation is required
    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        role: user.role,
        id: user.id,
      },
      session: authData.session,
      // Include access token if available (for immediate use)
      accessToken: authData.session?.access_token || null,
      page: page ? { id: page.id, slug: page.slug } : null,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    if (error.message === "User with this email already exists") {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
