"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Home2() {
  useEffect(() => {
    document.title = "Lynqit - ONE LINK TO RULE THEM ALL";
  }, []);

  return (
    <div className="min-h-screen bg-black font-sans">
      {/* Preloader - Skip to content */}
      <div className="skip-to-content sr-only">
        <a href="#main-content">Skip to content</a>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: 'radial-gradient(circle at 110%, #2E47FF, #000 50%)' }}>
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="text-center z-10">
            <p className="text-lg md:text-xl text-[#00F0EE] mb-4 font-medium">WELCOME TO LYNQIT</p>
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
            <p className="text-xl md:text-2xl text-zinc-300 mb-8 max-w-3xl mx-auto">
              We combine innovation and creativity to craft solutions that drive success and inspire growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/pricing"
                className="px-8 py-4 bg-[#2E47FF] text-white rounded-lg font-semibold text-lg hover:bg-[#1E37E6] transition-colors"
              >
                Get Started
              </Link>
              <a
                href="mailto:info@lynqit.io"
                className="px-8 py-4 border-2 border-[#2E47FF] text-[#2E47FF] rounded-lg font-semibold text-lg hover:bg-[#2E47FF] hover:text-white transition-colors"
              >
                Need help! info@lynqit.io
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="text-4xl md:text-5xl font-bold text-[#2E47FF] mb-2">0k+</h3>
              <p className="text-zinc-400">Happy Customers</p>
            </div>
            <div>
              <h3 className="text-4xl md:text-5xl font-bold text-[#2E47FF] mb-2">0</h3>
              <p className="text-zinc-400">Active Pages</p>
            </div>
            <div>
              <h3 className="text-4xl md:text-5xl font-bold text-[#2E47FF] mb-2">0</h3>
              <p className="text-zinc-400">Countries</p>
            </div>
            <div>
              <h3 className="text-4xl md:text-5xl font-bold text-[#2E47FF] mb-2">0</h3>
              <p className="text-zinc-400">Team Members</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="main-content" className="py-20 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[#00F0EE] text-sm font-semibold mb-4 uppercase tracking-wider">ABOUT US</p>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Designing experiences, empowering your brand
              </h2>
              <p className="text-zinc-400 text-lg mb-6 leading-relaxed">
                We specialize in creating innovative link pages that captivate audiences. Our mission is to blend creativity with strategy, delivering experiences that inspire and empower your business to thrive.
              </p>
              <blockquote className="border-l-4 border-[#2E47FF] pl-6 my-8 text-xl text-white italic">
                "Empowering Your Brand Through Creative Design Crafting Memorable Experiences."
              </blockquote>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#2E47FF]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#2E47FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Link Solutions</h3>
                    <p className="text-zinc-400">Crafting unique and creative visual experiences.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#2E47FF]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#2E47FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Collaborative Process</h3>
                    <p className="text-zinc-400">Working together to achieve your goals.</p>
                  </div>
                </div>
              </div>
              <Link
                href="/pricing"
                className="inline-block mt-8 px-6 py-3 bg-[#2E47FF] text-white rounded-lg font-semibold hover:bg-[#1E37E6] transition-colors"
              >
                More About
              </Link>
            </div>
            <div className="relative">
              <img
                src="https://lynqit.nl/wp-content/uploads/2025/06/phones.png"
                alt="Lynqit"
                className="w-full rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4 bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#00F0EE] text-sm font-semibold mb-4 uppercase tracking-wider">SERVICES</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Innovative link solutions for every vision
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-black rounded-2xl p-8 border border-zinc-800 hover:border-[#2E47FF] transition-colors">
              <div className="w-16 h-16 bg-[#2E47FF]/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-[#2E47FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Brand Identity Design</h3>
              <p className="text-zinc-400 mb-6">
                Crafting logos, color palettes guidelines to define your unique identity.
              </p>
              <Link href="/pricing" className="text-[#2E47FF] hover:text-[#00F0EE] font-semibold">
                Read More →
              </Link>
            </div>
            <div className="bg-black rounded-2xl p-8 border border-zinc-800 hover:border-[#2E47FF] transition-colors">
              <div className="w-16 h-16 bg-[#2E47FF]/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-[#2E47FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Web Design & Development</h3>
              <p className="text-zinc-400 mb-6">
                Creating fully responsive, user-friendly link pages that align with your brand.
              </p>
              <Link href="/pricing" className="text-[#2E47FF] hover:text-[#00F0EE] font-semibold">
                Read More →
              </Link>
            </div>
            <div className="bg-black rounded-2xl p-8 border border-zinc-800 hover:border-[#2E47FF] transition-colors">
              <div className="w-16 h-16 bg-[#2E47FF]/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-[#2E47FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Digital Marketing Assets</h3>
              <p className="text-zinc-400 mb-6">
                Designing compelling marketing materials to effectively communicate your message.
              </p>
              <Link href="/pricing" className="text-[#2E47FF] hover:text-[#00F0EE] font-semibold">
                Read More →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <img
                src="https://lynqit.nl/wp-content/uploads/2025/06/phones.png"
                alt="Lynqit Features"
                className="w-full rounded-2xl"
              />
            </div>
            <div className="order-1 md:order-2">
              <p className="text-[#00F0EE] text-sm font-semibold mb-4 uppercase tracking-wider">WHAT WE DO</p>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Bringing ideas to life creatively
              </h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                We specialize in turning ideas into impactful, visually stunning link pages that elevate your brand and engage your audience.
              </p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#2E47FF]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#2E47FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Digital Marketing Materials</h3>
                    <p className="text-zinc-400">
                      We design compelling digital marketing materials, including ads, banners, and social media graphics, to effectively communicate your message.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#2E47FF]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#2E47FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Motion Graphics & Animation</h3>
                    <p className="text-zinc-400">
                      We create engaging motion graphics and animations that bring your brand to life and capture attention.
                    </p>
                  </div>
                </div>
              </div>
              <Link
                href="/pricing"
                className="inline-block mt-8 px-6 py-3 bg-[#2E47FF] text-white rounded-lg font-semibold hover:bg-[#1E37E6] transition-colors"
              >
                More About
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 px-4 bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#00F0EE] text-sm font-semibold mb-4 uppercase tracking-wider">WHY CHOOSE US</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Creative solutions exceptional results, always
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-black rounded-2xl p-8 border border-zinc-800">
              <div className="w-16 h-16 bg-[#2E47FF]/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-[#2E47FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Tailored Strategies</h3>
              <p className="text-zinc-400">
                With a portfolio of successful projects, we have helped businesses achieve their goals.
              </p>
            </div>
            <div className="bg-black rounded-2xl p-8 border border-zinc-800">
              <div className="w-16 h-16 bg-[#2E47FF]/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-[#2E47FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Proven Results</h3>
              <p className="text-zinc-400">
                Our track record speaks for itself with measurable results and satisfied clients.
              </p>
            </div>
            <div className="bg-black rounded-2xl p-8 border border-zinc-800">
              <div className="w-16 h-16 bg-[#2E47FF]/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-[#2E47FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Fast Delivery</h3>
              <p className="text-zinc-400">
                We deliver high-quality results quickly without compromising on quality.
              </p>
            </div>
            <div className="bg-black rounded-2xl p-8 border border-zinc-800">
              <div className="w-16 h-16 bg-[#2E47FF]/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-[#2E47FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Expert Team</h3>
              <p className="text-zinc-400">
                Our experienced team brings creativity and expertise to every project.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#00F0EE] text-sm font-semibold mb-4 uppercase tracking-wider">HOW IT WORK</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Seamless process, exceptional results
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-[#2E47FF] rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white">
                01
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Research & Strategy</h3>
              <p className="text-zinc-400 mb-6">
                Analyzing your industry and audience and create a tailored design strategy.
              </p>
              <ul className="text-left text-zinc-400 space-y-2">
                <li>• User Experience Research</li>
                <li>• Creative Brainstorming</li>
                <li>• Data-Driven Decisions</li>
              </ul>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-[#2E47FF] rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white">
                02
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Concept Development</h3>
              <p className="text-zinc-400 mb-6">
                Analyzing your industry and audience and create a tailored design strategy.
              </p>
              <ul className="text-left text-zinc-400 space-y-2">
                <li>• Sketching & Wireframing</li>
                <li>• Detailed Feedback Review</li>
                <li>• Typography Exploration</li>
              </ul>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-[#2E47FF] rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white">
                03
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Revisions & Refinements</h3>
              <p className="text-zinc-400 mb-6">
                Analyzing your industry and audience and create a tailored design strategy.
              </p>
              <ul className="text-left text-zinc-400 space-y-2">
                <li>• Collaborative Adjustments</li>
                <li>• Color Palette Selection</li>
                <li>• Final Approval Process</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Facts Section */}
      <section className="py-20 px-4 bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#00F0EE] text-sm font-semibold mb-4 uppercase tracking-wider">OUR FACTS</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Key milestones that define our journey
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Discover the achievements that showcase our dedication, and impact. These milestones reflect our commitment to delivering exceptional link solutions.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center bg-black rounded-2xl p-8 border border-zinc-800">
              <h3 className="text-5xl font-bold text-[#2E47FF] mb-2">0+</h3>
              <p className="text-zinc-400">Years of experience</p>
            </div>
            <div className="text-center bg-black rounded-2xl p-8 border border-zinc-800">
              <h3 className="text-5xl font-bold text-[#2E47FF] mb-2">0</h3>
              <p className="text-zinc-400">Award winning</p>
            </div>
            <div className="text-center bg-black rounded-2xl p-8 border border-zinc-800">
              <h3 className="text-5xl font-bold text-[#2E47FF] mb-2">0k+</h3>
              <p className="text-zinc-400">Satisfied customers</p>
            </div>
            <div className="text-center bg-black rounded-2xl p-8 border border-zinc-800">
              <h3 className="text-5xl font-bold text-[#2E47FF] mb-2">0+</h3>
              <p className="text-zinc-400">Projects complete</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#00F0EE] text-sm font-semibold mb-4 uppercase tracking-wider">PRICING PLAN</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Flexible pricing plans for every need
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
              <h3 className="text-2xl font-bold text-white mb-2">Basic</h3>
              <p className="text-zinc-400 mb-6">Per Month</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">€</span>
                <span className="text-5xl font-bold text-white">0</span>
              </div>
              <ul className="space-y-4 mb-8 text-zinc-400">
                <li>• Custom Link Solutions</li>
                <li>• Basic Analytics</li>
                <li>• Standard Templates</li>
                <li>• Email Support</li>
              </ul>
              <Link
                href="/pricing"
                className="block w-full text-center px-6 py-3 bg-[#2E47FF] text-white rounded-lg font-semibold hover:bg-[#1E37E6] transition-colors"
              >
                Get Started
              </Link>
            </div>
            <div className="bg-gradient-to-br from-[#2E47FF] to-[#00F0EE] rounded-2xl p-8 border-2 border-[#2E47FF] relative">
              <div className="absolute top-4 right-4 bg-white text-[#2E47FF] px-3 py-1 rounded-full text-xs font-bold">
                POPULAR
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Standard</h3>
              <p className="text-white/80 mb-6">Per Month</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">€</span>
                <span className="text-5xl font-bold text-white">9</span>
              </div>
              <ul className="space-y-4 mb-8 text-white">
                <li>• Custom Link Solutions</li>
                <li>• Advanced Analytics</li>
                <li>• Premium Templates</li>
                <li>• Priority Support</li>
              </ul>
              <Link
                href="/pricing"
                className="block w-full text-center px-6 py-3 bg-white text-[#2E47FF] rounded-lg font-semibold hover:bg-zinc-100 transition-colors"
              >
                Get Started
              </Link>
            </div>
            <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
              <h3 className="text-2xl font-bold text-white mb-2">Advance</h3>
              <p className="text-zinc-400 mb-6">Per Month</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">€</span>
                <span className="text-5xl font-bold text-white">19</span>
              </div>
              <ul className="space-y-4 mb-8 text-zinc-400">
                <li>• Custom Link Solutions</li>
                <li>• Premium Analytics</li>
                <li>• All Templates</li>
                <li>• 24/7 Support</li>
              </ul>
              <Link
                href="/pricing"
                className="block w-full text-center px-6 py-3 bg-[#2E47FF] text-white rounded-lg font-semibold hover:bg-[#1E37E6] transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
          <div className="text-center mt-8 text-zinc-400">
            <p>• Get 30 day free trial</p>
            <p>• No any hidden fees pay</p>
            <p>• You can cancel anytime</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#00F0EE] text-sm font-semibold mb-4 uppercase tracking-wider">TESTIMONIALS</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              What our clients say about us
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-black rounded-2xl p-8 border border-zinc-800">
                <p className="text-zinc-400 mb-6 italic">
                  "Working with this team was a game changer. They brought our vision to life with creativity and precision, delivering a link page that flawlessly represents our brand."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#2E47FF]/20 rounded-full flex items-center justify-center">
                    <span className="text-[#2E47FF] font-bold">U</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Client Name</p>
                    <p className="text-zinc-400 text-sm">Position</p>
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
          <div className="text-center mb-16">
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
              "Do you offer ongoing support after project complete?",
              "Can you help with website development?",
              "Can you help with branding and marketing?",
              "What if I don't know what I need?",
              "What industries do you work with?",
            ].map((question, i) => (
              <div key={i} className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                <h4 className="text-xl font-semibold text-white mb-3">{question}</h4>
                <p className="text-zinc-400">
                  Absolutely! We provide both design and development services, creating fully responsive, user-friendly link pages that align with your brand and goals.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#2E47FF] to-[#00F0EE]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            LET'S WORK TOGETHER
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Quality Work with No Limits. Freelancing Made Simple & Successful.
          </p>
          <Link
            href="/pricing"
            className="inline-block px-8 py-4 bg-white text-[#2E47FF] rounded-lg font-semibold text-lg hover:bg-zinc-100 transition-colors"
          >
            Get In Touch
          </Link>
        </div>
      </section>
    </div>
  );
}

