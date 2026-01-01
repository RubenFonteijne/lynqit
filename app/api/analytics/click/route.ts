import { NextRequest, NextResponse } from "next/server";
import { trackClick } from "@/lib/analytics";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId, clickType, targetUrl, userAgent } = body;

    if (!pageId || !clickType) {
      return NextResponse.json(
        { error: "pageId and clickType are required" },
        { status: 400 }
      );
    }

    // Get IP address from request
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "unknown";

    await trackClick(pageId, clickType, targetUrl, userAgent, ip);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking click:", error);
    return NextResponse.json(
      { error: "Failed to track click" },
      { status: 500 }
    );
  }
}

