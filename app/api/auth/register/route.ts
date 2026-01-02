import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getUserByEmail } from "@/lib/users";
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

    // Check if user already exists
    const existingUser = await getUserByEmail(email.toLowerCase());
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Use anon key for signUp (this automatically sends confirmation emails)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Missing Supabase configuration" },
        { status: 500 }
      );
    }

    // Create a client with anon key for signUp (this triggers confirmation email automatically)
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Determine redirect URL - use production URL if available, otherwise localhost
    // IMPORTANT: Also set Site URL in Supabase Dashboard → Authentication → URL Configuration → Site URL to https://lynqit.io
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    (process.env.NODE_ENV === 'production' ? 'https://lynqit.io' : 'http://localhost:3000');
    
    // Log the base URL for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('Using base URL for email redirect:', baseUrl);
    }
    
    // Sign up with anon key (this automatically sends confirmation email when email confirmation is enabled)
    // Note: Supabase uses the Site URL from Dashboard settings, but emailRedirectTo can override it if whitelisted
    const { data: authData, error: authError } = await supabaseAnon.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${baseUrl}/account-confirmed`,
      },
    });

    if (authError || !authData.user) {
      if (authError?.message?.includes("already registered") || authError?.message?.includes("already exists")) {
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
    // Use the auth user ID to link the user record
    const supabaseAdmin = createServerClient();
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id, // Use the auth user ID
        email: email.toLowerCase(),
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (createError) {
      console.error("Error creating user in database:", createError);
      throw new Error(`Failed to create user in database: ${createError.message}`);
    }

    const user = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role as 'admin' | 'user',
      mollieCustomerId: newUser.mollie_customer_id,
      companyName: newUser.company_name,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      vatNumber: newUser.vat_number,
      phoneNumber: newUser.phone_number,
      createdAt: newUser.created_at,
      updatedAt: newUser.updated_at,
    };

    // Create page if slug is provided
    let page = null;
    if (slug && slug.trim()) {
      try {
        const cleanedSlug = slug.trim().toLowerCase().replace(/^-+|-+$/g, "");
        
        if (cleanedSlug && /^[a-z0-9-]+$/.test(cleanedSlug)) {
          page = await createPage(email, cleanedSlug);
        }
      } catch (pageError: any) {
        console.error("Error creating page during registration:", pageError);
        // Continue with registration even if page creation fails
      }
    }

    // Return user info
    // Note: session will be null if email confirmation is required
    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        role: user.role,
        id: user.id,
      },
      session: authData.session,
      // Include access token if available (for immediate use if email confirmation is disabled)
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
      { 
        error: error.message || "An error occurred during registration",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
