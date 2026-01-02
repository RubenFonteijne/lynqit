"use client";

import { useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function AccountBevestigdContent() {
  useEffect(() => {
    document.title = "Account Bevestigd - Lynqit";
  }, []);

  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const pageId = searchParams.get("pageId");

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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-[#2E47FF] to-[#00F0EE] bg-clip-text text-transparent">
              Account Bevestigd
            </h1>
          </div>

          <div className="space-y-4 text-zinc-300">
            <p className="text-center">
              Je account is bevestigd! Je kunt nu inloggen en je Lynqit pagina is al aangemaakt.
            </p>
            {email && (
              <p className="text-center text-sm text-zinc-400">
                Bevestigde email: <span className="text-[#00F0EE]">{email}</span>
              </p>
            )}
            {pageId && (
              <p className="text-center text-sm text-zinc-400">
                Je pagina is klaar! Je kunt deze bewerken na het inloggen.
              </p>
            )}
          </div>

          <div className="mt-8 space-y-3">
            <Link
              href="/login"
              className="block w-full text-center py-3 px-4 bg-gradient-to-r from-[#2E47FF] to-[#00F0EE] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Naar Inloggen
            </Link>
            {pageId && (
              <Link
                href={`/dashboard/pages/${pageId}/edit`}
                className="block w-full text-center py-3 px-4 border border-zinc-700 text-zinc-300 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
              >
                Bewerk Je Pagina
              </Link>
            )}
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

export default function AccountBevestigdPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00F0EE] mx-auto"></div>
        </div>
      </div>
    }>
      <AccountBevestigdContent />
    </Suspense>
  );
}

