"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TabsSection from "@/app/components/TabsSection";

// Burido Text Reveal Component - Each word animates individually
function BuridoTextReveal({ text, className = "" }: { text: string; className?: string }) {
  const [visibleWords, setVisibleWords] = useState<number[]>([]);
  const words = text.split(" ");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && visibleWords.length === 0) {
            startReveal();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [visibleWords.length]);

  const startReveal = () => {
    words.forEach((_, index) => {
      setTimeout(() => {
        setVisibleWords((prev) => [...prev, index]);
      }, index * 80); // 80ms delay between each word
    });
  };

  return (
    <div ref={containerRef} className={className}>
      <div className="flex flex-wrap justify-center gap-x-2 gap-y-2">
        {words.map((word, index) => (
          <span
            key={index}
            className={`inline-block transition-all duration-500 ${
              visibleWords.includes(index)
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
            style={{
              transitionDelay: `${index * 80}ms`,
            }}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const observerRef = useRef<IntersectionObserver | null>(null);

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

    // Setup Intersection Observer for scroll animations
    const setupObserver = () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const element = entry.target as HTMLElement;
              const animationType = element.getAttribute("data-animation") || "fade-in-up";
              element.classList.add(`animate-${animationType}`);
              element.classList.add("visible");
              // Unobserve after animation to prevent re-triggering
              observerRef.current?.unobserve(element);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: "0px 0px -50px 0px",
        }
      );

      // Observe all elements with scroll-animate class
      const animatedElements = document.querySelectorAll(".scroll-animate");
      animatedElements.forEach((el) => {
        observerRef.current?.observe(el);
      });
    };

    // Setup observer after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(setupObserver, 100);

    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-transparent font-sans">
      {/* Wrapper for Hero and Text Reveal with continuous gradient */}
      <div className="relative">
        {/* Hero gradient background - spans hero and text reveal sections */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 110%, #2F48FE, #000 50%)',
            minHeight: '100%',
          }}
        />
        
        {/* Hero Section with Gradient Background */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden z-10">
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

        {/* Text Reveal Section - Lynqit Introduction */}
        <section className="py-20 px-4 bg-transparent relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center px-4">
            <BuridoTextReveal
              text="Clicks don't matter if they don't convert. Lynqit turns traffic into action and attention into customers. Every click has a purpose. Every visit drives results. This is where clicks become customers."
              className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight max-w-5xl mx-auto"
            />
          </div>
        </div>
      </section>
      </div>

      {/* Wrapper for sections with continuous gradient */}
      <div className="relative">
        {/* Radial gradient background - spans multiple sections */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(30, 47, 255, 0.4) 0%, transparent 70%)',
            minHeight: '100%',
          }}
        />
        
        {/* About Lynqit Section */}
        <section className="py-20 px-4 bg-transparent relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="scroll-animate" data-animation="slide-in-left">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  The power of one link
                </h2>
                <p className="text-zinc-400 text-lg mb-6 leading-relaxed">
                  With Lynqit, you bundle all your important links on one professional page in your own style. Website, socials, contact details and featured services, locations or actions. Everything organized clearly.
                </p>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#2E47FF]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-[#2E47FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">One Link for Everything</h3>
                      <p className="text-zinc-400">Connect all your important links, social media, and contact information in one place.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#2E47FF]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-[#2E47FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Real-Time Analytics</h3>
                      <p className="text-zinc-400">Track clicks, engagement, and conversions with detailed analytics and insights.</p>
                    </div>
                  </div>
                </div>
                <Link
                  href="/pricing"
                  className="inline-block mt-8 px-6 py-3 bg-[#2E47FF] text-white rounded-lg font-semibold hover:bg-[#1E37E6] transition-colors"
                >
                  Get Started
                </Link>
              </div>
              <div className="relative scroll-animate" data-animation="slide-in-right">
                <img
                  src="https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop"
                  alt="Lynqit Dashboard"
                  className="w-full rounded-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-transparent relative z-10">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-16 scroll-animate" data-animation="fade-in-up">
              Discover Lynqit's
              <br />
              key features
            </h2>

            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Feature 1 */}
            <div className="rounded-2xl p-8 text-white scroll-animate" data-animation="fade-in-up" style={{ animationDelay: "0.1s", background: 'linear-gradient(135deg, rgb(6,147,227) 0%, rgb(142,209,252) 100%)' }}>
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
            <div className="rounded-2xl p-8 text-white scroll-animate" data-animation="fade-in-up" style={{ animationDelay: "0.2s", background: 'linear-gradient(135deg, rgb(6,147,227) 0%, rgb(155,81,224) 100%)' }}>
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
            <div className="rounded-2xl p-8 text-white scroll-animate" data-animation="fade-in-up" style={{ animationDelay: "0.3s", background: 'linear-gradient(135deg, rgb(155,81,224) 0%, rgb(6,147,227) 100%)' }}>
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

      {/* Tabs Section */}
      <div className="scroll-animate relative z-10" data-animation="fade-in-up">
        <TabsSection
          tabs={[
          {
            id: "businesses",
            label: "For businesses",
            content: {
              title: "For Businesses",
              description: "Connect all your business links, products, and services in one powerful landing page. Streamline customer engagement, showcase your offerings, and drive conversions with a professional Lynqit page tailored for your business needs.",
              image: "https://zafemwpgbkciuozaxtgs.supabase.co/storage/v1/object/public/lynqit-uploads/uploads/dreamcamper%20lynqit.jpg"
            }
          },
          {
            id: "artists",
            label: "For artists",
            content: {
              title: "For Artists",
              description: "Everything you need to connect with your fans, promote your music, and grow your audience. From Spotify integration to shows calendars, pre-saves to social media hubs—all in one powerful link designed for musicians.",
              image: "https://lynqit.nl/wp-content/uploads/2025/06/phones.png"
            }
          },
          {
            id: "events",
            label: "For events",
            content: {
              title: "For Events",
              description: "Create the perfect landing page for your events. Showcase dates, locations, and ticket links all in one place. Make event promotion simple and effective with a dedicated events template built for organizers.",
              image: "https://lynqit.nl/wp-content/uploads/2025/06/phones.png"
            }
          },
          {
            id: "hotels",
            label: "For hotels",
            content: {
              title: "For Hotels",
              description: "Showcase your hotel, rooms, amenities, and booking links in one elegant page. Connect guests to your website, social media, reviews, and direct booking platforms. Perfect for hospitality businesses looking to streamline their online presence.",
              image: "https://zafemwpgbkciuozaxtgs.supabase.co/storage/v1/object/public/lynqit-uploads/uploads/Lynqit-Atrium.jpg"
            }
          },
          {
            id: "creators",
            label: "For creators",
            content: {
              title: "For Creators",
              description: "Build your creator brand with a professional link page. Connect all your content, social platforms, merchandise, and collaboration links. Perfect for influencers, YouTubers, and content creators who want to maximize their reach.",
              image: "https://lynqit.nl/wp-content/uploads/2025/06/phones.png"
            }
          }
          ]}
          pricingLink="/pricing"
        />
      </div>
      </div>

      {/* Quote Section */}
      <section className="py-20 px-4 bg-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-4xl md:text-5xl font-bold text-white italic scroll-animate" data-animation="fade-in-up">
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
