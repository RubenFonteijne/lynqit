"use client";

import { useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ConfirmRegistrationContent() {
  useEffect(() => {
    document.title = "Confirm Registration - Lynqit";
  }, []);

  const searchParams = useSearchParams();
  const email = searchParams.get("email");

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
              Check Your Email
            </h1>
          </div>

          <div className="space-y-4 text-zinc-300">
            <p className="text-center">
              You must first confirm your email. Check your inbox for the confirmation email from Supabase.
            </p>
            {email && (
              <p className="text-center text-sm text-zinc-400">
                We sent a confirmation email to: <span className="text-[#00F0EE]">{email}</span>
              </p>
            )}
            <p className="text-center">
              After confirmation, you can log in. Your Lynqit page has already been created and is ready to edit.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <Link
              href="/login"
              className="block w-full text-center py-3 px-4 bg-gradient-to-r from-[#2E47FF] to-[#00F0EE] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Go to Login
            </Link>
            <Link
              href="/"
              className="block w-full text-center py-3 px-4 border border-zinc-700 text-zinc-300 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmRegistrationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00F0EE] mx-auto"></div>
        </div>
      </div>
    }>
      <ConfirmRegistrationContent />
    </Suspense>
  );
}
