"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function VoorArtiestenPage() {
  useEffect(() => {
    document.title = "Voor Artiesten - Lynqit";
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
                    }}>VOOR ARTIESTEN</span>
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-white/80 mb-8">
                Alles wat je nodig hebt om te verbinden met je fans, je muziek te promoten en je publiek te laten groeien—alles in één krachtige link.
              </p>
            </div>
            {/* Right column - Image */}
            <div className="z-10 flex justify-center md:justify-end">
              <img 
                src="https://lynqit.nl/wp-content/uploads/2025/06/phones.png" 
                alt="Lynqit voor Artiesten" 
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
            Gebouwd voor
            <br />
            <span style={{
              backgroundImage: 'linear-gradient(90deg, #3045FF, #07F2EE 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>muzikanten & artiesten</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Feature 1 - Spotify Integratie */}
            <div className="rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(135deg, rgb(6,147,227) 0%, rgb(142,209,252) 100%)' }}>
              <div className="mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fab fa-spotify text-4xl text-white"></i>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                <span className="font-extrabold">Spotify</span> Integratie
              </h3>
              <p className="leading-relaxed mb-6">
                Embed je nieuwste tracks, albums of playlists direct op je Lynqit pagina. Laat fans je muziek direct ontdekken en streamen zonder je pagina te verlaten. Perfect voor pre-saves, nieuwe releases en het showcasen van je beste werk.
              </p>
              <Link
                href="/register"
                className="inline-block px-6 py-3 bg-white text-[#2E47FF] rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Start met Lynqit
              </Link>
            </div>

            {/* Feature 2 - Shows Kalender */}
            <div className="rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(135deg, rgb(6,147,227) 0%, rgb(155,81,224) 100%)' }}>
              <div className="mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-calendar-alt text-4xl text-white"></i>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                <span className="font-extrabold">Shows</span> Kalender
              </h3>
              <p className="leading-relaxed mb-6">
                Houd je fans op de hoogte met een geïntegreerde shows kalender. Toon aankomende concerten, festivals en evenementen met data, locaties en directe ticketlinks. Mis nooit meer een kans om te verbinden met je publiek.
              </p>
              <Link
                href="/register"
                className="inline-block px-6 py-3 bg-white text-[#2E47FF] rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Start met Lynqit
              </Link>
            </div>

            {/* Feature 3 - Pre-saves & Nieuwe Releases */}
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
                Stimuleer pre-saves en promoot nieuwe releases met uitgelichte links en call-to-action knoppen. Maak het makkelijk voor fans om je muziek op te slaan, albums voor te bestellen en op de hoogte te blijven van je laatste werk.
              </p>
              <Link
                href="/register"
                className="inline-block px-6 py-3 bg-white text-[#2E47FF] rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Start met Lynqit
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
                Verbind al je social media platforms op één plek. Instagram, TikTok, YouTube, Twitter—link alles wat je fans nodig hebben om je reis te volgen. Eén klik om toegang te krijgen tot al je content.
              </p>
              <Link
                href="/register"
                className="inline-block px-6 py-3 bg-white text-[#2E47FF] rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Start met Lynqit
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
                Maak een krachtige eerste indruk met een video header. Showcase muziekvideo's, live optredens of behind-the-scenes content. Breng je merk tot leven en vang direct aandacht.
              </p>
              <Link
                href="/register"
                className="inline-block px-6 py-3 bg-white text-[#2E47FF] rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Start met Lynqit
              </Link>
            </div>

            {/* Feature 6 - Analytics & Inzichten */}
            <div className="rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(135deg, rgb(155,81,224) 0%, rgb(6,147,227) 100%)' }}>
              <div className="mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-chart-line text-4xl text-white"></i>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                <span className="font-extrabold">Analytics</span> & Inzichten
              </h3>
              <p className="leading-relaxed mb-6">
                Volg wat werkt met real-time analytics. Zie welke links de meeste clicks krijgen, monitor paginaweergaven en begrijp hoe je publiek engageert met je content. Maak data-gedreven beslissingen om je fanbase te laten groeien.
              </p>
              <Link
                href="/register"
                className="inline-block px-6 py-3 bg-white text-[#2E47FF] rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Start met Lynqit
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Klaar om je
            <br />
            <span style={{
              backgroundImage: 'linear-gradient(90deg, #3045FF, #07F2EE 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>artiesten aanwezigheid te laten groeien?</span>
          </h2>
          <p className="text-xl text-white/80 mb-12">
            Sluit je aan bij duizenden artiesten die Lynqit gebruiken om te verbinden met fans en hun muziek te promoten.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-[#2E47FF] text-white rounded-lg font-semibold text-lg hover:bg-[#1E37E6] transition-colors"
            style={{
              backgroundImage: 'linear-gradient(90deg, #2E47FF 0%, #00F0EE 100%)'
            }}
          >
            Start Nu
          </Link>
        </div>
      </section>
    </div>
  );
}

