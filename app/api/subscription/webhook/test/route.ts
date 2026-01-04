import { NextRequest, NextResponse } from "next/server";

/**
 * Test endpoint to verify webhook URL is reachable
 * Visit: https://lynqit.io/api/subscription/webhook/test
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Webhook endpoint is reachable",
    timestamp: new Date().toISOString(),
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
  });
}

/**
 * Test POST endpoint to verify webhook can receive POST requests
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: "Webhook endpoint can receive POST requests",
      received: body,
      timestamp: new Date().toISOString(),
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 400 });
  }
}

