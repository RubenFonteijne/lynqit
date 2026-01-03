"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClientClient } from "@/lib/supabase-client";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

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
    
    // Redirect to homepage
    router.push("/");
  };

  useEffect(() => {
    // Check if user is admin
    const checkAdminStatus = () => {
      const userData = localStorage.getItem("lynqit_user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setIsAdmin(user.email === "rubenfonteijne@gmail.com" && user.role === "admin");
        } catch (error) {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();

    // Listen for storage changes
    window.addEventListener("storage", checkAdminStatus);
    window.addEventListener("focus", checkAdminStatus);

    return () => {
      window.removeEventListener("storage", checkAdminStatus);
      window.removeEventListener("focus", checkAdminStatus);
    };
  }, []);

  const topMenuItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: "fas fa-home",
    },
    {
      href: "/dashboard/pages",
      label: "Pages",
      icon: "fas fa-file-alt",
    },
    {
      href: "/dashboard/insights",
      label: "Insights",
      icon: "fas fa-chart-line",
    },
    {
      href: "/account",
      label: "Account",
      icon: "fas fa-user",
    },
  ];

  const bottomMenuItems = [
    // Admin links - only shown if user is admin
    ...(isAdmin
      ? [
          {
            href: "/admin",
            label: "Admin",
            icon: "fas fa-shield-alt",
          },
          {
            href: "/dashboard/settings",
            label: "Settings",
            icon: "fas fa-cog",
          },
        ]
      : []),
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    if (href === "/admin") {
      return pathname === "/admin";
    }
    if (href === "/dashboard/settings") {
      return pathname === "/dashboard/settings";
    }
    return pathname?.startsWith(href);
  };

  return (
    <aside className="w-64 h-[calc(100vh-5rem)] fixed left-0 top-20 z-40 flex flex-col">
      <nav className="p-6 flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {topMenuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    active
                      ? "bg-black/20 text-white"
                      : "text-zinc-300 hover:bg-black/10"
                  }`}
                >
                  <i className={`${item.icon} w-5 text-center`}></i>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-6 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        <ul className="space-y-1 mb-4">
          {bottomMenuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    active
                      ? "bg-black/20 text-white"
                      : "text-zinc-300 hover:bg-black/10"
                  }`}
                >
                  <i className={`${item.icon} w-5 text-center`}></i>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded transition-colors text-zinc-300 hover:bg-zinc-800/50"
        >
          <i className="fas fa-sign-out-alt w-5 text-center"></i>
          <span className="font-medium">Uitloggen</span>
        </button>
      </div>
    </aside>
  );
}

