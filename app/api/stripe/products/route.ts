import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSettings } from "@/lib/settings";

// Helper function to create Stripe client with specific API key
function createStripeClient(apiKey: string): Stripe {
  return new Stripe(apiKey, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
  });
}

// Helper function to fetch products from a Stripe client
async function fetchProductsFromStripe(stripe: Stripe, mode: 'test' | 'live') {
  console.log(`[API /api/stripe/products] Fetching products from Stripe ${mode} mode...`);
  
  const products = await stripe.products.list({
    active: true,
    limit: 100,
  });

  const prices = await stripe.prices.list({
    active: true,
    limit: 100,
  });

  console.log(`[API /api/stripe/products] Found ${products.data.length} products and ${prices.data.length} prices in ${mode} mode`);

  return { products: products.data, prices: prices.data, mode };
}

// GET - Get all active Stripe products with their prices from both test and live modes
export async function GET(request: NextRequest) {
  try {
    const settings = await getSettings();
    
    // Get products from both test and live modes
    const allProductsData: Array<{ products: Stripe.Product[]; prices: Stripe.Price[]; mode: 'test' | 'live' }> = [];
    
    // Fetch from test mode if API key is available
    if (settings.stripeSecretKeyTest || process.env.STRIPE_SECRET_KEY_TEST) {
      try {
        const testApiKey = settings.stripeSecretKeyTest || process.env.STRIPE_SECRET_KEY_TEST;
        if (testApiKey) {
          const testStripe = createStripeClient(testApiKey);
          const testData = await fetchProductsFromStripe(testStripe, 'test');
          allProductsData.push(testData);
        }
      } catch (error) {
        console.error("[API /api/stripe/products] Error fetching from test mode:", error);
      }
    }
    
    // Fetch from live mode if API key is available
    if (settings.stripeSecretKeyLive || process.env.STRIPE_SECRET_KEY_LIVE) {
      try {
        const liveApiKey = settings.stripeSecretKeyLive || process.env.STRIPE_SECRET_KEY_LIVE;
        if (liveApiKey) {
          const liveStripe = createStripeClient(liveApiKey);
          const liveData = await fetchProductsFromStripe(liveStripe, 'live');
          allProductsData.push(liveData);
        }
      } catch (error) {
        console.error("[API /api/stripe/products] Error fetching from live mode:", error);
      }
    }
    
    if (allProductsData.length === 0) {
      console.error("[API /api/stripe/products] No Stripe API keys configured");
      return NextResponse.json(
        { error: "Stripe API keys are not configured" },
        { status: 500 }
      );
    }
    
    console.log(`[API /api/stripe/products] Processing products from ${allProductsData.length} mode(s)`);

    // Combine products with their prices, deduplicating by name
    // Use a Map to deduplicate products by name (in case same product exists in both modes)
    // Prefer live mode products over test mode products
    const productsMap = new Map<string, { product: Stripe.Product; prices: Stripe.Price[]; mode: 'test' | 'live' }>();
    
    // Sort to process test mode first, then live mode (so live overwrites test)
    const sortedData = allProductsData.sort((a, b) => {
      if (a.mode === 'test' && b.mode === 'live') return -1;
      if (a.mode === 'live' && b.mode === 'test') return 1;
      return 0;
    });
    
    sortedData.forEach(({ products, prices, mode }) => {
      products.forEach((product) => {
        const productPrices = prices.filter(
          (price) => price.product === product.id && price.type === 'recurring'
        );
        
        // Use product name as key for deduplication (normalized to lowercase and trimmed)
        const key = product.name.toLowerCase().trim();
        
        const existing = productsMap.get(key);
        
        // If product doesn't exist yet, add it
        if (!existing) {
          productsMap.set(key, { product, prices: productPrices, mode });
        } else {
          // If product exists, prefer live mode over test mode
          // Or if current has prices and existing doesn't, replace it
          if (mode === 'live' && existing.mode === 'test') {
            productsMap.set(key, { product, prices: productPrices, mode });
          } else if (productPrices.length > 0 && existing.prices.length === 0) {
            productsMap.set(key, { product, prices: productPrices, mode });
          }
        }
      });
    });
    
    console.log(`[API /api/stripe/products] After deduplication: ${productsMap.size} unique products`);
    
    const productsWithPrices = Array.from(productsMap.values()).map(({ product, prices: productPrices }) => {

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
    }).filter((item) => item.price !== null); // Only return products with prices

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
