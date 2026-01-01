import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Email, huidig wachtwoord en nieuw wachtwoord zijn verplicht" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Nieuw wachtwoord moet minimaal 6 tekens lang zijn" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Verify current password by attempting to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: currentPassword,
    });

    if (signInError || !signInData.user) {
      return NextResponse.json(
        { error: "Huidig wachtwoord is onjuist" },
        { status: 401 }
      );
    }

    // Update password using Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      signInData.user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Wachtwoord succesvol gewijzigd",
    });
  } catch (error: any) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred changing password" },
      { status: 500 }
    );
  }
}

