"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  if (!pathname) {
    return <Navbar />;
  }
  
  // Show navbar on known routes
  const showNavbarRoutes = [
    "/",
    "/nl",
    "/login",
    "/dashboard",
    "/hoe-werkt-het",
    "/how-it-works",
    "/prijzen",
    "/pricing",
    "/account",
    "/admin",
  ];
  
  // Always show navbar on dashboard, admin, login, and API routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/api") || showNavbarRoutes.includes(pathname)) {
    return <Navbar />;
  }
  
  // Hide navbar on public Lynqit pages (any other route)
  return null;
}

