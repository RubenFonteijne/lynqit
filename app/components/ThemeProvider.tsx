"use client";

import { useEffect } from "react";

export default function ThemeProvider() {
  useEffect(() => {
  // Function to apply theme
  const applyTheme = () => {
    // Check if localStorage is available (client-side only)
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    
    const savedTheme = localStorage.getItem("lynqit_dashboard_theme") as "light" | "dark" | "auto" | null;
      const root = document.documentElement;
      
      if (savedTheme === "light") {
        root.classList.remove("dark");
        root.classList.add("light");
      } else if (savedTheme === "dark") {
        root.classList.remove("light");
        root.classList.add("dark");
      } else {
        // Auto mode - use system preference
        root.classList.remove("light", "dark");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (prefersDark) {
          root.classList.add("dark");
        } else {
          root.classList.add("light");
        }
      }
    };

    // Apply theme on mount
    applyTheme();

    // Listen for changes in system preference (for auto mode)
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (typeof window === "undefined" || !window.localStorage) {
        return;
      }
      const savedTheme = localStorage.getItem("lynqit_dashboard_theme");
      if (savedTheme === "auto" || !savedTheme) {
        applyTheme();
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    // Listen for storage changes (when theme is changed in another tab)
    window.addEventListener("storage", (e) => {
      if (e.key === "lynqit_dashboard_theme") {
        applyTheme();
      }
    });

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return null;
}

