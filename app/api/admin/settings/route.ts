import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/settings";

// GET - Get settings
export async function GET(request: NextRequest) {
  try {
    const settings = await getSettings();
    
    // Don't return the actual API keys for security, just indicate if they're set
    return NextResponse.json({
      settings: {
        mollieApiKeyTest: settings.mollieApiKeyTest ? "***" + settings.mollieApiKeyTest.slice(-4) : "",
        mollieApiKeyLive: settings.mollieApiKeyLive ? "***" + settings.mollieApiKeyLive.slice(-4) : "",
        useTestMode: settings.useTestMode ?? true,
        hasTestKey: !!settings.mollieApiKeyTest,
        hasLiveKey: !!settings.mollieApiKeyLive,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching settings" },
      { status: 500 }
    );
  }
}

// POST - Update settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mollieApiKeyTest, mollieApiKeyLive, useTestMode } = body;

    const currentSettings = await getSettings();
    
    const updatedSettings = {
      ...currentSettings,
      mollieApiKeyTest: mollieApiKeyTest || currentSettings.mollieApiKeyTest,
      mollieApiKeyLive: mollieApiKeyLive || currentSettings.mollieApiKeyLive,
      useTestMode: useTestMode !== undefined ? useTestMode : currentSettings.useTestMode ?? true,
    };

    await saveSettings(updatedSettings);

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      settings: {
        mollieApiKeyTest: updatedSettings.mollieApiKeyTest ? "***" + updatedSettings.mollieApiKeyTest.slice(-4) : "",
        mollieApiKeyLive: updatedSettings.mollieApiKeyLive ? "***" + updatedSettings.mollieApiKeyLive.slice(-4) : "",
        useTestMode: updatedSettings.useTestMode,
        hasTestKey: !!updatedSettings.mollieApiKeyTest,
        hasLiveKey: !!updatedSettings.mollieApiKeyLive,
        updatedAt: updatedSettings.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while updating settings" },
      { status: 500 }
    );
  }
}
