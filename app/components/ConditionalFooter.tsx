"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  if (!pathname) {
    return <Footer />;
  }
  
  // Hide footer on dashboard pages
  if (pathname.startsWith("/dashboard")) {
    return null;
  }
  
  // Hide footer on admin pages
  if (pathname.startsWith("/admin")) {
    return null;
  }

  // Hide footer on account pages
  if (pathname.startsWith("/account")) {
    return null;
  }
  
  // Hide footer on public Lynqit pages ([slug] routes)
  // These are routes that don't match known routes and don't start with /dashboard, /admin, or /api
  const knownRoutes = [
    "/",
    "/nl",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/account",
    "/account-confirmed",
    "/account-bevestigd",
    "/confirm-registration",
    "/bevestig-registratie",
    "/prijzen",
    "/pricing",
    "/for-artists",
    "/voor-artiesten",
    "/for-businesses",
    "/voor-bedrijven",
    "/for-events",
    "/voor-evenementen",
    "/how-it-works",
    "/hoe-werkt-het",
    "/privacy",
    "/betalingsvoorwaarden",
    "/payment",
    "/subscription",
  ];
  
  // Check if it's a known route
  const isKnownRoute = knownRoutes.some(route => {
    if (pathname === route) return true;
    // Check if pathname starts with route + "/" (for nested routes like /privacy/...)
    if (pathname.startsWith(route + "/")) return true;
    return false;
  });
  
  // If it's not a known route and not an API route, it's likely a public Lynqit page ([slug])
  // Public Lynqit pages are single-segment routes that don't start with known prefixes
  const pathSegments = pathname.split("/").filter(Boolean);
  const isPublicLynqitPage = !isKnownRoute && 
                            !pathname.startsWith("/api") && 
                            pathSegments.length === 1 && // Single segment (e.g., /dreamcamper)
                            !pathSegments[0].includes("."); // Not a file (e.g., favicon.ico)
  
  if (isPublicLynqitPage) {
    return null;
  }
  
  return <Footer />;
}

