"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function HoeWerktHetPage() {
  useEffect(() => {
    document.title = "Hoe werkt het - Lynqit";
  }, []);

  return (
    <div className="min-h-screen text-zinc-50 dark:text-white font-sans" style={{ background: 'linear-gradient(#2F3441, #000)' }}>
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
              }}>Hoe werkt het</span>
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
              <h2 className="text-2xl font-bold mb-4 text-zinc-50 dark:text-white">Registreren</h2>
              <p className="text-zinc-400 dark:text-gray-400 leading-relaxed">
                Na aanmelding wordt je persoonlijke Lynqit-pagina automatisch aangemaakt. Je krijgt direct toegang tot een professioneel ontworpen Lynqit via jouw persoonlijke dashboard.
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
              <h2 className="text-2xl font-bold mb-4 text-zinc-50 dark:text-white">Creëren</h2>
              <p className="text-zinc-400 dark:text-gray-400 leading-relaxed">
                Pas je Lynqit-pagina aan met alles wat belangrijk is. Van links naar je webshop en socials tot afbeeldingen, contactgegevens en duidelijke call to actions. Alles overzichtelijk en klikbaar op één centrale plek.
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
              <h2 className="text-2xl font-bold mb-4 text-zinc-50 dark:text-white">Delen</h2>
              <p className="text-zinc-400 dark:text-gray-400 leading-relaxed">
                Klaar om te gaan? Deel je unieke Lynqit-link op Instagram, TikTok, LinkedIn, je e-mailhandtekening of zelfs visitekaartjes. Stuur iedereen naar alles wat je aanbiedt in slechts één klik.
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <Link
              href="/register"
              className="inline-block px-8 py-4 bg-[#2E47FF] text-white rounded-lg font-semibold text-lg hover:bg-[#1E37E6] transition-colors"
            >
              Start met Lynqit
            </Link>
          </div>
        </div>
      </section>

      {/* Dashboard Section */}
      <section className="py-20 px-4 bg-zinc-800 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-zinc-50 dark:text-white">Dashboard</h2>
          <p className="text-lg text-zinc-300 dark:text-gray-300 mb-6 leading-relaxed">
            Na aanmelding wordt je persoonlijke Lynqit-pagina <strong className="text-white">automatisch aangemaakt</strong>. Je krijgt direct toegang tot een <strong className="text-white">professioneel ontworpen Lynqit</strong> dat je merkidentiteit weerspiegelt.
          </p>
          
          <ul className="space-y-4 mb-8 text-zinc-300 dark:text-gray-300">
            <li className="flex items-start">
              <span className="text-[#00F0EE] mr-3">•</span>
              <span>Voeg links toe of wijzig ze</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#00F0EE] mr-3">•</span>
              <span>Update afbeeldingen, tekst en knoppen</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#00F0EE] mr-3">•</span>
              <span>Bekijk je wijzigingen direct in de preview</span>
            </li>
          </ul>

          <p className="text-lg text-zinc-300 dark:text-gray-300 leading-relaxed">
            Maak op elk moment updates om je Lynqit fris, relevant en on-brand te houden.
          </p>
        </div>
      </section>

      {/* Insights Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-zinc-50 dark:text-white">Statistieken</h2>
          <p className="text-lg text-zinc-300 dark:text-gray-300 mb-6 leading-relaxed">
            Je dashboard geeft je ook toegang tot duidelijke, real-time statistieken — zodat je altijd weet wat werkt. We volgen totaal aantal paginaweergaven en klikken per knop, waardoor je waardevolle inzichten krijgt in hoe je publiek interacteert met je Lynqit.
          </p>
          
          <p className="text-lg text-zinc-300 dark:text-gray-300 mb-8 leading-relaxed">
            Je kunt de data filteren op dag, week, maand of een aangepast datumbereik, waardoor je trends kunt spotten en prestaties kunt verbeteren.
          </p>

          <ul className="space-y-4 mb-8 text-zinc-300 dark:text-gray-300">
            <li className="flex items-start">
              <span className="text-[#00F0EE] mr-3">•</span>
              <span>Zie welke knoppen de meeste klikken krijgen</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#00F0EE] mr-3">•</span>
              <span>Volg totaal aantal weergaven en betrokkenheid over tijd</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#00F0EE] mr-3">•</span>
              <span>Filter statistieken op dag, week, maand of aangepaste periode</span>
            </li>
          </ul>

          <p className="text-lg text-zinc-300 dark:text-gray-300 leading-relaxed">
            Blijf op de hoogte en verfijn je pagina op basis van echte resultaten.
          </p>
        </div>
      </section>
    </div>
  );
}

