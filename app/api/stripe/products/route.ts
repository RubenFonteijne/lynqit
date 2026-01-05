import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  try {
    const stripe = await getStripeClient();
    
    // Get all active products from Stripe that contain "Lynqit" in the name
    const products = await stripe.products.list({
      active: true,
      limit: 100,
    });

    // Filter products that are related to Lynqit (must contain 'lynqit' in name)
    // We check for 'lynqit' in the name, and optionally 'subscription' (but not required)
    const lynqitProducts = products.data.filter(product => 
      product.name.toLowerCase().includes('lynqit')
    );

    // For each product, get the associated prices
    const productsWithPrices = await Promise.all(
      lynqitProducts.map(async (product) => {
        // Get prices for this product
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
          type: 'recurring',
        });

        // Get the monthly recurring price (if multiple, take the first one)
        const monthlyPrice = prices.data.find(price => 
          price.recurring?.interval === 'month'
        ) || prices.data[0];

        if (!monthlyPrice) {
          return null;
        }

        // Extract plan name from product name
        // Examples: "Lynqit start subscription" -> "start", "Lynqit Pro" -> "pro"
        let planName = product.name.toLowerCase();
        // Remove "lynqit" prefix
        planName = planName.replace(/^lynqit\s+/i, '');
        // Remove "subscription" suffix if present
        planName = planName.replace(/\s+subscription$/i, '');
        // Trim whitespace
        planName = planName.trim();

        return {
          id: product.id,
          priceId: monthlyPrice.id,
          name: product.name,
          description: product.description || '',
          plan: planName, // 'start', 'pro', etc.
          amount: monthlyPrice.unit_amount ? monthlyPrice.unit_amount / 100 : 0, // Convert from cents to euros
          currency: monthlyPrice.currency,
          interval: monthlyPrice.recurring?.interval || 'month',
        };
      })
    );

    // Filter out null values and sort by amount
    const validProducts = productsWithPrices
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => a.amount - b.amount);

    return NextResponse.json({
      products: validProducts,
    });
  } catch (error: any) {
    console.error("Error fetching Stripe products:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch products from Stripe" },
      { status: 500 }
    );
  }
}

