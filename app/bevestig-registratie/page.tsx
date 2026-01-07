"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientClient } from "@/lib/supabase-client";

function BevestigRegistratieContent() {
  useEffect(() => {
    document.title = "Bevestig Registratie - Lynqit";
  }, []);

  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const pageId = searchParams.get("pageId");
  
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !verificationCode.trim()) {
      setVerificationError("Voer de verificatiecode in");
      return;
    }

    setIsVerifying(true);
    setVerificationError("");
    setVerificationSuccess(false);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          token: verificationCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setVerificationError(data.error || "Ongeldige verificatiecode");
        setIsVerifying(false);
        return;
      }

      // Store user info in localStorage
      if (data.user) {
        localStorage.setItem("lynqit_user", JSON.stringify(data.user));
      }

      // Set session in Supabase client so it persists correctly
      if (data.session) {
        try {
          const supabase = createClientClient();
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
          
          if (sessionError) {
            console.error("Error setting Supabase session:", sessionError);
            // Fallback: store in localStorage as backup
            localStorage.setItem("supabase.auth.token", JSON.stringify({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_at: data.session.expires_at,
            }));
          }
        } catch (e) {
          console.error("Error setting session:", e);
          // Fallback: store in localStorage as backup
          if (data.session) {
            try {
              localStorage.setItem("supabase.auth.token", JSON.stringify({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at,
              }));
            } catch (localStorageError) {
              // Ignore localStorage errors
            }
          }
        }
      }

      setVerificationSuccess(true);
      
      // Redirect to appropriate page
      if (pageId) {
        router.push(`/dashboard/pages/${pageId}/edit`);
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationError("Er is een fout opgetreden. Probeer het opnieuw.");
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#2E47FF] to-[#00F0EE] flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-[#2E47FF] to-[#00F0EE] bg-clip-text text-transparent">
              Check Je Email
            </h1>
          </div>

          <div className="space-y-4 text-zinc-300">
            <p className="text-center">
              Je moet eerst je email bevestigen. Check je inbox voor de bevestigingsmail van Supabase.
            </p>
            {email && (
              <p className="text-center text-sm text-zinc-400">
                We hebben een bevestigingsmail gestuurd naar: <span className="text-[#00F0EE]">{email}</span>
              </p>
            )}
            <p className="text-center">
              Na bevestiging kun je inloggen. Je Lynqit pagina is al aangemaakt en klaar om te bewerken.
            </p>
          </div>

          {/* Verification Code Input */}
          <div className="mt-6">
            <form onSubmit={handleVerifyCode} className="space-y-3">
              <label
                htmlFor="verificationCode"
                className="block text-sm font-medium text-zinc-300 mb-2"
              >
                Voer Verificatiecode In
              </label>
              <div className="flex gap-2">
                <input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                  placeholder="123456"
                  maxLength={6}
                  className="flex-1 px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#2E47FF] focus:border-transparent transition-colors text-center text-lg tracking-widest font-mono"
                />
                <button
                  type="submit"
                  disabled={isVerifying || !verificationCode.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-[#2E47FF] to-[#00F0EE] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? "Verifiëren..." : "Verifiëren"}
                </button>
              </div>
              {verificationError && (
                <p className="text-sm text-red-400">{verificationError}</p>
              )}
              {verificationSuccess && (
                <p className="text-sm text-green-400">Email succesvol geverifieerd! Doorverwijzen...</p>
              )}
            </form>
          </div>

          <div className="mt-8 space-y-3">
            <Link
              href="/login"
              className="block w-full text-center py-3 px-4 bg-gradient-to-r from-[#2E47FF] to-[#00F0EE] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Naar Inloggen
            </Link>
            <Link
              href="/"
              className="block w-full text-center py-3 px-4 border border-zinc-700 text-zinc-300 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
            >
              Terug naar Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BevestigRegistratiePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00F0EE] mx-auto"></div>
        </div>
      </div>
    }>
      <BevestigRegistratieContent />
    </Suspense>
  );
}
