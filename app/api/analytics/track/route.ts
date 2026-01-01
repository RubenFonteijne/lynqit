import { NextRequest, NextResponse } from "next/server";
import { trackPageView } from "@/lib/analytics";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId, referrer, userAgent } = body;

    if (!pageId) {
      return NextResponse.json(
        { error: "pageId is required" },
        { status: 400 }
      );
    }

    // Get IP address from request
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "unknown";

    await trackPageView(pageId, referrer, userAgent, ip);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking pageview:", error);
    return NextResponse.json(
      { error: "Failed to track pageview" },
      { status: 500 }
    );
  }
}

