import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/settings";

// GET - Get settings
export async function GET(request: NextRequest) {
  try {
    const settings = await getSettings();
    
    // Return settings (for admin, we return full values for editing)
    return NextResponse.json({
      settings: {
        mollieApiKeyTest: settings.mollieApiKeyTest || "",
        mollieApiKeyLive: settings.mollieApiKeyLive || "",
        stripeSecretKeyTest: settings.stripeSecretKeyTest || "",
        stripeSecretKeyLive: settings.stripeSecretKeyLive || "",
        stripePublishableKeyTest: settings.stripePublishableKeyTest || "",
        stripePublishableKeyLive: settings.stripePublishableKeyLive || "",
        paymentProvider: settings.paymentProvider || "mollie",
        useTestMode: settings.useTestMode ?? true,
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
    const { 
      mollieApiKeyTest, 
      mollieApiKeyLive, 
      stripeSecretKeyTest,
      stripeSecretKeyLive,
      stripePublishableKeyTest,
      stripePublishableKeyLive,
      paymentProvider,
      useTestMode 
    } = body;

    const currentSettings = await getSettings();
    
    const updatedSettings = {
      ...currentSettings,
      mollieApiKeyTest: mollieApiKeyTest !== undefined ? mollieApiKeyTest : currentSettings.mollieApiKeyTest,
      mollieApiKeyLive: mollieApiKeyLive !== undefined ? mollieApiKeyLive : currentSettings.mollieApiKeyLive,
      stripeSecretKeyTest: stripeSecretKeyTest !== undefined ? stripeSecretKeyTest : currentSettings.stripeSecretKeyTest,
      stripeSecretKeyLive: stripeSecretKeyLive !== undefined ? stripeSecretKeyLive : currentSettings.stripeSecretKeyLive,
      stripePublishableKeyTest: stripePublishableKeyTest !== undefined ? stripePublishableKeyTest : currentSettings.stripePublishableKeyTest,
      stripePublishableKeyLive: stripePublishableKeyLive !== undefined ? stripePublishableKeyLive : currentSettings.stripePublishableKeyLive,
      paymentProvider: paymentProvider !== undefined ? paymentProvider : currentSettings.paymentProvider || "mollie",
      useTestMode: useTestMode !== undefined ? useTestMode : currentSettings.useTestMode ?? true,
    };

    await saveSettings(updatedSettings);

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      settings: {
        mollieApiKeyTest: updatedSettings.mollieApiKeyTest || "",
        mollieApiKeyLive: updatedSettings.mollieApiKeyLive || "",
        stripeSecretKeyTest: updatedSettings.stripeSecretKeyTest || "",
        stripeSecretKeyLive: updatedSettings.stripeSecretKeyLive || "",
        stripePublishableKeyTest: updatedSettings.stripePublishableKeyTest || "",
        stripePublishableKeyLive: updatedSettings.stripePublishableKeyLive || "",
        paymentProvider: updatedSettings.paymentProvider || "mollie",
        useTestMode: updatedSettings.useTestMode,
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
