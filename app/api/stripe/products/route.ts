import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";

// GET - Get all active Stripe products with their prices
export async function GET(request: NextRequest) {
  try {
    const stripe = await getStripeClient();
    
    console.log("[API /api/stripe/products] Fetching products from Stripe...");
    
    // Get all active products
    const products = await stripe.products.list({
      active: true,
      limit: 100,
    });

    console.log(`[API /api/stripe/products] Found ${products.data.length} products`);

    // Get all active prices
    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
    });

    console.log(`[API /api/stripe/products] Found ${prices.data.length} prices`);

    // Combine products with their prices
    const productsWithPrices = products.data.map((product) => {
      const productPrices = prices.data.filter(
        (price) => price.product === product.id && price.type === 'recurring'
      );

      // Sort prices by amount (ascending)
      productPrices.sort((a, b) => {
        const amountA = a.unit_amount || 0;
        const amountB = b.unit_amount || 0;
        return amountA - amountB;
      });

      // Get the first (cheapest) recurring price
      const primaryPrice = productPrices[0];

      return {
        id: product.id,
        name: product.name,
        description: product.description || '',
        metadata: product.metadata,
        price: primaryPrice ? {
          id: primaryPrice.id,
          amount: primaryPrice.unit_amount || 0,
          currency: primaryPrice.currency,
          interval: primaryPrice.recurring?.interval || 'month',
          intervalCount: primaryPrice.recurring?.interval_count || 1,
        } : null,
        allPrices: productPrices.map((price) => ({
          id: price.id,
          amount: price.unit_amount || 0,
          currency: price.currency,
          interval: price.recurring?.interval || 'month',
          intervalCount: price.recurring?.interval_count || 1,
        })),
      };
    }).filter((product) => product.price !== null); // Only return products with prices

    // Sort products by price amount (ascending)
    productsWithPrices.sort((a, b) => {
      const amountA = a.price?.amount || 0;
      const amountB = b.price?.amount || 0;
      return amountA - amountB;
    });

    console.log(`[API /api/stripe/products] Returning ${productsWithPrices.length} products with prices`);

    return NextResponse.json({ products: productsWithPrices });
  } catch (error) {
    console.error("Error fetching Stripe products:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching products", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
