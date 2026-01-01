import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get the base URL for the redirect
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const redirectTo = `${baseUrl}/reset-password`;

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo,
    });

    if (error) {
      console.error("Password reset error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to send password reset email" },
        { status: 400 }
      );
    }

    // Always return success (for security, don't reveal if email exists)
    return NextResponse.json({
      success: true,
      message: "Als dit email adres bestaat, ontvang je een email met instructies om je wachtwoord opnieuw in te stellen.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred while sending password reset email" },
      { status: 500 }
    );
  }
}

