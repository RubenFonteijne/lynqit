// Pricing constants and utilities (client-safe, no Node.js dependencies)

// Subscription prices (ex BTW)
export const SUBSCRIPTION_PRICES = {
  start: 9.95, // €9.95 ex BTW per month
  pro: 14.95, // €14.95 ex BTW per month
} as const;

// Calculate price with BTW (21% in Netherlands)
export function calculatePriceWithBTW(priceExBTW: number): number {
  return priceExBTW * 1.21;
}

