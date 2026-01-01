import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, updateUser } from "@/lib/users";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, ...updates } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is verplicht" },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Don't allow updating email or passwordHash through this route
    const { email: _, passwordHash: __, ...safeUpdates } = updates;

    const updatedUser = await updateUser(email, safeUpdates);
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    // Return user without passwordHash
    const { passwordHash, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.error("User update error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred updating user" },
      { status: 500 }
    );
  }
}
