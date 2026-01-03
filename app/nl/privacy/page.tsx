"use client";

import { useEffect } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";

export default function PrivacyPolicyPageNL() {
  useEffect(() => {
    document.title = "Privacybeleid - Lynqit";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">Privacybeleid</h1>
        <p className="text-zinc-400 mb-8">Laatst bijgewerkt: {new Date().toLocaleDateString("nl-NL", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="space-y-8 text-zinc-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Inleiding</h2>
            <p>
              Welkom bij Lynqit. Wij zijn toegewijd aan het beschermen van uw persoonsgegevens en het respecteren van uw privacy. 
              Dit privacybeleid legt uit hoe wij uw gegevens verzamelen, gebruiken en beschermen wanneer u onze service gebruikt.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Verantwoordelijke</h2>
            <p>
              Lynqit is de verantwoordelijke voor uw persoonsgegevens. Als u vragen heeft over dit privacybeleid, 
              neem dan contact met ons op via: <a href="mailto:info@lynqit.com" className="text-[#2E47FF] hover:underline">info@lynqit.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Gegevens die wij verzamelen</h2>
            <h3 className="text-xl font-semibold text-white mt-4 mb-2">3.1 Gegevens die u verstrekt</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>E-mailadres (voor accountaanmaak en authenticatie)</li>
              <li>Wachtwoord (versleuteld en veilig opgeslagen)</li>
              <li>Pagina-inhoud (links, afbeeldingen, tekst die u toevoegt aan uw pagina's)</li>
              <li>Betalingsgegevens (veilig verwerkt via Mollie, wij slaan geen creditcardgegevens op)</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">3.2 Automatisch verzamelde gegevens</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>IP-adres</li>
              <li>Browsertype en versie</li>
              <li>Apparaatinformatie</li>
              <li>Gebruiksgegevens (bezochte pagina's, klikken, tijd besteed)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Cookies en Local Storage</h2>
            <p className="mb-4">
              Wij gebruiken cookies en local storage om onze services te leveren en te verbeteren. Hieronder staat een gedetailleerde lijst van alle cookies en local storage items die wij gebruiken:
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">4.1 Essentiële Cookies</h3>
            <p className="mb-2">Deze cookies zijn noodzakelijk voor de werking van de website en kunnen niet worden uitgeschakeld:</p>
            <div className="bg-zinc-800 rounded-lg p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="text-left py-2 px-2">Naam</th>
                    <th className="text-left py-2 px-2">Doel</th>
                    <th className="text-left py-2 px-2">Duur</th>
                    <th className="text-left py-2 px-2">Type</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-300">
                  <tr className="border-b border-zinc-700">
                    <td className="py-2 px-2 font-mono text-xs">sb-*-auth-token</td>
                    <td className="py-2 px-2">Supabase authenticatie sessietoken</td>
                    <td className="py-2 px-2">Sessie / 1 jaar</td>
                    <td className="py-2 px-2">HTTP Cookie</td>
                  </tr>
                  <tr className="border-b border-zinc-700">
                    <td className="py-2 px-2 font-mono text-xs">sb-*-auth-token-code-verifier</td>
                    <td className="py-2 px-2">OAuth code verifier voor veilige authenticatie</td>
                    <td className="py-2 px-2">Sessie</td>
                    <td className="py-2 px-2">HTTP Cookie</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">4.2 Functionele Cookies / Local Storage</h3>
            <p className="mb-2">Deze worden gebruikt om functionaliteit en gebruikerservaring te verbeteren:</p>
            <div className="bg-zinc-800 rounded-lg p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="text-left py-2 px-2">Naam</th>
                    <th className="text-left py-2 px-2">Doel</th>
                    <th className="text-left py-2 px-2">Duur</th>
                    <th className="text-left py-2 px-2">Type</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-300">
                  <tr className="border-b border-zinc-700">
                    <td className="py-2 px-2 font-mono text-xs">lynqit_user</td>
                    <td className="py-2 px-2">Slaat gebruikersinformatie op voor snellere paginaladingen (e-mail, rol)</td>
                    <td className="py-2 px-2">Tot uitloggen</td>
                    <td className="py-2 px-2">Local Storage</td>
                  </tr>
                  <tr className="border-b border-zinc-700">
                    <td className="py-2 px-2 font-mono text-xs">lynqit_pages</td>
                    <td className="py-2 px-2">Cachet lijst van gebruikerspagina's voor betere prestaties</td>
                    <td className="py-2 px-2">Tot cache verloopt of uitloggen</td>
                    <td className="py-2 px-2">Local Storage</td>
                    </tr>
                  <tr className="border-b border-zinc-700">
                    <td className="py-2 px-2 font-mono text-xs">lynqit_pages_timestamp</td>
                    <td className="py-2 px-2">Timestamp voor cache-verloop</td>
                    <td className="py-2 px-2">Tot cache verloopt</td>
                    <td className="py-2 px-2">Local Storage</td>
                  </tr>
                  <tr className="border-b border-zinc-700">
                    <td className="py-2 px-2 font-mono text-xs">lynqit_dashboard_theme</td>
                    <td className="py-2 px-2">Slaat gebruikers thema-voorkeur op (licht/donker/auto)</td>
                    <td className="py-2 px-2">Blijvend</td>
                    <td className="py-2 px-2">Local Storage</td>
                  </tr>
                  <tr className="border-b border-zinc-700">
                    <td className="py-2 px-2 font-mono text-xs">pending_slug</td>
                    <td className="py-2 px-2">Slaat tijdelijk pagina slug op tijdens betalingsflow</td>
                    <td className="py-2 px-2">Sessie</td>
                    <td className="py-2 px-2">Session Storage</td>
                  </tr>
                  <tr className="border-b border-zinc-700">
                    <td className="py-2 px-2 font-mono text-xs">cookie_consent</td>
                    <td className="py-2 px-2">Slaat uw cookie-toestemming voorkeur op</td>
                    <td className="py-2 px-2">1 jaar</td>
                    <td className="py-2 px-2">Local Storage</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 font-mono text-xs">cookie_consent_timestamp</td>
                    <td className="py-2 px-2">Timestamp van wanneer toestemming is gegeven</td>
                    <td className="py-2 px-2">1 jaar</td>
                    <td className="py-2 px-2">Local Storage</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">4.3 Onthoud mij Functionaliteit</h3>
            <p>
              Wanneer u "Onthoud mij" aanvinkt tijdens het inloggen, verlengen wij de duur van uw authenticatiesessie. 
              Dit gebruikt Supabase's sessiebeheer cookies om uw loginstatus te behouden tussen browsersessies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Hoe wij uw gegevens gebruiken</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Om onze service te leveren en te onderhouden</li>
              <li>Om uw account te authenticeren en te beheren</li>
              <li>Om betalingen te verwerken en abonnementen te beheren</li>
              <li>Om onze service te verbeteren en te optimaliseren</li>
              <li>Om met u te communiceren over uw account</li>
              <li>Om te voldoen aan wettelijke verplichtingen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Gegevensopslag en Beveiliging</h2>
            <p>
              Uw gegevens worden veilig opgeslagen met behulp van Supabase, dat enterprise-grade beveiliging biedt. 
              Wij gebruiken versleuteling tijdens transport (HTTPS) en in rust. Wachtwoorden worden gehasht met bcrypt en nooit in platte tekst opgeslagen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Uw Rechten (AVG)</h2>
            <p className="mb-4">Onder de Algemene Verordening Gegevensbescherming (AVG) heeft u de volgende rechten:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Recht op inzage:</strong> U kunt een kopie van uw persoonsgegevens opvragen</li>
              <li><strong>Recht op rectificatie:</strong> U kunt onjuiste gegevens corrigeren</li>
              <li><strong>Recht op verwijdering:</strong> U kunt verwijdering van uw gegevens verzoeken</li>
              <li><strong>Recht op beperking van verwerking:</strong> U kunt beperken hoe wij uw gegevens gebruiken</li>
              <li><strong>Recht op gegevensoverdraagbaarheid:</strong> U kunt uw gegevens ontvangen in een gestructureerd formaat</li>
              <li><strong>Recht van bezwaar:</strong> U kunt bezwaar maken tegen bepaalde verwerkingsactiviteiten</li>
              <li><strong>Recht op intrekking van toestemming:</strong> U kunt uw toestemming te allen tijde intrekken</li>
            </ul>
            <p className="mt-4">
              Om deze rechten uit te oefenen, neem contact met ons op via: <a href="mailto:info@lynqit.com" className="text-[#2E47FF] hover:underline">info@lynqit.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Derde Partij Services</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Supabase:</strong> Authenticatie en databaseservices</li>
              <li><strong>Mollie:</strong> Betalingsverwerking (wij slaan geen creditcardgegevens op)</li>
              <li><strong>Vercel:</strong> Hosting en analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Gegevensbewaring</h2>
            <p>
              Wij bewaren uw persoonsgegevens zolang uw account actief is of zolang nodig om services te leveren. 
              Als u uw account verwijdert, zullen wij uw persoonsgegevens binnen 30 dagen verwijderen, behalve waar wij verplicht zijn deze te bewaren voor wettelijke doeleinden.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Wijzigingen in dit Beleid</h2>
            <p>
              Wij kunnen dit privacybeleid van tijd tot tijd bijwerken. Wij zullen u op de hoogte stellen van wijzigingen door het nieuwe privacybeleid op deze pagina te plaatsen 
              en de "Laatst bijgewerkt" datum bij te werken.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Contact</h2>
            <p>
              Als u vragen heeft over dit privacybeleid, neem dan contact met ons op via:{" "}
              <a href="mailto:info@lynqit.com" className="text-[#2E47FF] hover:underline">info@lynqit.com</a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800">
          <Link
            href="/nl"
            className="text-[#2E47FF] hover:underline font-medium"
          >
            ← Terug naar home
          </Link>
        </div>
      </div>
    </div>
  );
}

