"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function HowItWorksPage() {
  useEffect(() => {
    document.title = "How it works - Lynqit";
  }, []);

  return (
    <div className="min-h-screen text-zinc-50 dark:text-white font-sans" style={{ background: 'radial-gradient(ellipse at top, #222, transparent)' }}>
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight text-center">
            <span className="block text-white font-bold">
              <span style={{
                backgroundImage: 'linear-gradient(90deg, #3045FF, #07F2EE 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>How it works</span>
            </span>
          </h1>

          {/* 3 Steps */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {/* Step 1 */}
            <div className="text-center">
              <div className="text-6xl font-bold mb-6" style={{
                backgroundImage: 'linear-gradient(90deg, #3045FF, #07F2EE 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                1
              </div>
              <h2 className="text-2xl font-bold mb-4">Sign up</h2>
              <p className="text-zinc-400 dark:text-gray-400 leading-relaxed">
                After signing up, your personal Lynqit page is automatically created. You'll instantly get access to a professionally designed Lynqit via your personal dashboard.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="text-6xl font-bold mb-6" style={{
                backgroundImage: 'linear-gradient(90deg, #3045FF, #07F2EE 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                2
              </div>
              <h2 className="text-2xl font-bold mb-4">Create</h2>
              <p className="text-zinc-400 dark:text-gray-400 leading-relaxed">
                Customize your Lynqit page with everything that matters. From links to your webshop and socials to images, contact details and clear call to actions. Everything organized and clickable in one central place.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="text-6xl font-bold mb-6" style={{
                backgroundImage: 'linear-gradient(90deg, #3045FF, #07F2EE 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                3
              </div>
              <h2 className="text-2xl font-bold mb-4">Share</h2>
              <p className="text-zinc-400 dark:text-gray-400 leading-relaxed">
                Ready to go? Share your unique Lynqit link on Instagram, TikTok, LinkedIn, your email signature or even business cards. Send everyone to everything you offer in just one click.
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <Link
              href="/register"
              className="inline-block px-8 py-4 bg-[#2E47FF] text-white rounded-lg font-semibold text-lg hover:bg-[#1E37E6] transition-colors"
            >
              Start with Lynqit
            </Link>
          </div>
        </div>
      </section>

      {/* Dashboard Section */}
      <section className="py-20 px-4 bg-zinc-800 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-zinc-50 dark:text-white">Dashboard</h2>
          <p className="text-lg text-zinc-300 dark:text-gray-300 mb-6 leading-relaxed">
            After signing up, your personal Lynqit page is <strong className="text-white">automatically created</strong>. You'll instantly get access to a <strong className="text-white">professionally designed Lynqit</strong> that reflects your brand identity.
          </p>
          
          <ul className="space-y-4 mb-8 text-zinc-300 dark:text-gray-300">
            <li className="flex items-start">
              <span className="text-[#00F0EE] mr-3">•</span>
              <span>Add or change links</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#00F0EE] mr-3">•</span>
              <span>Update images, text, and buttons</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#00F0EE] mr-3">•</span>
              <span>See your changes in your preview</span>
            </li>
          </ul>

          <p className="text-lg text-zinc-300 dark:text-gray-300 leading-relaxed">
            Make updates anytime to keep your Lynqit fresh, relevant, and on-brand.
          </p>
        </div>
      </section>

      {/* Insights Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-zinc-50 dark:text-white">Insights</h2>
          <p className="text-lg text-zinc-300 dark:text-gray-300 mb-6 leading-relaxed">
            Your dashboard also gives you access to clear, real-time statistics — so you always know what's working. We track total page views and clicks per button, giving you valuable insight into how your audience interacts with your Lynqit.
          </p>
          
          <p className="text-lg text-zinc-300 dark:text-gray-300 mb-8 leading-relaxed">
            You can filter the data by day, week, month, or a custom date range, helping you spot trends and improve performance.
          </p>

          <ul className="space-y-4 mb-8 text-zinc-300 dark:text-gray-300">
            <li className="flex items-start">
              <span className="text-[#00F0EE] mr-3">•</span>
              <span>See which buttons get the most clicks</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#00F0EE] mr-3">•</span>
              <span>Track total views and engagement over time</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#00F0EE] mr-3">•</span>
              <span>Filter stats by day, week, month or custom period</span>
            </li>
          </ul>

          <p className="text-lg text-zinc-300 dark:text-gray-300 leading-relaxed">
            Stay informed and fine-tune your page based on real results.
          </p>
        </div>
      </section>
    </div>
  );
}

