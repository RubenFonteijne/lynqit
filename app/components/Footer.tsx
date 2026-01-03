"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  
  // Check if user is on Dutch pages
  const isDutch = pathname?.startsWith("/nl") || 
                  pathname?.startsWith("/prijzen") || 
                  pathname?.startsWith("/voor-artiesten") || 
                  pathname?.startsWith("/voor-bedrijven") || 
                  pathname?.startsWith("/voor-evenementen") ||
                  pathname?.startsWith("/bevestig-registratie") ||
                  pathname?.startsWith("/hoe-werkt-het");

  return (
    <footer className="bg-zinc-900 border-t border-zinc-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo */}
          <div className="text-2xl font-bold text-white">
            Lynqit
          </div>

          {/* Company Info */}
          <div className="text-center md:text-left text-zinc-400 text-sm">
            <p className="font-semibold text-white mb-1">Lynqit</p>
            <p>Keulenaar 62</p>
            <p>3961NM Wijk bij Duurstede</p>
            <p className="mt-2">
              <a href="mailto:info@lynqit.io" className="text-[#2E47FF] hover:underline">
                info@lynqit.io
              </a>
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col md:flex-row gap-4 items-center text-sm">
            <Link
              href="/betalingsvoorwaarden"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              {isDutch ? "Betalingsvoorwaarden" : "Payment Terms"}
            </Link>
            <Link
              href={isDutch ? "/nl/privacy" : "/privacy"}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              {isDutch ? "Privacybeleid" : "Privacy Policy"}
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-zinc-800 text-center text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Lynqit. {isDutch ? "Alle rechten voorbehouden." : "All rights reserved."}</p>
        </div>
      </div>
    </footer>
  );
}

