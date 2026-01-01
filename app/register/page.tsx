"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  useEffect(() => {
    document.title = "Registreren - Lynqit";
  }, []);

  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan") as "free" | "start" | "pro" | null;
  const prefillEmail = searchParams.get("email");
  const fromSubscription = searchParams.get("fromSubscription") === "true";
  const fromPayment = searchParams.get("fromPayment") === "true";
  
  const [email, setEmail] = useState(prefillEmail || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [slug, setSlug] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"free" | "start" | "pro">(planParam || "free");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [prefillEmail]);

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

      // Register user if they don't exist
      if (!userExists) {
        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
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
      }

      // Get slug from sessionStorage if available (from payment flow), otherwise use form value
      const finalSlug = fromPayment && sessionStorage.getItem("pending_slug") 
        ? sessionStorage.getItem("pending_slug")!
        : cleanedSlug.trim().toLowerCase();

      // Always create the Lynqit page first (with free plan by default)
      const pageResponse = await fetch("/api/pages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: email,
          slug: finalSlug,
        }),
      });

      const pageData = await pageResponse.json();

      if (!pageResponse.ok) {
        setError(pageData.error || "Kon pagina niet aanmaken");
        setIsLoading(false);
        return;
      }

      const pageId = pageData.page?.id;
      if (!pageId) {
        setError("Pagina aangemaakt maar kon ID niet ophalen");
        setIsLoading(false);
        return;
      }

      // Clear pending slug from sessionStorage
      if (fromPayment) {
        sessionStorage.removeItem("pending_slug");
      }

      // Handle paid plans - create payment via Mollie (with pageId)
      if (selectedPlan !== "free" && !fromPayment) {
        setIsProcessingPayment(true);
        
        // Create payment for subscription with pageId
        const paymentResponse = await fetch("/api/payment/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            plan: selectedPlan,
            pageId: pageId,
          }),
        });

        const paymentData = await paymentResponse.json();

        if (!paymentResponse.ok) {
          setError(paymentData.error || "Kon betaling niet aanmaken");
          setIsLoading(false);
          setIsProcessingPayment(false);
          return;
        }

        // Redirect to Mollie payment page
        if (paymentData.paymentUrl) {
          window.location.href = paymentData.paymentUrl;
        } else {
          setError("Kon betalingslink niet genereren");
          setIsLoading(false);
          setIsProcessingPayment(false);
        }
        return;
      }

      // For free plan - redirect to edit page
      router.push(`/dashboard/pages/${pageId}/edit`);
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md">
          <div className="dark:bg-zinc-900 p-0">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-black dark:text-zinc-50 mb-2">
                Create Account
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Sign up to get started with Lynqit
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                      // Convert to lowercase and replace spaces with hyphens
                      let value = e.target.value.toLowerCase().replace(/\s+/g, "-");
                      
                      // Remove invalid characters (keep only a-z, 0-9, and hyphens)
                      value = value.replace(/[^a-z0-9-]/g, "");
                      
                      // Replace multiple consecutive hyphens with single hyphen
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

              {/* Plan Selection */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Abonnement
                </label>
                <div className="grid grid-cols-3 gap-3">
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
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("start")}
                    className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                      selectedPlan === "start"
                        ? "border-[#2E47FF] bg-blue-50 dark:bg-blue-900/20"
                        : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    }`}
                  >
                    <div className="text-sm font-semibold text-black dark:text-zinc-50">
                      Start
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      €9,95/maand
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("pro")}
                    className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                      selectedPlan === "pro"
                        ? "border-[#2E47FF] bg-blue-50 dark:bg-blue-900/20"
                        : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    }`}
                  >
                    <div className="text-sm font-semibold text-black dark:text-zinc-50">
                      Pro
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      €14,95/maand
                    </div>
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || isProcessingPayment}
                className="w-full py-3 px-4 rounded-lg bg-[#2E47FF] text-white font-medium hover:bg-[#1E37E6] focus:outline-none focus:ring-2 focus:ring-[#2E47FF] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingPayment
                  ? "Verwerken..."
                  : isLoading
                  ? "Creating account..."
                  : selectedPlan !== "free"
                  ? "Account aanmaken en afrekenen"
                  : "Account aanmaken"}
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
