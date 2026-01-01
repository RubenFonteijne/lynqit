import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/users";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);
    
    if (user) {
      return NextResponse.json({
        exists: true,
        user: {
          email: user.email,
          role: user.role,
          id: user.id,
        },
      });
    }

    return NextResponse.json({
      exists: false,
    });
  } catch (error) {
    console.error("Check user error:", error);
    return NextResponse.json(
      { error: "An error occurred checking user" },
      { status: 500 }
    );
  }
}
