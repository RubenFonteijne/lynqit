"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const preSelectedPlan = searchParams.get("plan") as "free" | "start" | "pro" | null;
  const [selectedPlan, setSelectedPlan] = useState<"free" | "start" | "pro" | null>(preSelectedPlan);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Abonnement kiezen - Lynqit";
  }, []);

  useEffect(() => {
    if (!email) {
      router.push("/register");
    }
  }, [email, router]);

  const plans = [
    {
      id: "free" as const,
      name: "Lynqit Basis",
      price: "Gratis",
      priceMonthly: null,
      priceExBTW: 0,
      features: [
        { text: "Lynqit pagina", included: true },
        { text: "Links naar social media", included: true },
        { text: "10 links om zelf in te stellen", included: true },
        { text: "Statistieken", included: true },
        { text: "Contactgegevens", included: false },
        { text: "Call-to-action knop", included: false },
        { text: "4 featured links", included: false },
        { text: "Meerdere templates", included: false },
        { text: "Video header", included: false },
        { text: "Promo block", included: false },
        { text: "Verified", included: false },
      ],
    },
    {
      id: "start" as const,
      name: "Lynqit Start",
      price: "€ 9,95",
      priceMonthly: "/maand ex BTW",
      priceExBTW: 9.95,
      features: [
        { text: "Lynqit pagina", included: true },
        { text: "Links naar social media", included: true },
        { text: "10 links om zelf in te stellen", included: true },
        { text: "Statistieken", included: true },
        { text: "Contactgegevens", included: true },
        { text: "Call-to-action knop", included: true },
        { text: "4 featured links", included: true },
        { text: "Meerdere templates", included: false },
        { text: "Video header", included: false },
        { text: "Promo block", included: false },
        { text: "Verified", included: false },
      ],
    },
    {
      id: "pro" as const,
      name: "Lynqit Pro",
      price: "€ 14,95",
      priceMonthly: "/maand ex BTW",
      priceExBTW: 14.95,
      features: [
        { text: "Lynqit pagina", included: true },
        { text: "Links naar social media", included: true },
        { text: "10 links om zelf in te stellen", included: true },
        { text: "Statistieken", included: true },
        { text: "Contactgegevens", included: true },
        { text: "Call-to-action knop", included: true },
        { text: "4 featured links", included: true },
        { text: "Meerdere templates", included: true },
        { text: "Video header", included: true },
        { text: "Promo block", included: true },
        { text: "Verified", included: true },
      ],
    },
  ];

  const handleSelectPlan = async (planId: "free" | "start" | "pro") => {
    if (!email) return;

    setSelectedPlan(planId);
    setIsLoading(true);
    setError("");

    try {
      if (planId === "free") {
        // Free plan - update subscription and redirect to register to create page
        const response = await fetch("/api/subscription/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            plan: "free",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "An error occurred");
          setIsLoading(false);
          return;
        }

        // Redirect to register page to create the Lynqit page (user needs to fill in slug)
        router.push(`/register?email=${encodeURIComponent(email)}&plan=free&fromSubscription=true`);
      } else {
        // Paid plan - create payment
        const response = await fetch("/api/payment/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            plan: planId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "An error occurred");
          setIsLoading(false);
          return;
        }

        // Redirect to Mollie payment page (first payment for SEPA mandate)
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          setError("Kon betalingslink niet genereren");
          setIsLoading(false);
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
          Kies je plan
        </h1>
        <p className="text-center text-zinc-400 mb-12">
          Welkom {email}! Kies het abonnement dat bij jou past.
        </p>

        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 rounded-lg bg-red-900/20 border border-red-800">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-zinc-900 rounded-xl border ${
                selectedPlan === plan.id
                  ? "border-blue-500"
                  : "border-zinc-800"
              } p-6 lg:p-8 flex flex-col`}
            >
              {/* Plan Name */}
              <h2 className="text-2xl font-semibold text-white mb-6">
                {plan.name}
              </h2>

              {/* Price Display */}
              <div
                className="rounded-lg p-6 mb-6 text-center"
                style={{
                  background: "linear-gradient(135deg, rgb(6,147,227) 0%, rgb(155,81,224) 100%)",
                }}
              >
                <div className="text-3xl lg:text-4xl font-bold text-white">
                  {plan.price}
                </div>
                {plan.priceMonthly && (
                  <div className="text-lg text-white mt-1">
                    {plan.priceMonthly}
                  </div>
                )}
              </div>

              {/* Features List */}
              <div className="flex-grow space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-3">
                    {feature.included ? (
                      <i
                        className="fas fa-check mt-1 flex-shrink-0"
                        style={{ color: "rgb(6,147,227)" }}
                      ></i>
                    ) : (
                      <i
                        className="fas fa-times mt-1 flex-shrink-0"
                        style={{ color: "#000" }}
                      ></i>
                    )}
                    <span className="text-white text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* Select Button */}
              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={isLoading}
                className="w-full py-3 px-6 rounded-lg border border-black bg-white text-black font-semibold uppercase hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading && selectedPlan === plan.id
                  ? "Verwerken..."
                  : "SELECTEER"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

