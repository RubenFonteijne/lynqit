import Stripe from 'stripe';
import { getSettings } from './settings';

/**
 * Get Stripe client instance
 * Uses API key from settings or environment variables
 */
export async function getStripeClient(): Promise<Stripe> {
  const settings = await getSettings();
  const isTestMode = settings.useTestMode ?? true;
  
  // Get API key based on test/live mode
  const apiKey = isTestMode
    ? (settings.stripeSecretKeyTest || process.env.STRIPE_SECRET_KEY_TEST)
    : (settings.stripeSecretKeyLive || process.env.STRIPE_SECRET_KEY_LIVE);
  
  if (!apiKey) {
    throw new Error("Stripe secret key is not configured. Please set it in admin settings.");
  }

  return new Stripe(apiKey, {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
  });
}

/**
 * Get Stripe publishable key for frontend
 */
export async function getStripePublishableKey(): Promise<string> {
  const settings = await getSettings();
  const isTestMode = settings.useTestMode ?? true;
  
  const publishableKey = isTestMode
    ? (settings.stripePublishableKeyTest || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST)
    : (settings.stripePublishableKeyLive || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE);
  
  if (!publishableKey) {
    throw new Error("Stripe publishable key is not configured. Please set it in admin settings.");
  }
  
  return publishableKey;
}

