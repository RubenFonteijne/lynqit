import Stripe from 'stripe';
import { getSettings } from './settings';

// Re-export pricing utilities for convenience
export { SUBSCRIPTION_PRICES, calculatePriceWithBTW } from "./pricing";

// Initialize Stripe client
export async function getStripeClient(): Promise<Stripe> {
  try {
    const settings = await getSettings();
    
    // Get API key from settings or environment variable
    const apiKey = settings.stripeSecretKey || 
                   settings.stripeSecretKeyLive || 
                   settings.stripeSecretKeyTest ||
                   process.env.STRIPE_SECRET_KEY ||
                   process.env.STRIPE_SECRET_KEY_LIVE ||
                   process.env.STRIPE_SECRET_KEY_TEST;
    
    if (!apiKey) {
      throw new Error("Stripe secret key is not set. Please configure it in the admin settings.");
    }

    const stripe = new Stripe(apiKey, {
      apiVersion: '2024-12-18.acacia', // Use latest stable API version
      typescript: true,
    });
    
    return stripe;
  } catch (error: any) {
    console.error("Error initializing Stripe client:", error);
    throw new Error(`Stripe client initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// Get Stripe publishable key (for frontend)
export async function getStripePublishableKey(): Promise<string | undefined> {
  const settings = await getSettings();
  const isTestMode = settings.useTestMode ?? true;
  
  if (isTestMode) {
    return settings.stripePublishableKeyTest || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST;
  } else {
    return settings.stripePublishableKeyLive || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE;
  }
}

