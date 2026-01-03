"use client";

import { useEffect } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";

export default function BetalingsvoorwaardenPage() {
  useEffect(() => {
    document.title = "Betalingsvoorwaarden - Lynqit";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">Betalingsvoorwaarden</h1>
        <p className="text-zinc-400 mb-8">Laatst bijgewerkt: {new Date().toLocaleDateString("nl-NL", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="space-y-8 text-zinc-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Algemene Bepalingen</h2>
            <p>
              Deze betalingsvoorwaarden zijn van toepassing op alle betalingen die worden verwerkt via Lynqit. 
              Wij gebruiken Mollie als onze betalingsprovider voor het verwerken van alle betalingen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Betalingsprovider</h2>
            <p className="mb-4">
              Alle betalingen worden verwerkt via Mollie B.V., een geregistreerde betalingsdienstverlener. 
              Mollie is geautoriseerd door de Autoriteit Financiële Markten (AFM) en geregistreerd bij De Nederlandsche Bank (DNB).
            </p>
            <p>
              Voor de meest actuele en gedetailleerde informatie over de betalingsvoorwaarden verwijzen wij u naar de officiële Mollie Gebruikersovereenkomst.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Geaccepteerde Betaalmethoden</h2>
            <p className="mb-4">Via Mollie accepteren wij de volgende betaalmethoden:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Creditcard (Visa, Mastercard, American Express)</li>
              <li>iDEAL</li>
              <li>Bancontact</li>
              <li>SOFORT</li>
              <li>SEPA Direct Debit</li>
              <li>PayPal</li>
              <li>En andere door Mollie ondersteunde betaalmethoden</li>
            </ul>
            <p className="mt-4 text-sm text-zinc-400">
              De beschikbare betaalmethoden kunnen per land verschillen en worden bepaald door Mollie.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Betalingsverwerking</h2>
            <p className="mb-4">
              Wanneer u een betaling verricht via onze website:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Wordt uw betaling veilig verwerkt door Mollie</li>
              <li>Worden uw creditcardgegevens niet opgeslagen op onze servers</li>
              <li>Wordt uw betaling versleuteld verzonden via beveiligde verbindingen (HTTPS)</li>
              <li>Ontvangt u direct een bevestiging van uw betaling</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Abonnementen en Terugkerende Betalingen</h2>
            <p className="mb-4">
              Voor abonnementen (Start en Pro plannen) worden terugkerende betalingen automatisch verwerkt via Mollie. 
              U geeft toestemming voor automatische incasso bij het afsluiten van een abonnement.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Abonnementen worden maandelijks automatisch verlengd</li>
              <li>U kunt uw abonnement op elk moment opzeggen via uw account</li>
              <li>Na opzegging blijft uw abonnement actief tot het einde van de huidige facturatieperiode</li>
              <li>Geen restitutie voor reeds betaalde periodes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Betalingsbeveiliging</h2>
            <p>
              Wij nemen de beveiliging van uw betalingsgegevens zeer serieus. Alle betalingen worden verwerkt via Mollie's 
              beveiligde betalingsinfrastructuur, die voldoet aan de hoogste beveiligingsstandaarden, inclusief PCI DSS niveau 1 certificering.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Betalingsproblemen</h2>
            <p className="mb-4">
              Als u problemen ondervindt met een betaling, neem dan contact met ons op via{" "}
              <a href="mailto:info@lynqit.io" className="text-[#2E47FF] hover:underline">info@lynqit.io</a>.
            </p>
            <p>
              Voor vragen over de betalingsverwerking zelf kunt u ook contact opnemen met Mollie via hun klantenservice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Terugbetalingen en Restituties</h2>
            <p className="mb-4">
              Terugbetalingen worden verwerkt volgens ons restitutiebeleid:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Terugbetalingen worden verwerkt binnen 14 werkdagen na goedkeuring</li>
              <li>Het bedrag wordt teruggestort op dezelfde betaalmethode waarmee u heeft betaald</li>
              <li>Voor abonnementen: geen restitutie voor reeds gebruikte periodes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Mollie Gebruikersovereenkomst</h2>
            <p className="mb-4">
              Door gebruik te maken van onze betaalservice gaat u akkoord met de Mollie Gebruikersovereenkomst. 
              Voor de volledige voorwaarden verwijzen wij u naar:
            </p>
            <div className="bg-zinc-800 rounded-lg p-4 mb-4">
              <a
                href="https://www.mollie.com/nl/legal/user-agreement"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2E47FF] hover:underline font-medium"
              >
                Mollie Gebruikersovereenkomst (Nederlands)
              </a>
              <br />
              <a
                href="https://www.mollie.com/en/legal/user-agreement"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2E47FF] hover:underline font-medium mt-2 inline-block"
              >
                Mollie User Agreement (English)
              </a>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Wijzigingen</h2>
            <p>
              Wij behouden ons het recht voor om deze betalingsvoorwaarden te wijzigen. 
              Wijzigingen worden op deze pagina gepubliceerd en zijn van kracht vanaf de datum van publicatie.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Contact</h2>
            <p>
              Voor vragen over deze betalingsvoorwaarden kunt u contact met ons opnemen via:{" "}
              <a href="mailto:info@lynqit.io" className="text-[#2E47FF] hover:underline">info@lynqit.io</a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800">
          <Link
            href="/"
            className="text-[#2E47FF] hover:underline font-medium"
          >
            ← Terug naar home
          </Link>
        </div>
      </div>
    </div>
  );
}

