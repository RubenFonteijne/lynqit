"use client";

import { useEffect } from "react";
import Link from "next/link";
import TabsSection from "@/app/components/TabsSection";

export default function HomeNL() {
  useEffect(() => {
    document.title = "Lynqit - ONE LINK TO RULE THEM ALL";
  }, []);

  return (
    <div className="min-h-screen bg-dark font-sans">
      {/* Hero Section with Gradient Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: 'radial-gradient(circle at 110%, #2F48FE, #000 50%)' }}>
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="items-center">
            {/* Left side - Text content */}
            <div className="text-center z-10">
              <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
                <span className="block text-white font-bold">
                  <span style={{
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
                className="w-1/2 mx-auto mb-8"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-16">
            Ontdek Lynqit's
            <br />
            belangrijkste features
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
                De <span className="font-extrabold">kracht</span> van één link
              </h3>
              <p className="leading-relaxed mb-6">
                Met Lynqit bundel je al je belangrijke links op één professionele pagina in jouw eigen stijl. Website, socials, contactgegevens en uitgelichte diensten, locaties of acties. Alles overzichtelijk geordend.
                <br />
                <br />
                <span className="font-bold">Eén link voor maximale impact.</span>
              </p>
              <Link
                href="/prijzen"
                className="inline-block px-6 py-3 bg-white text-[#2E47FF] rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Start met Lynqit
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
                <span className="font-extrabold">Converteer</span> en{" "}
                <span className="font-extrabold">groei</span>
              </h3>
              <p className="leading-relaxed">
                Verander elke klik in echte resultaten. Zet je links om in acties die je volgers laten groeien, de betrokkenheid verhogen en je omzet stimuleren. Maak het je publiek makkelijk om te vinden wat ze zoeken.
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
                Ga voor <span className="font-extrabold">meer</span>
              </h3>
              <p className="leading-relaxed">
                Breng je merk tot leven met een krachtige videoheader, een echte blikvanger die de volledige merkbeleving versterkt. Promoot producten, lanceringen of events met sterke visuals en een duidelijke focus op clicks. Krijg inzicht met realtime data van Lynqit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <TabsSection
        tabs={[
          {
            id: "businesses",
            label: "Voor bedrijven",
            content: {
              title: "Voor Bedrijven",
              description: "Verbind al je bedrijfslinks, producten en diensten op één krachtige landingspagina. Stroomlijn klantbetrokkenheid, showcase je aanbod en verhoog conversies met een professionele Lynqit pagina op maat voor je bedrijf.",
              image: "https://zafemwpgbkciuozaxtgs.supabase.co/storage/v1/object/public/lynqit-uploads/uploads/dreamcamper%20lynqit.jpg"
            }
          },
          {
            id: "artists",
            label: "Voor artiesten",
            content: {
              title: "Voor Artiesten",
              description: "Alles wat je nodig hebt om te verbinden met je fans, je muziek te promoten en je publiek te laten groeien. Van Spotify integratie tot shows kalenders, pre-saves tot social media hubs—alles in één krachtige link ontworpen voor muzikanten.",
              image: "https://lynqit.nl/wp-content/uploads/2025/06/phones.png"
            }
          },
          {
            id: "events",
            label: "Voor evenementen",
            content: {
              title: "Voor Evenementen",
              description: "Maak de perfecte landingspagina voor je evenementen. Showcase data, locaties en ticketlinks op één plek. Maak evenementpromotie simpel en effectief met een dedicated events template gebouwd voor organisatoren.",
              image: "https://lynqit.nl/wp-content/uploads/2025/06/phones.png"
            }
          },
          {
            id: "hotels",
            label: "Voor hotels",
            content: {
              title: "Voor Hotels",
              description: "Showcase je hotel, kamers, faciliteiten en boekingslinks op één elegante pagina. Verbind gasten met je website, social media, reviews en directe boekingsplatforms. Perfect voor hospitality bedrijven die hun online aanwezigheid willen stroomlijnen.",
              image: "https://zafemwpgbkciuozaxtgs.supabase.co/storage/v1/object/public/lynqit-uploads/uploads/Lynqit-Atrium.jpg"
            }
          },
          {
            id: "creators",
            label: "Voor creators",
            content: {
              title: "Voor Creators",
              description: "Bouw je creator merk met een professionele link pagina. Verbind al je content, social platforms, merchandise en samenwerkingslinks. Perfect voor influencers, YouTubers en content creators die hun bereik willen maximaliseren.",
              image: "https://lynqit.nl/wp-content/uploads/2025/06/phones.png"
            }
          }
        ]}
        pricingLink="/prijzen"
        buttonText="Bekijk Prijzen"
      />

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
                href="/algemene-voorwaarden"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Algemene voorwaarden
              </Link>
              <Link
                href="/privacybeleid"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Privacybeleid
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
              Copyright © 2025 Lynqit. Alle rechten voorbehouden.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
