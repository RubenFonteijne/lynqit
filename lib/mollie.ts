import { createMollieClient } from "@mollie/api-client";
import { getActiveMollieApiKey } from "./settings";

// Re-export pricing utilities for convenience
export { SUBSCRIPTION_PRICES, calculatePriceWithBTW } from "./pricing";

// Initialize Mollie client
export async function getMollieClient() {
  try {
    // First try to get from settings, then fall back to environment variable
    const apiKey = await getActiveMollieApiKey();
    
    if (!apiKey) {
      throw new Error("Mollie API key is not set. Please configure it in the admin settings at /admin.");
    }

    const client = createMollieClient({ apiKey });
    
    if (!client) {
      throw new Error("Failed to create Mollie client. Please check your API key.");
    }

    return client;
  } catch (error: any) {
    console.error("Error initializing Mollie client:", error);
    throw new Error(`Mollie client initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
