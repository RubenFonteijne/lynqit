"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export default function Home3() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    document.title = "Lynqit - ONE LINK TO RULE THEM ALL";

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
  }, []);

  return (
    <div className="min-h-screen bg-black font-sans">
      {/* Hero Section with Video Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#2E47FF]/80 to-black/80 z-10"></div>
          <div className="w-full h-full bg-gradient-to-br from-[#2E47FF] to-black"></div>
        </div>

        <div className="container mx-auto px-4 py-20 md:py-32 relative z-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center md:text-left animate-fade-in-up">
              <p className="text-lg md:text-xl text-[#00F0EE] mb-4 font-semibold tracking-wider">
                WELCOME TO LYNQIT
              </p>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
                <span className="block text-white mb-2">
                  <span
                    style={{
                      backgroundImage: 'linear-gradient(90deg, #3045FF, #07F2EE 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    ONE LINK
                  </span>
                </span>
                <span className="block text-white">TO RULE THEM ALL</span>
              </h1>
              <p className="text-xl md:text-2xl text-zinc-300 mb-8 max-w-2xl">
                Bundle all your important links on one professional page. Website, socials, contact details and featured services—everything organized clearly. One link for maximum impact.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-center md:items-start">
                <Link
                  href="/pricing"
                  className="px-8 py-4 bg-[#2E47FF] text-white rounded-lg font-semibold text-lg hover:bg-[#1E37E6] transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Get Started
                </Link>
                <a
                  href="mailto:info@lynqit.io"
                  className="px-6 py-4 bg-black/50 border border-[#2E47FF] text-[#2E47FF] rounded-lg font-semibold text-lg hover:bg-[#2E47FF] hover:text-white transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21.4633 17.4297C20.7805 16.857 16.7758 14.3211 16.1102 14.4375C15.7977 14.493 15.5586 14.7594 14.9188 15.5227C14.6229 15.8983 14.2979 16.2502 13.9469 16.575C13.3037 16.4196 12.6812 16.1889 12.0922 15.8875C9.7823 14.7629 7.91612 12.8962 6.79219 10.5859C6.49081 9.9969 6.26005 9.3744 6.10469 8.73125C6.42948 8.38023 6.78134 8.05527 7.15703 7.75938C7.91953 7.11953 8.1867 6.88203 8.2422 6.56797C8.3586 5.90078 5.82031 1.89766 5.25 1.21484C5.01094 0.932027 4.79375 0.742188 4.51562 0.742188C3.70937 0.742188 0.0625 5.25156 0.0625 5.83594C0.0625 5.88359 0.14062 10.5781 6.06953 16.6102C12.1016 22.5391 16.7961 22.6172 16.8438 22.6172C17.4281 22.6172 21.9375 18.9703 21.9375 18.1641C21.9375 17.8859 21.7477 17.6688 21.4633 17.4297Z" />
                  </svg>
                  Need help! info@lynqit.io
                </a>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <img
                src="https://lynqit.nl/wp-content/uploads/2025/06/phones.png"
                alt="Lynqit"
                className="w-full max-w-lg mx-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Ticker Section */}
      <section className="py-8 px-4 bg-zinc-900 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-12 animate-marquee whitespace-nowrap">
            {[
              { num: "1k+", label: "Active Users" },
              { num: "10k+", label: "Links Created" },
              { num: "50k+", label: "Monthly Clicks" },
              { num: "99%", label: "Uptime" },
              { num: "24/7", label: "Support" },
              { num: "1k+", label: "Active Users" },
              { num: "10k+", label: "Links Created" },
              { num: "50k+", label: "Monthly Clicks" },
              { num: "99%", label: "Uptime" },
              { num: "24/7", label: "Support" },
            ].map((stat, i) => (
              <div key={i} className="flex-shrink-0 text-center flex items-center gap-2">
                <span className="text-4xl font-bold text-[#2E47FF]">{stat.num}</span>
                <span className="text-zinc-400">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="scroll-animate" data-animation="slide-in-left">
              <p className="text-[#00F0EE] text-sm font-semibold mb-4 uppercase tracking-wider">ABOUT LYNQIT</p>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                The power of one link
              </h2>
              <p className="text-zinc-400 text-lg mb-6 leading-relaxed">
                With Lynqit, you bundle all your important links on one professional page in your own style. Website, socials, contact details and featured services, locations or actions. Everything organized clearly.
              </p>
              <blockquote className="border-l-4 border-[#2E47FF] pl-6 my-8 text-xl text-white italic">
                "You Lynq It, we convert it."
              </blockquote>
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

      {/* Services Section */}
      <section className="py-20 px-4 bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 scroll-animate" data-animation="fade-in-up">
            <p className="text-[#00F0EE] text-sm font-semibold mb-4 uppercase tracking-wider">FOR EVERYONE</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Perfect for businesses, artists, events, and more
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
                title: "For Businesses",
                description: "Connect all your business links, products, and services in one powerful landing page. Streamline customer engagement and drive conversions."
              },
              {
                icon: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3",
                title: "For Artists",
                description: "Everything you need to connect with your fans, promote your music, and grow your audience. From Spotify integration to shows calendars."
              },
              {
                icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
                title: "For Events",
                description: "Create the perfect landing page for your events. Showcase dates, locations, and ticket links all in one place."
              }
            ].map((service, i) => (
              <div key={i} className="bg-black rounded-2xl p-8 border border-zinc-800 hover:border-[#2E47FF] transition-colors scroll-animate" data-animation="fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-16 h-16 bg-[#2E47FF]/20 rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-[#2E47FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={service.icon} />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{service.title}</h3>
                <p className="text-zinc-400 mb-6">{service.description}</p>
                <Link href="/pricing" className="text-[#2E47FF] hover:text-[#00F0EE] font-semibold">
                  Read More →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 scroll-animate" data-animation="slide-in-left">
              <img
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop"
                alt="Lynqit Analytics"
                className="w-full rounded-2xl"
              />
            </div>
            <div className="order-1 md:order-2 scroll-animate" data-animation="slide-in-right">
              <p className="text-[#00F0EE] text-sm font-semibold mb-4 uppercase tracking-wider">KEY FEATURES</p>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Convert and grow with every click
              </h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                Turn every click into real results. Transform your links into actions that grow your followers, increase engagement and boost your revenue.
              </p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#2E47FF]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#2E47FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Video Headers</h3>
                    <p className="text-zinc-400">
                      Bring your brand to life with a powerful video header, a real eye-catcher that enhances the complete brand experience.
                    </p>
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
                    <p className="text-zinc-400">
                      Get insights with real-time data from Lynqit. Track clicks, engagement, and conversions to optimize your performance.
                    </p>
                  </div>
                </div>
              </div>
              <Link
                href="/pricing"
                className="inline-block mt-8 px-6 py-3 bg-[#2E47FF] text-white rounded-lg font-semibold hover:bg-[#1E37E6] transition-colors"
              >
                Start Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 px-4 bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 scroll-animate" data-animation="fade-in-up">
            <p className="text-[#00F0EE] text-sm font-semibold mb-4 uppercase tracking-wider">WHY CHOOSE LYNQIT</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              One link for maximum impact
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1", title: "One Link", desc: "Bundle all your important links on one professional page in your own style." },
              { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", title: "Real-Time Analytics", desc: "Track clicks, engagement, and conversions with detailed insights." },
              { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", title: "Easy Setup", desc: "Get started in minutes with our intuitive dashboard and customizable templates." },
              { icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z", title: "Professional Templates", desc: "Choose from beautiful, customizable templates designed for every use case." }
            ].map((item, i) => (
              <div key={i} className="bg-black rounded-2xl p-8 border border-zinc-800 scroll-animate" data-animation="scale-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-16 h-16 bg-[#2E47FF]/20 rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-[#2E47FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                <p className="text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 scroll-animate" data-animation="fade-in-up">
            <p className="text-[#00F0EE] text-sm font-semibold mb-4 uppercase tracking-wider">HOW IT WORKS</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Get started in three simple steps
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: "01", title: "Sign Up & Choose Plan", desc: "Create your account and select the perfect plan for your needs.", items: ["Free plan available", "No credit card required", "Instant access"] },
              { num: "02", title: "Customize Your Page", desc: "Add your links, customize your design, and make it your own.", items: ["Choose a template", "Add your links", "Customize colors & fonts"] },
              { num: "03", title: "Share & Track", desc: "Share your Lynqit link and track performance with real-time analytics.", items: ["Share on social media", "Track clicks & engagement", "Optimize performance"] }
            ].map((step, i) => (
              <div key={i} className="text-center scroll-animate" data-animation="fade-in-up" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="w-20 h-20 bg-[#2E47FF] rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white">
                  {step.num}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                <p className="text-zinc-400 mb-6">{step.desc}</p>
                <ul className="text-left text-zinc-400 space-y-2">
                  {step.items.map((item, j) => (
                    <li key={j}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Facts Section */}
      <section className="py-20 px-4 bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 scroll-animate" data-animation="fade-in-up">
            <p className="text-[#00F0EE] text-sm font-semibold mb-4 uppercase tracking-wider">LYNQIT BY NUMBERS</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Growing together with our community
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Join thousands of users who trust Lynqit to manage their links and grow their online presence.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: "1k+", label: "Active users" },
              { num: "10k+", label: "Links created" },
              { num: "50k+", label: "Monthly clicks" },
              { num: "99%", label: "Uptime guarantee" }
            ].map((fact, i) => (
              <div key={i} className="text-center bg-black rounded-2xl p-8 border border-zinc-800 scroll-animate" data-animation="scale-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <h3 className="text-5xl font-bold text-[#2E47FF] mb-2">{fact.num}</h3>
                <p className="text-zinc-400">{fact.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 scroll-animate" data-animation="fade-in-up">
            <p className="text-[#00F0EE] text-sm font-semibold mb-4 uppercase tracking-wider">PRICING PLANS</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Choose the perfect plan for you
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: "Lynqit Basis", price: "Free", features: ["Links to social media", "5 Customizable links", "Statistics", "Basic support"] },
              { name: "Lynqit Start", price: "9.95", popular: true, features: ["Everything in Basis", "10 Customizable links", "2 Featured links", "Contact details", "Call-to-action", "Priority support"] },
              { name: "Lynqit Pro", price: "14.95", features: ["Everything in Start", "20 Customizable links", "4 Featured links", "Template selection", "Video header", "Promo block", "24/7 Support"] }
            ].map((plan, i) => (
              <div
                key={i}
                className={`rounded-2xl p-8 border-2 scroll-animate ${
                  plan.popular
                    ? "bg-gradient-to-br from-[#2E47FF] to-[#00F0EE] border-[#2E47FF] relative"
                    : "bg-zinc-900 border-zinc-800"
                }`}
                data-animation="scale-in"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                {plan.popular && (
                  <div className="absolute top-4 right-4 bg-white text-[#2E47FF] px-3 py-1 rounded-full text-xs font-bold">
                    POPULAR
                  </div>
                )}
                <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? "text-white" : "text-white"}`}>
                  {plan.name}
                </h3>
                <p className={`mb-6 ${plan.popular ? "text-white/80" : "text-zinc-400"}`}>
                  {plan.price === "Free" ? "Forever" : "Per month ex VAT"}
                </p>
                <div className="mb-6">
                  {plan.price !== "Free" && (
                    <span className={`text-5xl font-bold ${plan.popular ? "text-white" : "text-white"}`}>€</span>
                  )}
                  <span className={`text-5xl font-bold ${plan.popular ? "text-white" : "text-white"}`}>{plan.price === "Free" ? "Free" : plan.price}</span>
                </div>
                <ul className={`space-y-4 mb-8 ${plan.popular ? "text-white" : "text-zinc-400"}`}>
                  {plan.features.map((feature, j) => (
                    <li key={j}>• {feature}</li>
                  ))}
                </ul>
                <Link
                  href="/pricing"
                  className={`block w-full text-center px-6 py-3 rounded-lg font-semibold transition-colors ${
                    plan.popular
                      ? "bg-white text-[#2E47FF] hover:bg-zinc-100"
                      : "bg-[#2E47FF] text-white hover:bg-[#1E37E6]"
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-8 text-zinc-400">
            <p>• Free plan available forever</p>
            <p>• No hidden fees</p>
            <p>• Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 scroll-animate" data-animation="fade-in-up">
            <p className="text-[#00F0EE] text-sm font-semibold mb-4 uppercase tracking-wider">TESTIMONIALS</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              What our clients say about us
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { quote: "Lynqit has completely transformed how I share my music. One link for everything - Spotify, shows, merch. My fans love it!", name: "Sarah M.", role: "Musician" },
              { quote: "As a small business owner, Lynqit helps me organize all my links professionally. The analytics are incredibly useful!", name: "Mike T.", role: "Business Owner" },
              { quote: "Perfect for our events! We can showcase dates, locations, and ticket links all in one place. Highly recommend!", name: "Emma L.", role: "Event Organizer" },
              { quote: "The video header feature makes our page stand out. Our engagement has increased significantly since using Lynqit.", name: "David K.", role: "Content Creator" }
            ].map((testimonial, i) => (
              <div key={i} className="bg-black rounded-2xl p-8 border border-zinc-800 scroll-animate" data-animation="fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <p className="text-zinc-400 mb-6 italic">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#2E47FF]/20 rounded-full flex items-center justify-center">
                    <span className="text-[#2E47FF] font-bold">{testimonial.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">{testimonial.name}</p>
                    <p className="text-zinc-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 scroll-animate" data-animation="fade-in-up">
            <p className="text-[#00F0EE] text-sm font-semibold mb-4 uppercase tracking-wider">FAQ</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Frequently asked questions
            </h2>
            <h3 className="text-2xl font-semibold text-white mb-8">
              Have Questions? We're Here To Help You!
            </h3>
            <a href="mailto:info@lynqit.io" className="text-[#2E47FF] hover:text-[#00F0EE] text-xl font-semibold">
              info@lynqit.io
            </a>
          </div>
          <div className="space-y-4">
            {[
              { q: "How do I get started with Lynqit?", a: "Simply sign up for a free account, choose a template, and start adding your links. No credit card required for the free plan!" },
              { q: "Can I customize my Lynqit page?", a: "Yes! You can customize colors, fonts, add a video header, and choose from multiple templates. Pro plans offer even more customization options." },
              { q: "What analytics do you provide?", a: "Lynqit provides real-time analytics including click counts, engagement metrics, and conversion tracking to help you optimize your page performance." },
              { q: "Can I use Lynqit for my business?", a: "Absolutely! Lynqit is perfect for businesses, artists, events, hotels, creators, and more. We have templates designed for every use case." },
              { q: "Is there a free plan?", a: "Yes! Our Lynqit Basis plan is completely free forever, with access to core features including social media links, basic analytics, and customizable links." },
            ].map((faq, i) => (
              <div key={i} className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 scroll-animate" data-animation="fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <h4 className="text-xl font-semibold text-white mb-3">{faq.q}</h4>
                <p className="text-zinc-400">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#2E47FF] to-[#00F0EE]">
        <div className="max-w-4xl mx-auto text-center scroll-animate" data-animation="fade-in-up">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            READY TO GET STARTED?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of users who trust Lynqit to manage their links and grow their online presence. Start free today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="inline-block px-8 py-4 bg-white text-[#2E47FF] rounded-lg font-semibold text-lg hover:bg-zinc-100 transition-colors"
            >
              View Pricing
            </Link>
            <Link
              href="/register"
              className="inline-block px-8 py-4 bg-black/50 border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white hover:text-[#2E47FF] transition-colors"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

