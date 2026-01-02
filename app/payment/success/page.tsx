"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const plan = searchParams.get("plan");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = "Betaling succesvol - Lynqit";
  }, []);

  useEffect(() => {
    const subscriptionId = searchParams.get("subscriptionId");
    const pageId = searchParams.get("pageId");
    
    if (email && plan) {
      // If pageId is provided (upgrade scenario), redirect directly to edit page
      if (pageId) {
        // Wait a moment for webhook to process payment
        setTimeout(() => {
          router.push(`/dashboard/pages/${pageId}/edit`);
        }, 2000);
        return;
      }

      // Wait a moment for webhook to process payment
      // Retry multiple times in case webhook is slow
      let retries = 0;
      const maxRetries = 5;
      
      const checkPaymentStatus = async () => {
        try {
          // Wait for webhook to process, then check pages for active subscription
          const pagesResponse = await fetch(`/api/pages?userId=${encodeURIComponent(email)}`);
          if (pagesResponse.ok) {
            const pagesData = await pagesResponse.json();
            
            if (pagesData.pages && pagesData.pages.length > 0) {
              // Find page with active subscription for this plan
              const paidPage = pagesData.pages.find((p: any) => 
                p.subscriptionPlan === plan && p.subscriptionStatus === "active"
              );
              
              if (paidPage) {
                // Payment confirmed - redirect to edit the paid page
                router.push(`/dashboard/pages/${paidPage.id}/edit`);
                return;
              } else if (pageId) {
                // Check if the specific page still exists (might have been deleted if payment failed)
                const specificPage = pagesData.pages.find((p: any) => p.id === pageId);
                if (!specificPage) {
                  // Page was deleted - payment must have failed
                  setIsLoading(false);
                  return;
                }
              }
              
              // Payment might still be processing, retry
              if (retries < maxRetries) {
                retries++;
                setTimeout(checkPaymentStatus, 2000);
              } else {
                // Max retries reached, redirect to first page anyway
                router.push(`/dashboard/pages/${pagesData.pages[0].id}/edit`);
              }
            } else {
              // No pages - payment might have failed and page was deleted
              // Or user needs to register
              setIsLoading(false);
            }
          } else {
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Error checking payment status:", error);
          setIsLoading(false);
        }
      };
      
      // Start checking after initial delay
      setTimeout(checkPaymentStatus, 2000);
    } else {
      router.push("/");
    }
  }, [email, plan, router, searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Betaling verwerken...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-zinc-900 rounded-xl border border-zinc-800 p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-check text-white text-2xl"></i>
          </div>
          <h1 className="text-3xl font-bold mb-2">Betaling succesvol!</h1>
          <p className="text-zinc-400">
            Je {plan === "start" ? "Start" : "Pro"} abonnement is geactiveerd.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full py-3 px-6 rounded-lg bg-white text-black font-semibold hover:bg-zinc-100 transition-colors"
          >
            Inloggen
          </Link>
          <Link
            href="/"
            className="block w-full py-3 px-6 rounded-lg border border-zinc-700 text-white font-semibold hover:bg-zinc-800 transition-colors"
          >
            Terug naar home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Laden...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

