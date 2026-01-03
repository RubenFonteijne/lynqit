"use client";

import { useState } from "react";
import Link from "next/link";

interface TabContent {
  title: string;
  description: string;
  image: string;
}

interface TabsSectionProps {
  tabs: {
    id: string;
    label: string;
    content: TabContent;
  }[];
  pricingLink: string;
  buttonText?: string;
}

export default function TabsSection({ tabs, pricingLink, buttonText = "View Pricing" }: TabsSectionProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="py-20 px-4 bg-transparent">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {/* Left Column - Tabs */}
          <div className="md:col-span-1">
            <div className="relative" style={{ height: '400px' }}>
              {/* Yellow accent line */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#2E47FF] to-[#00F0EE] rounded-full"></div>
              
              <div className="pl-8 h-full flex flex-col" style={{ gap: '8px' }}>
                {tabs.map((tab, index) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(index)}
                    className={`flex-1 text-left px-4 rounded-lg transition-all duration-300 flex items-center ${
                      activeTab === index
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
                    }`}
                  >
                    <span className="text-lg font-semibold">{index + 1}. {tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Column - Content */}
          <div className="md:col-span-1">
            <div className="h-full flex flex-col p-6 rounded-lg" style={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
              {/* Icon placeholder - can be replaced with actual icons */}
              <div className="mb-6">
                <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ 
                  background: 'linear-gradient(135deg, rgba(46, 71, 255, 0.2) 0%, rgba(0, 240, 238, 0.2) 100%)',
                  border: '1px solid rgba(46, 71, 255, 0.3)'
                }}>
                  <i className="fas fa-link text-2xl" style={{
                    backgroundImage: 'linear-gradient(90deg, #2E47FF, #00F0EE)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}></i>
                </div>
              </div>

              <p className="text-white text-lg leading-relaxed mb-6 flex-grow">
                {tabs[activeTab].content.description}
              </p>

              <Link
                href={pricingLink}
                className="inline-flex items-center gap-3 px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 hover:opacity-90"
                style={{
                  background: 'linear-gradient(90deg, #2E47FF 0%, #00F0EE 100%)'
                }}
              >
                <span>{buttonText}</span>
                <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="md:col-span-1">
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={tabs[activeTab].content.image}
                alt={tabs[activeTab].content.title}
                className="w-full transition-opacity duration-500"
                style={{
                  height: '400px',
                  objectFit: 'cover'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

