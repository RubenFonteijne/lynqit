"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { createClientClient } from "@/lib/supabase-client";
import { SUBSCRIPTION_PRICES, calculatePriceWithBTW, calculatePriceWithDiscount } from "@/lib/pricing";

function RegisterContent() {
  useEffect(() => {
    document.title = "Registreren - Lynqit";
  }, []);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const planParam = searchParams.get("plan") as "free" | "start" | "pro" | null;
  const prefillEmail = searchParams.get("email");
  const fromSubscription = searchParams.get("fromSubscription") === "true";
  const fromPayment = searchParams.get("fromPayment") === "true";
  
  // Determine current language from pathname
  const isDutch = pathname?.startsWith("/nl") || pathname?.startsWith("/prijzen") || pathname?.startsWith("/hoe-werkt-het") || pathname?.startsWith("/voor-artiesten");
  
  const [email, setEmail] = useState(prefillEmail || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [slug, setSlug] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"free" | "start" | "pro">(planParam || "free");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle");
  const [slugMessage, setSlugMessage] = useState("");
  const [stripeProducts, setStripeProducts] = useState<Array<{
    id: string;
    name: string;
    description: string;
    metadata: Record<string, string>;
    price: {
      id: string;
      amount: number;
      currency: string;
      interval: string;
      intervalCount: number;
    } | null;
  }>>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [selectedStripeProduct, setSelectedStripeProduct] = useState<{
    productId: string;
    priceId: string;
  } | null>(null);

  useEffect(() => {
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [prefillEmail]);

  // Check slug availability when slug changes (with debounce)
  useEffect(() => {
    const checkSlugAvailability = async () => {
      const cleanedSlug = slug.trim().toLowerCase().replace(/^-+|-+$/g, "");
      
      // Reset status if slug is empty
      if (!cleanedSlug) {
        setSlugStatus("idle");
        setSlugMessage("");
        return;
      }

      // Validate format first
      if (!/^[a-z0-9-]+$/.test(cleanedSlug)) {
        setSlugStatus("unavailable");
        setSlugMessage("Alleen kleine letters, cijfers en streepjes toegestaan");
        return;
      }

      if (cleanedSlug.startsWith("-") || cleanedSlug.endsWith("-")) {
        setSlugStatus("unavailable");
        setSlugMessage("Mag niet beginnen of eindigen met een streepje");
        return;
      }

      // Check availability
      setSlugStatus("checking");
      setSlugMessage("Controleren...");

      try {
        const response = await fetch(`/api/pages/check-slug?slug=${encodeURIComponent(cleanedSlug)}`);
        const data = await response.json();

        if (data.available) {
          setSlugStatus("available");
          setSlugMessage("✓ Deze slug is beschikbaar");
        } else {
          setSlugStatus("unavailable");
          setSlugMessage("✗ Deze slug is al bezet");
        }
      } catch (error) {
        setSlugStatus("idle");
        setSlugMessage("");
      }
    };

    // Debounce: wait 500ms after user stops typing
    const timeoutId = setTimeout(checkSlugAvailability, 500);

    return () => clearTimeout(timeoutId);
  }, [slug]);

  // Fetch Stripe products on component mount
  useEffect(() => {
    if (stripeProducts.length === 0) {
      const fetchStripeProducts = async () => {
        setIsLoadingProducts(true);
        try {
          const response = await fetch("/api/stripe/products");
          if (response.ok) {
            const data = await response.json();
            setStripeProducts(data.products || []);
          } else {
            console.error("Error fetching Stripe products:", response.status);
          }
        } catch (error) {
          console.error("Error fetching Stripe products:", error);
        } finally {
          setIsLoadingProducts(false);
        }
      };
      fetchStripeProducts();
    }
  }, [stripeProducts.length]);


  // Calculate pricing - only free plan supported
  const calculatePricing = () => {
    return {
      priceExBTW: 0,
      priceWithBTW: 0,
      discount: 0,
      finalPriceExBTW: 0,
      finalPriceWithBTW: 0,
    };
  };

  const pricing = calculatePricing();

  const validateStep1 = () => {
    if (!slug || slug.trim() === "") {
      setError("Lynqit pagina slug is verplicht");
      return false;
    }

    const cleanedSlug = slug.replace(/^-+|-+$/g, "");
    
    if (!cleanedSlug || cleanedSlug.trim() === "") {
      setError("Lynqit pagina slug mag niet alleen uit streepjes bestaan");
      return false;
    }

    if (!/^[a-z0-9-]+$/.test(cleanedSlug)) {
      setError("Slug mag alleen kleine letters, cijfers en streepjes bevatten");
      return false;
    }
    
    if (cleanedSlug.startsWith("-") || cleanedSlug.endsWith("-")) {
      setError("Slug mag niet beginnen of eindigen met een streepje");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    return true;
  };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validate all fields
    if (!validateStep1()) {
      return;
    }

    // Check if account already exists
    if (!email || !email.trim()) {
      setError("Email is verplicht");
      return;
    }

    setIsLoading(true);
    try {
      const checkResponse = await fetch(`/api/auth/check?email=${encodeURIComponent(email.toLowerCase())}`);
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.exists) {
          setError("Een account met dit email adres bestaat al. Log in of gebruik een ander email adres.");
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      // If check fails, continue anyway (don't block registration)
      console.error("Error checking if user exists:", err);
    } finally {
      setIsLoading(false);
    }

    // Continue with registration
    setIsLoading(true);

    if (!slug || slug.trim() === "") {
      setError("Lynqit pagina slug is verplicht");
      setIsLoading(false);
      return;
    }

    // Clean up slug: remove leading/trailing hyphens and validate
    const cleanedSlug = slug.replace(/^-+|-+$/g, "");
    
    if (!cleanedSlug || cleanedSlug.trim() === "") {
      setError("Lynqit pagina slug mag niet alleen uit streepjes bestaan");
      return;
    }

    // Validate slug format (lowercase letters, numbers, and hyphens only)
    if (!/^[a-z0-9-]+$/.test(cleanedSlug)) {
      setError("Slug mag alleen kleine letters, cijfers en streepjes bevatten");
      return;
    }
    
    // Ensure slug doesn't start or end with hyphen
    if (cleanedSlug.startsWith("-") || cleanedSlug.endsWith("-")) {
      setError("Slug mag niet beginnen of eindigen met een streepje");
      return;
    }

    setIsLoading(true);

    try {
      // Check if user already exists (from payment/subscription flow)
      let userExists = false;
      if (fromPayment || fromSubscription) {
        try {
          const checkResponse = await fetch(`/api/auth/check?email=${encodeURIComponent(email)}`);
          if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            userExists = checkData.exists;
            if (userExists && checkData.user) {
              // Store existing user in localStorage
              localStorage.setItem("lynqit_user", JSON.stringify(checkData.user));
            }
          }
        } catch (err) {
          // Continue with registration if check fails
        }
      }

      // Get slug from sessionStorage if available (from payment flow), otherwise use form value
      const finalSlug = fromPayment && sessionStorage.getItem("pending_slug") 
        ? sessionStorage.getItem("pending_slug")!
        : cleanedSlug.trim().toLowerCase();

      // Check if a Stripe product is selected
      if (selectedStripeProduct && selectedPlan !== "free") {
        // Redirect to payment flow for Stripe products
        // For now, we'll still create the account but note that payment is required
        // TODO: Implement Stripe checkout flow
        setError("Betalingsfunctionaliteit voor betaalde abonnementen wordt binnenkort toegevoegd. Kies voorlopig het gratis plan.");
        setIsLoading(false);
        return;
      }

      // Handle free plan - register user and create page
      if (selectedPlan === "free") {
        // Register user if they don't exist (and create page in the same call)
        let accessToken: string | null = null;
        let pageId: string | null = null;
        
        if (!userExists) {
          const registerResponse = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              email, 
              password,
              slug: finalSlug, // Send slug to create page during registration
            }),
          });

          const registerData = await registerResponse.json();

          if (!registerResponse.ok) {
            setError(registerData.error || "An error occurred during registration");
            setIsLoading(false);
            return;
          }

          // Store user in localStorage for authentication
          if (registerData.user) {
            localStorage.setItem("lynqit_user", JSON.stringify(registerData.user));
          }

          // Get page ID if page was created
          if (registerData.page) {
            pageId = registerData.page.id;
          }

          // Get access token from session if available
          if (registerData.accessToken) {
            accessToken = registerData.accessToken;
          } else if (registerData.session?.access_token) {
            accessToken = registerData.session.access_token;
          }
        } else {
          // User already exists, try to get session and create page if needed
          try {
            const supabase = createClientClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              accessToken = session.access_token;
            }
            
            // If we have a slug and no page yet, create it
            if (finalSlug && !fromPayment) {
              const pageHeaders: HeadersInit = {
                "Content-Type": "application/json",
              };
              
              if (accessToken) {
                pageHeaders["Authorization"] = `Bearer ${accessToken}`;
              }

              const pageResponse = await fetch("/api/pages", {
                method: "POST",
                headers: pageHeaders,
                body: JSON.stringify({
                  userId: email,
                  slug: finalSlug,
                }),
              });

              if (pageResponse.ok) {
                const pageData = await pageResponse.json();
                pageId = pageData.page?.id;
              }
            }
          } catch (err) {
            console.error("Error getting session or creating page:", err);
          }
        }

        // If we still don't have a page ID and we have a slug, try to create it
        if (!pageId && finalSlug && accessToken) {
          const pageHeaders: HeadersInit = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          };

          const pageResponse = await fetch("/api/pages", {
            method: "POST",
            headers: pageHeaders,
            body: JSON.stringify({
              userId: email,
              slug: finalSlug,
            }),
          });

          if (pageResponse.ok) {
            const pageData = await pageResponse.json();
            pageId = pageData.page?.id;
          }
        }

        // Clear pending slug from sessionStorage
        if (fromPayment) {
          sessionStorage.removeItem("pending_slug");
        }

        // For free plan - check if email confirmation is required
        if (!accessToken) {
          // Email confirmation required - redirect to confirmation page
          const confirmPage = isDutch ? "/bevestig-registratie" : "/confirm-registration";
          router.push(`${confirmPage}?email=${encodeURIComponent(email)}${pageId ? `&pageId=${pageId}` : ''}`);
          return;
        }

        // For free plan with accessToken - redirect to edit page
        router.push(`/dashboard/pages/${pageId}/edit`);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen font-sans bg-zinc-50 dark:bg-black">
      {/* Left Panel - Illustrative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#2E47FF] to-[#00F0EE] items-center justify-center p-12 relative overflow-hidden">
        <div className="relative z-10 text-white">
          {/* Logo placeholder - you can add actual logo here */}
          <div className="mb-8">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Getting Started<br />
            With<br />
            Lynqit
          </h2>
          
          <p className="text-white/90 text-lg mt-8">
            Create your personal link page in minutes. Connect all your important links, socials, and content in one place.
          </p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8 bg-zinc-900">
        <div className="w-full max-w-md">
          <div className="p-0">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-black dark:text-zinc-50 mb-2">
                Maak je account aan
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Vul je gegevens in om te beginnen
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* All fields in one step */}
              <div>
                <label
                  htmlFor="slug"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                >
                  Lynqit pagina slug
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 dark:text-zinc-400">lynqit.nl/</span>
                  <input
                    id="slug"
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      let value = e.target.value.toLowerCase().replace(/\s+/g, "-");
                      value = value.replace(/[^a-z0-9-]/g, "");
                      value = value.replace(/-+/g, "-");
                      setSlug(value);
                    }}
                    required
                    pattern="[a-z0-9-]+"
                    className="flex-1 px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-50 focus:border-transparent transition-colors"
                    placeholder="jouw-pagina-naam"
                  />
                </div>
                {slugMessage && (
                  <p className={`mt-1 text-xs ${
                    slugStatus === "available" 
                      ? "text-green-600 dark:text-green-400" 
                      : slugStatus === "unavailable"
                      ? "text-red-600 dark:text-red-400"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}>
                    {slugMessage}
                  </p>
                )}
                {!slugMessage && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Alleen kleine letters, cijfers en streepjes toegestaan
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={!!prefillEmail}
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-50 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-50 focus:border-transparent transition-colors pr-10"
                    placeholder="Enter your password"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-50 focus:border-transparent transition-colors"
                  placeholder="Confirm your password"
                />
              </div>

              {/* Plan Selection - Free plan + Stripe products */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Abonnement
                </label>
                <div className="grid gap-3 grid-cols-1">
                  {/* Free plan */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("free")}
                    className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                      selectedPlan === "free"
                        ? "border-[#2E47FF] bg-blue-50 dark:bg-blue-900/20"
                        : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    }`}
                  >
                    <div className="text-sm font-semibold text-black dark:text-zinc-50">
                      Basis
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      Gratis
                    </div>
                  </button>

                  {/* Stripe products */}
                  {isLoadingProducts ? (
                    <div className="px-4 py-3 rounded-lg border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        Laden...
                      </div>
                    </div>
                  ) : (
                    stripeProducts.map((product) => {
                      const priceInEuros = (product.price?.amount || 0) / 100;
                      const priceWithBTW = priceInEuros * 1.21; // 21% BTW
                      const intervalText = product.price?.interval === 'month' ? 'per maand' : product.price?.interval === 'year' ? 'per jaar' : '';
                      
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            // Store selected product info for later use
                            const plan = product.metadata.plan as "start" | "pro" || "start";
                            setSelectedPlan(plan);
                            setSelectedStripeProduct({
                              productId: product.id,
                              priceId: product.price?.id || "",
                            });
                            localStorage.setItem("selected_stripe_product", JSON.stringify({
                              productId: product.id,
                              priceId: product.price?.id,
                            }));
                          }}
                          className={`px-4 py-3 rounded-lg border-2 transition-colors text-left ${
                            selectedStripeProduct?.productId === product.id
                              ? "border-[#2E47FF] bg-blue-50 dark:bg-blue-900/20"
                              : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-sm font-semibold text-black dark:text-zinc-50">
                                {product.name}
                              </div>
                              {product.description && (
                                <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                  {product.description}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-black dark:text-zinc-50">
                                €{priceWithBTW.toFixed(2)}
                              </div>
                              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                                {intervalText}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg bg-[#2E47FF] text-white font-medium hover:bg-[#1E37E6] focus:outline-none focus:ring-2 focus:ring-[#2E47FF] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Account aanmaken..." : "Account aanmaken"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-[#2E47FF] dark:text-[#00F0EE] hover:underline"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}
