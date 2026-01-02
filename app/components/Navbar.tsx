"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import { createClientClient } from "@/lib/supabase-client";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Check if current route has a sidebar
  const hasSidebar = pathname?.startsWith("/dashboard") || pathname === "/account" || pathname === "/admin";

  // Determine current language from pathname
  const currentLang = pathname?.startsWith("/nl") || pathname?.startsWith("/prijzen") || pathname?.startsWith("/hoe-werkt-het") ? "nl" : "en";

  useEffect(() => {
    // Check if user is logged in (check both localStorage and Supabase session)
    const checkLoginStatus = async () => {
      try {
        const supabase = createClientClient();
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session || !session.user) {
          setIsLoggedIn(false);
          setIsAdmin(false);
          return;
        }

        // User has active Supabase session
        setIsLoggedIn(true);

        // Try to get user data from localStorage first (faster)
        const userData = localStorage.getItem("lynqit_user");
        if (userData) {
          try {
            const user = JSON.parse(userData);
            setIsAdmin(user.email === "rubenfonteijne@gmail.com" && user.role === "admin");
          } catch (error) {
            // Invalid cache, fetch from API
            fetchUserData(session.user.email!);
          }
        } else {
          // No cached data, fetch from API
          fetchUserData(session.user.email!);
        }
      } catch (error) {
        console.error("Error checking login status:", error);
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
    };

    const fetchUserData = async (email: string) => {
      try {
        const response = await fetch(`/api/user?email=${encodeURIComponent(email)}`);
        if (response.ok) {
          const userData = await response.json();
          if (userData.user) {
            setIsAdmin(userData.user.email === "rubenfonteijne@gmail.com" && userData.user.role === "admin");
            localStorage.setItem("lynqit_user", JSON.stringify(userData.user));
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    // Check on mount
    checkLoginStatus();

    // Listen for Supabase auth state changes
    const supabase = createClientClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setIsLoggedIn(true);
        if (session.user.email) {
          fetchUserData(session.user.email);
        }
      } else if (event === "SIGNED_OUT") {
        setIsLoggedIn(false);
        setIsAdmin(false);
        localStorage.removeItem("lynqit_user");
      }
    });

    // Listen for storage changes (when user logs in/out in another tab)
    window.addEventListener("storage", checkLoginStatus);

    // Also check on focus (in case user logged in/out in same tab)
    window.addEventListener("focus", checkLoginStatus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", checkLoginStatus);
      window.removeEventListener("focus", checkLoginStatus);
    };
  }, []);

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      const supabase = createClientClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out from Supabase:", error);
    }
    
    // Remove local storage
    localStorage.removeItem("lynqit_user");
    setIsLoggedIn(false);
    setShowAccountDropdown(false);
    
    // Redirect to homepage
    router.push("/");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't close if clicking on a link inside the dropdown
      if (target.closest('a') && dropdownRef.current?.contains(target)) {
        return;
      }
      
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowAccountDropdown(false);
      }
    };

    if (showAccountDropdown) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showAccountDropdown]);

  return (
    <nav className="w-full bg-black sticky top-0 z-50">
      <div className={hasSidebar ? "w-full px-4 sm:px-6 lg:px-8" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"}>
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link
              href={currentLang === "nl" ? "/nl" : "/"}
              className="hover:opacity-80 transition-opacity"
            >
              <img src="https://lynqit.nl/wp-content/uploads/2025/06/Lynqit_logo.svg" alt="Lynqit Logo" className="w-30 h-30" style={{ filter: 'brightness(0) invert(1)' }} />
            </Link>
          </div>
          {!hasSidebar && (
            <>
              <div className="hidden md:flex items-center gap-12">
                <Link
                  href={currentLang === "en" ? "/" : "/nl"}
                  className="text-lg text-white font-bold hover:text-gray-400 transition-colors"
                >
                  {currentLang === "en" ? "Home" : "Home"}
                </Link>
                <Link
                  href={currentLang === "en" ? "/how-it-works" : "/hoe-werkt-het"}
                  className="text-lg text-white font-bold hover:text-gray-400 transition-colors"
                >
                  {currentLang === "en" ? "How it works" : "Hoe werkt het"}
                </Link>
                <Link
                  href={currentLang === "en" ? "/pricing" : "/prijzen"}
                  className="text-lg text-white font-bold hover:text-gray-400 transition-colors"
                >
                  {currentLang === "en" ? "Pricing" : "Prijzen"}
                </Link>
                {!isLoggedIn && (
                  <Link
                    href="/login"
                    className="px-5 py-2.5 rounded-lg text-md font-bold text-white border border-white/30 hover:border-white/50 transition-colors flex items-center gap-2"
                  >
                    <i className="fas fa-user-circle"></i>
                    {currentLang === "en" ? "Login" : "Inloggen"}
                  </Link>
                )}
                {isLoggedIn && (
                  <Link
                    href="/dashboard"
                    className="px-5 py-2.5 rounded-lg text-md font-bold text-white transition-colors"
                    style={{
                      backgroundImage: 'linear-gradient(90deg, #2E47FF 0%, #00F0EE 100%)'
                    }}
                  >
                    Dashboard
                  </Link>
                )}
                <LanguageSwitcher />
              </div>
              {/* Mobile menu button */}
              <div className="md:hidden flex gap-2 items-center">
                <LanguageSwitcher />
                {isAdmin && isLoggedIn && (
                  <Link
                    href="/admin"
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                  >
                    Admin
                  </Link>
                )}
                {!isLoggedIn && (
                  <Link
                    href="/login"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white border border-white/30 hover:border-white/50 transition-colors flex items-center gap-2"
                  >
                    <i className="fas fa-user-circle"></i>
                    Inloggen
                  </Link>
                )}
                {isLoggedIn && (
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-[#2E47FF] text-white hover:bg-[#1E37E6] transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
                {isLoggedIn && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      aria-label="Account menu"
                    >
                      <i className="fas fa-user-circle text-2xl text-gray-700"></i>
                    </button>
                    {showAccountDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <Link
                          href="/account"
                          onClick={() => setShowAccountDropdown(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Account
                        </Link>
                        <Link
                          href="/dashboard/pages"
                          onClick={() => setShowAccountDropdown(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Mijn pagina's
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Uitloggen
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

