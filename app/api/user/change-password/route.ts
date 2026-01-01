import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, updateUser, verifyPassword } from "@/lib/users";
import bcrypt from "bcryptjs";

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

    // Verify current password
    const user = await verifyPassword(email, currentPassword);
    if (!user) {
      return NextResponse.json(
        { error: "Huidig wachtwoord is onjuist" },
        { status: 401 }
      );
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    const updatedUser = updateUser(email, { passwordHash: newPasswordHash });
    
    if (!updatedUser) {
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

