"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ForArtistsPage() {
  useEffect(() => {
    document.title = "For Artists - Lynqit";
  }, []);

  return (
    <div className="min-h-screen bg-dark font-sans">
      {/* Hero Section with Gradient Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: 'radial-gradient(circle at 110%, #2F48FE, #000 50%)' }}>
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left column - Text */}
            <div className="z-10">
              <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
                <span className="block text-white font-bold leading-[1]">
                  <span
                    style={{
                      backgroundImage: 'linear-gradient(90deg, #3045FF, #07F2EE 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>FOR ARTISTS</span>
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-white/80 mb-8">
                Everything you need to connect with your fans, promote your music, and grow your audience—all in one powerful link.
              </p>
            </div>
            {/* Right column - Image */}
            <div className="z-10 flex justify-center md:justify-end">
              <img 
                src="https://lynqit.nl/wp-content/uploads/2025/06/phones.png" 
                alt="Lynqit for Artists" 
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
            }}>musicians & artists</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Feature 1 - Spotify Integration */}
            <div className="rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(135deg, rgb(6,147,227) 0%, rgb(142,209,252) 100%)' }}>
              <div className="mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fab fa-spotify text-4xl text-white"></i>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                <span className="font-extrabold">Spotify</span> Integration
              </h3>
              <p className="leading-relaxed mb-6">
                Embed your latest tracks, albums, or playlists directly on your Lynqit page. Let fans discover and stream your music instantly without leaving your page. Perfect for pre-saves, new releases, and showcasing your best work.
              </p>
              <Link
                href="/register"
                className="inline-block px-6 py-3 bg-white text-[#2E47FF] rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Start with Lynqit
              </Link>
            </div>

            {/* Feature 2 - Shows Calendar */}
            <div className="rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(135deg, rgb(6,147,227) 0%, rgb(155,81,224) 100%)' }}>
              <div className="mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-calendar-alt text-4xl text-white"></i>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                <span className="font-extrabold">Shows</span> Calendar
              </h3>
              <p className="leading-relaxed mb-6">
                Keep your fans in the loop with an integrated shows calendar. Display upcoming concerts, festivals, and events with dates, locations, and direct ticket links. Never miss a chance to connect with your audience.
              </p>
              <Link
                href="/register"
                className="inline-block px-6 py-3 bg-white text-[#2E47FF] rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Start with Lynqit
              </Link>
            </div>

            {/* Feature 3 - Pre-saves & New Releases */}
            <div className="rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(135deg, rgb(155,81,224) 0%, rgb(6,147,227) 100%)' }}>
              <div className="mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-music text-4xl text-white"></i>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                <span className="font-extrabold">Pre-saves</span> & Releases
              </h3>
              <p className="leading-relaxed mb-6">
                Drive pre-saves and promote new releases with featured links and call-to-action buttons. Make it easy for fans to save your music, pre-order albums, and stay updated on your latest work.
              </p>
              <Link
                href="/register"
                className="inline-block px-6 py-3 bg-white text-[#2E47FF] rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Start with Lynqit
              </Link>
            </div>

            {/* Feature 4 - Social Media Hub */}
            <div className="rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(135deg, rgb(142,209,252) 0%, rgb(155,81,224) 100%)' }}>
              <div className="mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-share-alt text-4xl text-white"></i>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                <span className="font-extrabold">Social</span> Media Hub
              </h3>
              <p className="leading-relaxed mb-6">
                Connect all your social platforms in one place. Instagram, TikTok, YouTube, Twitter—link everything your fans need to follow your journey. One click to access all your content.
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
                Make a powerful first impression with a video header. Showcase music videos, live performances, or behind-the-scenes content. Bring your brand to life and capture attention instantly.
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
                Track what works with real-time analytics. See which links get the most clicks, monitor page views, and understand how your audience engages with your content. Make data-driven decisions to grow your fanbase.
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
            }}>artist presence?</span>
          </h2>
          <p className="text-xl text-white/80 mb-12">
            Join thousands of artists using Lynqit to connect with fans and promote their music.
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

