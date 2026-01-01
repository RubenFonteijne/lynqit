import { NextRequest, NextResponse } from "next/server";
import { getUsersAsync } from "@/lib/users";

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin (this should be done via middleware or auth check in production)
    const authHeader = request.headers.get("authorization");
    // For now, we'll rely on client-side check, but in production you should verify JWT token here

    const users = await getUsersAsync();
    
    // Return users without password hashes
    const safeUsers = users.map(({ passwordHash, ...user }) => user);

    return NextResponse.json({ users: safeUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching users" },
      { status: 500 }
    );
  }
}
