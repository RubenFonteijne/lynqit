"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("lynqit_user");
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

  const menuItems = [
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
    // Admin link - only shown if user is admin
    ...(isAdmin
      ? [
          {
            href: "/admin",
            label: "Admin",
            icon: "fas fa-shield-alt",
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
    return pathname?.startsWith(href);
  };

  return (
    <aside className="w-64 h-[calc(100vh-5rem)] fixed left-0 top-20 z-40 flex flex-col">
      <nav className="p-6 flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
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
      <div className="p-6">
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

