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
  const [selectedPlan, setSelectedPlan] = useState<"free" | string>(planParam || "free");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("card");
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<Array<{ id: string; description: string; available: boolean }>>([
    { id: 'card', description: 'Creditcard / Debitcard', available: true },
    { id: 'paypal', description: 'PayPal', available: true },
  ]);
  const [stripeProducts, setStripeProducts] = useState<Array<{
    id: string;
    priceId: string;
    name: string;
    description: string;
    plan: string;
    amount: number;
    currency: string;
    interval: string;
  }>>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [discountCode, setDiscountCode] = useState("");
  const [discountCodeValidating, setDiscountCodeValidating] = useState(false);
  const [discountCodeValid, setDiscountCodeValid] = useState<boolean | null>(null);
  const [discountCodeMessage, setDiscountCodeMessage] = useState("");
  const [discountCodeData, setDiscountCodeData] = useState<any>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [prefillEmail]);

  // Fetch Stripe products
  useEffect(() => {
    const fetchStripeProducts = async () => {
      setProductsLoading(true);
      try {
        const response = await fetch("/api/stripe/products");
        if (response.ok) {
          const data = await response.json();
          if (data.products && data.products.length > 0) {
            setStripeProducts(data.products);
            // If planParam is set and matches a product, select it
            if (planParam && planParam !== "free") {
              const matchingProduct = data.products.find((p: any) => p.plan === planParam);
              if (matchingProduct) {
                setSelectedPlan(matchingProduct.priceId);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching Stripe products:", error);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchStripeProducts();
  }, [planParam]);

  // Fetch available payment methods from Stripe
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch("/api/stripe/payment/methods");
        if (response.ok) {
          const data = await response.json();
          if (data.methods && data.methods.length > 0) {
            setAvailablePaymentMethods(data.methods);
            // Set default to first available method
            if (data.methods[0]?.id) {
              setSelectedPaymentMethod(data.methods[0].id);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching Stripe payment methods:", error);
        // Keep default methods on error
        setAvailablePaymentMethods([
          { id: 'card', description: 'Creditcard / Debitcard', available: true },
          { id: 'paypal', description: 'PayPal', available: true },
        ]);
        setSelectedPaymentMethod("card");
      }
    };

    fetchPaymentMethods();
  }, []);

  // Validate discount code when it changes and a paid plan is selected
  useEffect(() => {
    if (discountCode && discountCode.trim() !== "" && selectedPlan !== "free") {
      const validateDiscount = async () => {
        setDiscountCodeValidating(true);
        setDiscountCodeValid(null);
        setDiscountCodeMessage("");

        try {
          // Check our database for discount codes
          const selectedProduct = stripeProducts.find(p => p.priceId === selectedPlan);
          const planName = selectedProduct?.plan || selectedPlan;
          
          const dbResponse = await fetch(
            `/api/discount-codes/validate?code=${encodeURIComponent(discountCode.trim())}&plan=${planName}`
          );
          const dbData = await dbResponse.json();

          if (dbData.valid && dbData.discountCode) {
            setDiscountCodeValid(true);
            const discount = dbData.discountCode;
            setDiscountCodeData(discount);
            const discountText = discount.isPercentage
              ? `${discount.discountValue}%`
              : `€${discount.discountValue.toFixed(2)}`;
            const typeText = discount.discountType === "first_payment" ? "eerste betaling" : "elke maand";
            setDiscountCodeMessage(`Kortingscode geldig: ${discountText} korting op ${typeText}`);
          } else {
            setDiscountCodeValid(false);
            setDiscountCodeData(null);
            setDiscountCodeMessage(dbData.error || "Ongeldige kortingscode");
          }
        } catch (error) {
          setDiscountCodeValid(false);
          setDiscountCodeMessage("Fout bij valideren van kortingscode");
        } finally {
          setDiscountCodeValidating(false);
        }
      };

      // Debounce validation
      const timeoutId = setTimeout(validateDiscount, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setDiscountCodeValid(null);
      setDiscountCodeMessage("");
      setDiscountCodeData(null);
    }
  }, [discountCode, selectedPlan, stripeProducts]);

  // Calculate pricing with discount using Stripe product data
  const calculatePricing = () => {
    if (selectedPlan === "free") {
      return {
        priceExBTW: 0,
        priceWithBTW: 0,
        discount: 0,
        finalPriceExBTW: 0,
        finalPriceWithBTW: 0,
        selectedProduct: null,
      };
    }

    // Find the selected product from Stripe
    const selectedProduct = stripeProducts.find(p => p.priceId === selectedPlan);
    if (!selectedProduct) {
      return {
        priceExBTW: 0,
        priceWithBTW: 0,
        discount: 0,
        discountAmount: 0,
        finalPriceExBTW: 0,
        finalPriceWithBTW: 0,
        selectedProduct: null,
      };
    }

    // Amount from Stripe is already including BTW, so we need to calculate ex BTW
    const basePriceWithBTW = selectedProduct.amount;
    const basePriceExBTW = basePriceWithBTW / 1.21; // Remove BTW (21%)
    
    let finalPriceExBTW: number = basePriceExBTW;
    let finalPriceWithBTW: number = basePriceWithBTW;
    let discount = 0;
    let discountAmount = 0;

    if (discountCodeValid && discountCodeData) {
      // Check if it's a Stripe coupon (has percentOff or amountOff)
      if (discountCodeData.percentOff !== undefined || discountCodeData.amountOff !== undefined) {
        // Stripe coupon - calculate discount
        if (discountCodeData.percentOff) {
          // Percentage discount
          discountAmount = (basePriceWithBTW * discountCodeData.percentOff) / 100;
          finalPriceWithBTW = basePriceWithBTW - discountAmount;
          finalPriceExBTW = finalPriceWithBTW / 1.21;
          discount = basePriceExBTW - finalPriceExBTW;
        } else if (discountCodeData.amountOff) {
          // Fixed amount discount (in cents, convert to euros)
          discountAmount = discountCodeData.amountOff / 100;
          finalPriceWithBTW = Math.max(0, basePriceWithBTW - discountAmount);
          finalPriceExBTW = finalPriceWithBTW / 1.21;
          discount = basePriceExBTW - finalPriceExBTW;
        }
      } else if (discountCodeData.discountType) {
        // Database discount code (legacy)
        // Only apply discount if it's for first payment or recurring
        if (discountCodeData.discountType === "first_payment" || discountCodeData.discountType === "recurring") {
          finalPriceExBTW = calculatePriceWithDiscount(
            basePriceExBTW,
            discountCodeData.discountValue,
            discountCodeData.isPercentage
          );
          finalPriceWithBTW = calculatePriceWithBTW(finalPriceExBTW);
          discount = basePriceExBTW - finalPriceExBTW;
          discountAmount = basePriceWithBTW - finalPriceWithBTW;
        }
      }
    }

    return {
      priceExBTW: basePriceExBTW,
      priceWithBTW: basePriceWithBTW,
      discount,
      discountAmount,
      finalPriceExBTW,
      finalPriceWithBTW,
      selectedProduct,
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

  const handleNextStep = () => {
    setError("");
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(1);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!slug || slug.trim() === "") {
      setError("Lynqit pagina slug is verplicht");
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

      // Handle paid plans FIRST - create payment, account will be created after payment
      if (selectedPlan !== "free" && !fromPayment) {
        setIsProcessingPayment(true);
        
        // Create payment for subscription WITHOUT creating account first
        // Account will be created in webhook after successful payment
        // Always use Stripe for /register
        // Get plan name and price ID from selected product
        let planName = selectedPlan;
        let priceIdToSend: string | undefined;
        
        // If selectedPlan is a priceId (starts with "price_"), extract the product info
        if (selectedPlan !== "free" && selectedPlan.startsWith("price_")) {
          const selectedProduct = stripeProducts.find(p => p.priceId === selectedPlan);
          if (!selectedProduct) {
            setError("Selecteer een geldig abonnement");
            setIsLoading(false);
            setIsProcessingPayment(false);
            return;
          }
          planName = selectedProduct.plan;
          priceIdToSend = selectedProduct.priceId;
        } else if (selectedPlan !== "free") {
          // Fallback: if it's not a priceId, assume it's a plan name and try to find the product
          const selectedProduct = stripeProducts.find(p => p.plan === selectedPlan);
          if (selectedProduct) {
            priceIdToSend = selectedProduct.priceId;
          }
        }

        // Ensure we have a priceId before proceeding
        if (!priceIdToSend) {
          setError("Selecteer een geldig abonnement");
          setIsLoading(false);
          setIsProcessingPayment(false);
          return;
        }

        const paymentResponse = await fetch("/api/stripe/payment/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            plan: planName, // Use plan name (start, pro, etc.)
            priceId: priceIdToSend, // Use Stripe price ID
            paymentMethod: selectedPaymentMethod,
            discountCode: discountCode.trim() || undefined,
            slug: finalSlug, // Include slug for account creation after payment
            password: password, // Include password for account creation after payment
            createAccount: true, // Flag to indicate this is a new registration
          }),
        });

        const paymentData = await paymentResponse.json();

        if (!paymentResponse.ok) {
          setError(paymentData.error || "Kon betaling niet aanmaken");
          setIsLoading(false);
          setIsProcessingPayment(false);
          return;
        }

        // Redirect to embedded Stripe payment page
        // After successful payment, webhook will create account and page
        if (paymentData.clientSecret && paymentData.subscriptionId) {
          // Store slug in sessionStorage for payment success page
          sessionStorage.setItem("pending_slug", finalSlug);
          
          // Build URL with all necessary parameters
          const paymentUrl = new URL("/payment/stripe", window.location.origin);
          paymentUrl.searchParams.set("email", email);
          paymentUrl.searchParams.set("plan", planName);
          paymentUrl.searchParams.set("priceId", priceIdToSend!);
          paymentUrl.searchParams.set("paymentMethod", selectedPaymentMethod);
          paymentUrl.searchParams.set("clientSecret", paymentData.clientSecret);
          paymentUrl.searchParams.set("subscriptionId", paymentData.subscriptionId);
          if (discountCode.trim()) {
            paymentUrl.searchParams.set("discountCode", discountCode.trim());
          }
          paymentUrl.searchParams.set("slug", finalSlug);
          paymentUrl.searchParams.set("password", password);
          
          router.push(paymentUrl.toString());
        } else if (paymentData.paymentUrl) {
          // Fallback: if paymentUrl is returned (old checkout session), use it
          sessionStorage.setItem("pending_slug", finalSlug);
          window.location.href = paymentData.paymentUrl;
        } else {
          setError("Kon betalingslink niet genereren");
          setIsLoading(false);
          setIsProcessingPayment(false);
        }
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
              <div className="flex items-center gap-2 mb-4">
                <div className={`flex-1 h-1 rounded-full ${currentStep >= 1 ? 'bg-[#2E47FF]' : 'bg-zinc-700'}`}></div>
                <div className={`flex-1 h-1 rounded-full ${currentStep >= 2 ? 'bg-[#2E47FF]' : 'bg-zinc-700'}`}></div>
              </div>
              <h1 className="text-3xl font-semibold text-black dark:text-zinc-50 mb-2">
                {currentStep === 1 ? "Accountgegevens" : "Abonnement & Betaling"}
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                {currentStep === 1 ? "Stap 1 van 2: Maak je account aan" : "Stap 2 van 2: Kies je abonnement"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* STEP 1: Account Information */}
              {currentStep === 1 && (
                <>
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
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Alleen kleine letters, cijfers en streepjes toegestaan
                    </p>
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

                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full py-3 px-4 rounded-lg bg-[#2E47FF] text-white font-medium hover:bg-[#1E37E6] focus:outline-none focus:ring-2 focus:ring-[#2E47FF] focus:ring-offset-2 transition-colors"
                  >
                    Volgende
                  </button>
                </>
              )}

              {/* STEP 2: Subscription & Payment */}
              {currentStep === 2 && (
                <>
                  {/* Plan Selection */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Abonnement
                </label>
                <div className={`grid gap-3 ${stripeProducts.length === 0 ? 'grid-cols-1' : `grid-cols-${stripeProducts.length + 1}`}`}>
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
                  {productsLoading ? (
                    <div className="col-span-2 text-center py-3 text-zinc-500 dark:text-zinc-400">
                      Laden...
                    </div>
                  ) : (
                    stripeProducts.map((product) => {
                      const isSelected = selectedPlan === product.priceId;
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => setSelectedPlan(product.priceId)}
                          className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                            isSelected
                              ? "border-[#2E47FF] bg-blue-50 dark:bg-blue-900/20"
                              : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                          }`}
                        >
                          <div className="text-sm font-semibold text-black dark:text-zinc-50 capitalize">
                            {product.plan}
                          </div>
                          <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                            €{product.amount.toFixed(2)}/{product.interval === 'month' ? 'maand' : product.interval}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Discount Code - Only show for paid plans */}
              {selectedPlan !== "free" && (
                <div>
                  <label
                    htmlFor="discountCode"
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                  >
                    Kortingscode (optioneel)
                  </label>
                  <input
                    id="discountCode"
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    placeholder="WELCOME10"
                    className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-50 focus:border-transparent transition-colors"
                  />
                  {discountCodeValidating && (
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Valideren...
                    </p>
                  )}
                  {!discountCodeValidating && discountCodeMessage && (
                    <p
                      className={`mt-1 text-xs ${
                        discountCodeValid
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {discountCodeMessage}
                    </p>
                  )}
                </div>
              )}

              {/* Payment Method Selection - Only show for paid plans */}
              {selectedPlan !== "free" && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Betaalmethode
                  </label>
                  <div className={`grid gap-3 ${availablePaymentMethods.length === 2 ? 'grid-cols-2' : availablePaymentMethods.length === 3 ? 'grid-cols-3' : availablePaymentMethods.length >= 4 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2'}`}>
                    {availablePaymentMethods.filter(m => m.available).map((method) => {
                      const methodId = method.id.toLowerCase();
                      const isSelected = selectedPaymentMethod === methodId;
                      const iconClass = methodId === 'card' || methodId === 'creditcard' ? 'fas fa-credit-card' :
                                       methodId === 'paypal' ? 'fab fa-paypal' :
                                       methodId === 'sepa_debit' || methodId === 'sepa' || methodId === 'directdebit' ? 'fas fa-university' :
                                       methodId === 'ideal' ? 'fas fa-building' :
                                       methodId === 'bancontact' ? 'fas fa-credit-card' :
                                       methodId === 'sofort' ? 'fas fa-bank' :
                                       methodId === 'giropay' ? 'fas fa-bank' :
                                       'fas fa-money-bill';
                      
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setSelectedPaymentMethod(methodId)}
                          className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                            isSelected
                              ? "border-[#2E47FF] bg-blue-50 dark:bg-blue-900/20"
                              : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <i className={`${iconClass} text-lg`}></i>
                            <div className="text-sm font-semibold text-black dark:text-zinc-50">
                              {method.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pricing Summary */}
              {selectedPlan !== "free" && (
                <div className="p-4 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
                    Kostenoverzicht
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Abonnement ({pricing.selectedProduct ? pricing.selectedProduct.plan.charAt(0).toUpperCase() + pricing.selectedProduct.plan.slice(1) : selectedPlan})</span>
                      <span>€{pricing.priceWithBTW.toFixed(2)}/maand</span>
                    </div>
                    {(pricing.discount > 0 || (pricing.discountAmount && pricing.discountAmount > 0)) && discountCodeValid && (
                      <>
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span>Korting</span>
                          <span>-€{(pricing.discountAmount && pricing.discountAmount > 0 ? pricing.discountAmount : calculatePriceWithBTW(pricing.discount)).toFixed(2)}</span>
                        </div>
                        <div className="border-t border-zinc-300 dark:border-zinc-700 pt-2 mt-2">
                          <div className="flex justify-between font-semibold text-zinc-700 dark:text-zinc-300">
                            <span>Totaal per maand</span>
                            <span>€{pricing.finalPriceWithBTW.toFixed(2)}</span>
                          </div>
                        </div>
                      </>
                    )}
                    {pricing.discount === 0 && (!pricing.discountAmount || pricing.discountAmount === 0) && (
                      <div className="border-t border-zinc-300 dark:border-zinc-700 pt-2 mt-2">
                        <div className="flex justify-between font-semibold text-zinc-700 dark:text-zinc-300">
                          <span>Totaal per maand</span>
                          <span>€{pricing.finalPriceWithBTW.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="flex-1 py-3 px-4 rounded-lg border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 transition-colors"
                >
                  Terug
                </button>
                <button
                  type="submit"
                  disabled={isLoading || isProcessingPayment}
                  className="flex-1 py-3 px-4 rounded-lg bg-[#2E47FF] text-white font-medium hover:bg-[#1E37E6] focus:outline-none focus:ring-2 focus:ring-[#2E47FF] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingPayment
                    ? "Verwerken..."
                    : isLoading
                    ? "Creating account..."
                    : selectedPlan !== "free"
                    ? "Account aanmaken en afrekenen"
                    : "Account aanmaken"}
                </button>
              </div>
                </>
              )}
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
