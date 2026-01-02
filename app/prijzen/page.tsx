"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  useEffect(() => {
    document.title = "Prijzen - Lynqit";
  }, []);

  const router = useRouter();
  
  const plans = [
    {
      id: "free",
      name: "Lynqit Basis",
      price: "Gratis",
      priceMonthly: null,
    },
    {
      id: "start",
      name: "Lynqit Start",
      price: "€9,95",
      priceMonthly: "/maand ex BTW",
    },
    {
      id: "pro",
      name: "Lynqit Pro",
      price: "€14,95",
      priceMonthly: "/maand ex BTW",
    },
  ];

  const features = [
    { name: "Links naar social media", free: true, start: true, pro: true },
    { name: "Uitgelichte links", free: false, start: "2", pro: "4" },
    { name: "Links om zelf in te stellen", free: "5", start: "10", pro: "20" },
    { name: "Statistieken", free: true, start: true, pro: true },
    { name: "Contactgegevens", free: false, start: true, pro: true },
    { name: "Call-to-action", free: false, start: true, pro: true },
    { name: "Keuze uit templates", free: false, start: false, pro: true },
    { name: "Video header", free: false, start: false, pro: true },
    { name: "Promo block", free: false, start: false, pro: true },
  ];

  const renderFeatureValue = (value: boolean | string) => {
    if (value === true) {
      return <i className="fas fa-check-circle text-green-500"></i>;
    } else if (value === false) {
      return <i className="fas fa-times-circle text-zinc-500 dark:text-gray-400"></i>;
    } else {
      return <span className="text-zinc-50 dark:text-white">{value}</span>;
    }
  };

  return (
    <div className="min-h-screen text-zinc-50 dark:text-white py-16 px-4" style={{ background: 'linear-gradient(#2F3441, #000)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight text-center">
          <span className="block text-white font-bold">
            <span style={{
              backgroundImage: 'linear-gradient(90deg, #3045FF, #07F2EE 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Prijzen</span>
          </span>
        </h1>

        {/* Pricing Plans Header */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div></div>
          {plans.map((plan) => (
            <div key={plan.id} className="text-center flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-zinc-50 dark:text-white mb-2">
                  {plan.name}
                </h2>
                <div className="text-3xl font-bold text-zinc-50 dark:text-white mb-1">
                  {plan.price}
                </div>
                {plan.priceMonthly && (
                  <div className="text-sm text-zinc-400 dark:text-gray-500 mb-4">
                    {plan.priceMonthly}
                  </div>
                )}
              </div>
              <Link
                href={`/register?plan=${plan.id}`}
                className="inline-block w-full py-3 px-6 rounded-lg text-white font-semibold transition-opacity hover:opacity-90 text-center"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #2E47FF 0%, #00F0EE 100%)'
                }}
              >
                Selecteer
              </Link>
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              {features.map((feature, index) => (
                <tr 
                  key={index} 
                  className={`border-b border-zinc-700 dark:border-gray-200 ${
                    index % 2 === 0 
                      ? 'bg-zinc-900' 
                      : 'bg-zinc-950'
                  }`}
                >
                  <td className="py-4 px-4 text-zinc-50 dark:text-white w-[25%] border-r border-zinc-700 dark:border-gray-300">{feature.name}</td>
                  <td className="py-4 px-4 text-center w-[25%] border-r border-zinc-700 dark:border-gray-300">{renderFeatureValue(feature.free)}</td>
                  <td className="py-4 px-4 text-center w-[25%] border-r border-zinc-700 dark:border-gray-300">{renderFeatureValue(feature.start)}</td>
                  <td className="py-4 px-4 text-center w-[25%]">{renderFeatureValue(feature.pro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

