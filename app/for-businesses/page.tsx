"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ForBusinessesPage() {
  useEffect(() => {
    document.title = "For Businesses - Lynqit";
  }, []);

  return (
    <div className="min-h-screen bg-dark font-sans">
      {/* Hero Section with Gradient Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: 'radial-gradient(circle at 110%, #2F48FE, #000 50%)' }}>
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left column - Text */}
            <div className="z-10">
              <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
                <span className="block text-white font-bold leading-[1]">
                  <span
                    style={{
                      backgroundImage: 'linear-gradient(90deg, #3045FF, #07F2EE 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>FOR BUSINESSES</span>
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-white/80 mb-8">
                Connect all your business links, products, and services in one powerful landing page. Streamline customer engagement and drive conversions.
              </p>
            </div>
            {/* Right column - Image */}
            <div className="z-10 flex justify-center md:justify-end">
              <img 
                src="https://lynqit.nl/wp-content/uploads/2025/06/phones.png" 
                alt="Lynqit for Businesses" 
                className="w-full max-w-md md:max-w-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-16">
            Built for
            <br />
            <span style={{
              backgroundImage: 'linear-gradient(90deg, #3045FF, #07F2EE 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>businesses & brands</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Feature 1 - Featured Links */}
            <div className="rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(135deg, rgb(6,147,227) 0%, rgb(142,209,252) 100%)' }}>
              <div className="mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-star text-4xl text-white"></i>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                <span className="font-extrabold">Featured</span> Links
              </h3>
              <p className="leading-relaxed mb-6">
                Highlight your most important links with featured link cards. Perfect for showcasing products, services, special offers, or key pages. Make it easy for customers to find what they're looking for.
              </p>
              <Link
                href="/register"
                className="inline-block px-6 py-3 bg-white text-[#2E47FF] rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Start with Lynqit
              </Link>
            </div>

            {/* Feature 2 - Social Media Hub */}
            <div className="rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(135deg, rgb(6,147,227) 0%, rgb(155,81,224) 100%)' }}>
              <div className="mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-share-alt text-4xl text-white"></i>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                <span className="font-extrabold">Social</span> Media Hub
              </h3>
              <p className="leading-relaxed mb-6">
                Connect all your social platforms in one place. Instagram, LinkedIn, Facebook, Twitter—link everything your customers need to follow your brand. One click to access all your content.
              </p>
              <Link
                href="/register"
                className="inline-block px-6 py-3 bg-white text-[#2E47FF] rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Start with Lynqit
              </Link>
            </div>

            {/* Feature 3 - Call-to-Action Button */}
            <div className="rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(135deg, rgb(155,81,224) 0%, rgb(6,147,227) 100%)' }}>
              <div className="mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-hand-pointer text-4xl text-white"></i>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                <span className="font-extrabold">Call-to-Action</span> Button
              </h3>
              <p className="leading-relaxed mb-6">
                Drive conversions with a prominent call-to-action button. Direct customers to your main product, service, or contact page. Customize the button text and color to match your brand.
              </p>
              <Link
                href="/register"
                className="inline-block px-6 py-3 bg-white text-[#2E47FF] rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Start with Lynqit
              </Link>
            </div>

            {/* Feature 4 - Contact Information */}
            <div className="rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(135deg, rgb(142,209,252) 0%, rgb(155,81,224) 100%)' }}>
              <div className="mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-address-book text-4xl text-white"></i>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                <span className="font-extrabold">Contact</span> Information
              </h3>
              <p className="leading-relaxed mb-6">
                Display your contact details prominently. Phone number, email address, and more—make it easy for customers to reach you. Build trust and improve customer service.
              </p>
              <Link
                href="/register"
                className="inline-block px-6 py-3 bg-white text-[#2E47FF] rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Start with Lynqit
              </Link>
            </div>

            {/* Feature 5 - Video Header */}
            <div className="rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(135deg, rgb(6,147,227) 0%, rgb(142,209,252) 100%)' }}>
              <div className="mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-video text-4xl text-white"></i>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                <span className="font-extrabold">Video</span> Header
              </h3>
              <p className="leading-relaxed mb-6">
                Make a powerful first impression with a video header. Showcase product demos, company introductions, or brand stories. Bring your business to life and capture attention instantly.
              </p>
              <Link
                href="/register"
                className="inline-block px-6 py-3 bg-white text-[#2E47FF] rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Start with Lynqit
              </Link>
            </div>

            {/* Feature 6 - Analytics & Insights */}
            <div className="rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(135deg, rgb(155,81,224) 0%, rgb(6,147,227) 100%)' }}>
              <div className="mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-chart-line text-4xl text-white"></i>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                <span className="font-extrabold">Analytics</span> & Insights
              </h3>
              <p className="leading-relaxed mb-6">
                Track what works with real-time analytics. See which links get the most clicks, monitor page views, and understand how your audience engages with your content. Make data-driven decisions to grow your business.
              </p>
              <Link
                href="/register"
                className="inline-block px-6 py-3 bg-white text-[#2E47FF] rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Start with Lynqit
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Ready to grow your
            <br />
            <span style={{
              backgroundImage: 'linear-gradient(90deg, #3045FF, #07F2EE 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>business presence?</span>
          </h2>
          <p className="text-xl text-white/80 mb-12">
            Join businesses using Lynqit to connect with customers and drive conversions.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-[#2E47FF] text-white rounded-lg font-semibold text-lg hover:bg-[#1E37E6] transition-colors"
            style={{
              backgroundImage: 'linear-gradient(90deg, #2E47FF 0%, #00F0EE 100%)'
            }}
          >
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
}

