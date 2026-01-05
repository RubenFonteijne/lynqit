"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

function PaymentForm({ clientSecret, subscriptionId }: { clientSecret: string; subscriptionId: string | null }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = searchParams.get("email");
  const plan = searchParams.get("plan");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Payment method not found");
      setIsProcessing(false);
      return;
    }

    try {
      // Confirm payment with the card element
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: email || undefined,
            },
          },
        }
      );

      if (confirmError) {
        setError(confirmError.message || "Payment failed");
        setIsProcessing(false);
        return;
      }

      if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "requires_capture") {
        // Payment successful - redirect to success page
        const baseUrl = window.location.origin;
        router.push(
          `/payment/success?email=${encodeURIComponent(email || "")}&plan=${plan || ""}&provider=stripe&subscriptionId=${subscriptionId || ""}`
        );
      } else {
        setError("Payment status: " + paymentIntent?.status);
        setIsProcessing(false);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during payment");
      setIsProcessing(false);
    }
  };

  // Check if Elements is ready
  if (!stripe || !elements) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-zinc-400">Stripe wordt geladen...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Kaartgegevens
        </label>
        <div className="p-4 rounded-lg border border-zinc-700 bg-zinc-900 min-h-[50px]">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#ffffff",
                  fontFamily: "system-ui, sans-serif",
                  "::placeholder": {
                    color: "#9ca3af",
                  },
                },
                invalid: {
                  color: "#ef4444",
                  iconColor: "#ef4444",
                },
              },
            }}
          />
        </div>
        <p className="text-xs text-zinc-500">
          Je betaling wordt veilig verwerkt door Stripe
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-900/20 border border-red-800">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-3 px-4 rounded-lg bg-[#2E47FF] text-white font-medium hover:bg-[#1E37E6] focus:outline-none focus:ring-2 focus:ring-[#2E47FF] focus:ring-offset-2 focus:ring-offset-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? "Verwerken..." : "Betalen en account aanmaken"}
      </button>
    </form>
  );
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const email = searchParams.get("email");
  const plan = searchParams.get("plan");
  const priceId = searchParams.get("priceId");
  const paymentMethod = searchParams.get("paymentMethod") || "card";
  const discountCode = searchParams.get("discountCode");
  const slug = searchParams.get("slug");
  const password = searchParams.get("password");

  useEffect(() => {
    document.title = "Betaling - Lynqit";
  }, []);

  useEffect(() => {
    const setupPayment = async () => {
      // Check if clientSecret is already in URL (from payment/create)
      const urlClientSecret = searchParams.get("clientSecret");
      const urlSubscriptionId = searchParams.get("subscriptionId");
      
      if (urlClientSecret && urlSubscriptionId) {
        // Use clientSecret from URL - get publishable key from API
        try {
          const keyResponse = await fetch("/api/stripe/publishable-key");
          const keyData = await keyResponse.json();
          
          if (keyData.publishableKey) {
            const stripe = await loadStripe(keyData.publishableKey);
            if (stripe) {
              setStripePromise(stripe);
              setClientSecret(urlClientSecret);
              setSubscriptionId(urlSubscriptionId);
              setIsLoading(false);
              return;
            }
          }
        } catch (err) {
          console.error("Error loading Stripe:", err);
        }
      }

      // Fallback: setup payment via API
      if (!email || !plan || !priceId) {
        setError("Ontbrekende gegevens voor betaling");
        setIsLoading(false);
        return;
      }

      try {
        // Get publishable key and setup payment
        const response = await fetch("/api/stripe/payment/setup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            plan,
            priceId,
            paymentMethod,
            discountCode: discountCode || undefined,
            slug: slug || undefined,
            password: password || undefined,
            createAccount: true,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Kon betaling niet instellen");
          setIsLoading(false);
          return;
        }

        // Initialize Stripe with publishable key
        const stripe = await loadStripe(data.publishableKey);
        if (!stripe) {
          setError("Kon Stripe niet laden");
          setIsLoading(false);
          return;
        }

        setStripePromise(stripe);
        setClientSecret(data.clientSecret);
        setSubscriptionId(data.subscriptionId);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || "Er is een fout opgetreden");
        setIsLoading(false);
      }
    };

    setupPayment();
  }, [email, plan, priceId, paymentMethod, discountCode, slug, password, searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Betaling voorbereiden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-zinc-900 rounded-xl border border-zinc-800 p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-times text-white text-2xl"></i>
            </div>
            <h1 className="text-2xl font-bold mb-2">Fout</h1>
            <p className="text-zinc-400">{error}</p>
          </div>
          <button
            onClick={() => router.push("/register")}
            className="w-full py-3 px-6 rounded-lg bg-[#2E47FF] text-white font-semibold hover:bg-[#1E37E6] transition-colors"
          >
            Terug naar registratie
          </button>
        </div>
      </div>
    );
  }

  if (!stripePromise || !clientSecret) {
    return null;
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "night",
      variables: {
        colorPrimary: "#2E47FF",
        colorBackground: "#18181b",
        colorText: "#ffffff",
        colorDanger: "#ef4444",
        fontFamily: "system-ui, sans-serif",
        spacingUnit: "4px",
        borderRadius: "8px",
      },
    },
  };

  return (
    <div className="min-h-screen bg-black text-white py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Voltooi je betaling</h1>
          <p className="text-zinc-400">
            Vul je betalingsgegevens in om je account aan te maken
          </p>
          {plan && (
            <p className="text-sm text-zinc-500 mt-2">
              Abonnement: <span className="text-zinc-300 font-semibold">{plan.charAt(0).toUpperCase() + plan.slice(1)}</span>
            </p>
          )}
        </div>

        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8 shadow-xl">
          <Elements stripe={stripePromise} options={options}>
            <PaymentForm clientSecret={clientSecret} subscriptionId={subscriptionId} />
          </Elements>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-zinc-500">
            Beveiligd door Stripe • Je gegevens worden versleuteld verzonden
          </p>
        </div>
      </div>
    </div>
  );
}

export default function StripePaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}

