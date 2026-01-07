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
    
    // Combine all products and prices
    const allProducts: Stripe.Product[] = [];
    const allPrices: Stripe.Price[] = [];
    
    allProductsData.forEach(({ products, prices }) => {
      allProducts.push(...products);
      allPrices.push(...prices);
    });
    
    console.log(`[API /api/stripe/products] Total: ${allProducts.length} products and ${allPrices.length} prices from all modes`);

    // Combine products with their prices
    // Use a Map to deduplicate products by name (in case same product exists in both modes)
    const productsMap = new Map<string, { product: Stripe.Product; prices: Stripe.Price[] }>();
    
    allProducts.forEach((product) => {
      const productPrices = allPrices.filter(
        (price) => price.product === product.id && price.type === 'recurring'
      );
      
      // Use product name as key for deduplication
      const key = product.name.toLowerCase();
      if (!productsMap.has(key) || productPrices.length > 0) {
        // Keep the product with prices, or the first one if no prices
        const existing = productsMap.get(key);
        if (!existing || (productPrices.length > 0 && existing.prices.length === 0)) {
          productsMap.set(key, { product, prices: productPrices });
        }
      }
    });
    
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
