"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Determine current language from pathname
  const currentLang = pathname?.startsWith("/nl") || pathname?.startsWith("/prijzen") || pathname?.startsWith("/hoe-werkt-het") ? "nl" : "en";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Map routes between languages
  const getTranslatedPath = (lang: "nl" | "en") => {
    if (!pathname) return "/";
    
    // If already in the target language, return current path
    if (lang === currentLang) return pathname;

    // Map routes
    const routeMap: Record<string, { nl: string; en: string }> = {
      "/": { nl: "/nl", en: "/" },
      "/nl": { nl: "/nl", en: "/" },
      "/prijzen": { nl: "/prijzen", en: "/pricing" },
      "/pricing": { nl: "/prijzen", en: "/pricing" },
      "/hoe-werkt-het": { nl: "/hoe-werkt-het", en: "/how-it-works" },
      "/how-it-works": { nl: "/hoe-werkt-het", en: "/how-it-works" },
      "/register": { nl: "/register", en: "/register" },
      "/login": { nl: "/login", en: "/login" },
      "/dashboard": { nl: "/dashboard", en: "/dashboard" },
    };

    // Check if current path matches a mapped route
    for (const [route, translations] of Object.entries(routeMap)) {
      if (pathname === route || pathname.startsWith(route + "/")) {
        return translations[lang];
      }
    }

    // For other routes (like dashboard subroutes), keep the same path
    return pathname;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-800 transition-colors"
        aria-label="Select language"
      >
        {currentLang === "nl" ? (
          <img 
            src="https://hatscripts.github.io/circle-flags/flags/nl.svg" 
            alt="Nederlands" 
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <img 
            src="https://hatscripts.github.io/circle-flags/flags/gb.svg" 
            alt="English" 
            className="w-8 h-8 rounded-full"
          />
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 py-1 z-50">
          <Link
            href={getTranslatedPath("nl")}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <img 
              src="https://hatscripts.github.io/circle-flags/flags/nl.svg" 
              alt="Nederlands" 
              className="w-6 h-6 rounded-full"
            />
            <span>Nederlands</span>
          </Link>
          <Link
            href={getTranslatedPath("en")}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <img 
              src="https://hatscripts.github.io/circle-flags/flags/gb.svg" 
              alt="English" 
              className="w-6 h-6 rounded-full"
            />
            <span>English</span>
          </Link>
        </div>
      )}
    </div>
  );
}

