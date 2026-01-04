import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token } = body;

    if (!email || !token) {
      return NextResponse.json(
        { error: "Email and token are required" },
        { status: 400 }
      );
    }

    // Create a server-side client with anon key for OTP verification
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Missing Supabase configuration" },
        { status: 500 }
      );
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the OTP token
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.toLowerCase(),
      token: token.trim(),
      type: 'signup',
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Invalid or expired verification code" },
        { status: 400 }
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: data.session,
      accessToken: data.session.access_token,
    });
  } catch (error: any) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during email verification" },
      { status: 500 }
    );
  }
}

