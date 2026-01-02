"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    document.title = "Lynqit - ONE LINK TO RULE THEM ALL";
    
    // Check if there's a password reset token or email confirmation token in the hash
    // Supabase sends recovery tokens in the hash fragment
    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");
      
      // If it's a recovery token, redirect to reset password page
      if (accessToken && type === "recovery") {
        router.replace(`/reset-password${window.location.hash}`);
      }
      
      // If it's an email confirmation token, redirect to account confirmed page
      if (accessToken && type === "signup") {
        // Extract email from URL if available, or get it from the token
        const email = hashParams.get("email") || new URLSearchParams(window.location.search).get("email");
        const pageId = new URLSearchParams(window.location.search).get("pageId");
        
        // Determine language (default to EN)
        const pathname = window.location.pathname;
        const isDutch = pathname?.startsWith("/nl") || pathname?.startsWith("/prijzen") || pathname?.startsWith("/hoe-werkt-het") || pathname?.startsWith("/voor-artiesten");
        const confirmPage = isDutch ? "/account-bevestigd" : "/account-confirmed";
        
        const params = new URLSearchParams();
        if (email) params.set("email", email);
        if (pageId) params.set("pageId", pageId);
        
        router.replace(`${confirmPage}?${params.toString()}`);
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-dark font-sans">
      {/* Hero Section with Gradient Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: 'radial-gradient(circle at 110%, #2F48FE, #000 50%)' }}>
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="items-center">
            {/* Left side - Text content */}
            <div className="text-center z-10">
              <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
                <span className="block text-white font-bold leading-[1]">
                  <span
                  style={{
                    backgroundImage: 'linear-gradient(90deg, #3045FF, #07F2EE 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>ONE LINK</span>
                  <br /> TO RULE THEM ALL
                </span>
              </h1>
              <img 
                src="https://lynqit.nl/wp-content/uploads/2025/06/phones.png" 
                alt="Lynqit Phone" 
                className="w-1/2 mx-auto mb-8 -mt-12"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-16">
            Discover Lynqit's
            <br />
            key features
          </h2>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Feature 1 */}
            <div className="rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(135deg, rgb(6,147,227) 0%, rgb(142,209,252) 100%)' }}>
              <div className="mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
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
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                The <span className="font-extrabold">power</span> of one link
              </h3>
              <p className="leading-relaxed mb-6">
                With Lynqit, you bundle all your important links on one professional page in your own style. Website, socials, contact details and featured services, locations or actions. Everything organized clearly.
                <br />
                <br />
                <span className="font-bold">One link for maximum impact.</span>
              </p>
              <Link
                href="/pricing"
                className="inline-block px-6 py-3 bg-white text-[#2E47FF] rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Start with Lynqit
              </Link>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(135deg, rgb(6,147,227) 0%, rgb(155,81,224) 100%)' }}>
              <div className="mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                <span className="font-extrabold">Convert</span> and{" "}
                <span className="font-extrabold">grow</span>
              </h3>
              <p className="leading-relaxed">
                Turn every click into real results. Transform your links into actions that grow your followers, increase engagement and boost your revenue. Make it easy for your audience to find what they're looking for.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(135deg, rgb(155,81,224) 0%, rgb(6,147,227) 100%)' }}>
              <div className="mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
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
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                Go for <span className="font-extrabold">more</span>
              </h3>
              <p className="leading-relaxed">
                Bring your brand to life with a powerful video header, a real eye-catcher that enhances the complete brand experience. Promote products, launches or events with strong visuals and a clear focus on clicks. Get insights with real-time data from Lynqit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-4xl md:text-5xl font-bold text-white italic">
            "You Lynq It, we convert it."
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            <div className="text-2xl font-bold">Lynqit</div>
            <div className="flex flex-wrap gap-6 justify-center">
              <Link
                href="/terms"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Terms & Conditions
              </Link>
              <Link
                href="/privacy"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/support"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Support
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center font-sm">
            <p className="text-gray-400 text-sm">
              Copyright © 2025 Lynqit. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
