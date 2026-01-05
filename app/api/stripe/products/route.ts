import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";

/**
 * Get all active Stripe products with prices
 * Returns products that contain "Lynqit" in the name
 */
export async function GET(request: NextRequest) {
  try {
    const stripe = await getStripeClient();
    
    const products = await stripe.products.list({
      active: true,
      limit: 100,
    });

    // Filter Lynqit products
    const lynqitProducts = products.data.filter(product => 
      product.name.toLowerCase().includes('lynqit')
    );

    // Get prices for each product
    const productsWithPrices = await Promise.all(
      lynqitProducts.map(async (product) => {
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
          type: 'recurring',
        });

        const monthlyPrice = prices.data.find(price => 
          price.recurring?.interval === 'month'
        ) || prices.data[0];

        if (!monthlyPrice) {
          return null;
        }

        // Extract plan name from product name
        let planName = product.name.toLowerCase()
          .replace(/^lynqit\s+/i, '')
          .replace(/\s+subscription$/i, '')
          .trim();

        return {
          id: product.id,
          priceId: monthlyPrice.id,
          name: product.name,
          description: product.description || '',
          plan: planName,
          amount: monthlyPrice.unit_amount ? monthlyPrice.unit_amount / 100 : 0,
          currency: monthlyPrice.currency,
          interval: monthlyPrice.recurring?.interval || 'month',
        };
      })
    );

    const validProducts = productsWithPrices
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => a.amount - b.amount);

    return NextResponse.json({ products: validProducts });
  } catch (error: any) {
    console.error("Error fetching Stripe products:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch products from Stripe" },
      { status: 500 }
    );
  }
}

