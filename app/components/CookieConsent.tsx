"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  // Check if user is on Dutch pages
  const isDutch = pathname?.startsWith("/nl") || 
                  pathname?.startsWith("/prijzen") || 
                  pathname?.startsWith("/voor-artiesten") || 
                  pathname?.startsWith("/voor-bedrijven") || 
                  pathname?.startsWith("/voor-evenementen") ||
                  pathname?.startsWith("/bevestig-registratie") ||
                  pathname?.startsWith("/hoe-werkt-het");

  useEffect(() => {
    // Don't show on privacy policy pages
    if (pathname?.includes("/privacy")) {
      return;
    }

    // Check if consent has been given
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      // Show after a small delay for better UX
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, [pathname]);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    localStorage.setItem("cookie_consent_timestamp", Date.now().toString());
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookie_consent", "rejected");
    localStorage.setItem("cookie_consent_timestamp", Date.now().toString());
    // Remove non-essential cookies/localStorage items
    // Note: Essential cookies (like Supabase session) should remain
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0">
            <i className="fas fa-cookie-bite text-2xl text-[#2E47FF]"></i>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              {isDutch ? "Cookie-instellingen" : "Cookie Settings"}
            </h3>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-4">
              {isDutch 
                ? "Wij gebruiken cookies om uw ervaring te verbeteren en onze website te analyseren. U kunt kiezen welke cookies u accepteert."
                : "We use cookies to improve your experience and analyze our website. You can choose which cookies to accept."}
            </p>
            <Link
              href={isDutch ? "/nl/privacy" : "/privacy"}
              className="text-sm text-[#2E47FF] hover:underline font-medium"
            >
              {isDutch ? "Lees meer in ons privacybeleid" : "Read more in our privacy policy"}
            </Link>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleReject}
            className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-zinc-50 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            {isDutch ? "Weigeren" : "Reject"}
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 px-4 py-2 bg-[#2E47FF] text-white rounded-lg font-medium hover:bg-[#1E37E6] transition-colors"
          >
            {isDutch ? "Accepteren" : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}

