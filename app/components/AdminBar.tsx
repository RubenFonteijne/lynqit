"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClientClient } from "@/lib/supabase-client";

interface User {
  email: string;
  role: string;
}

export default function AdminBar() {
  const params = useParams();
  const [isAdmin, setIsAdmin] = useState(false);
  const [pageId, setPageId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;
    
    // Check if user is admin using Supabase session
    const checkAdminStatus = async () => {
      if (!isMounted) return;
      
      try {
        const supabase = createClientClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (session && session.user) {
          // Get user info from API
          const response = await fetch(`/api/user?email=${encodeURIComponent(session.user.email || "")}`);
          if (!isMounted) return;
          
          if (response.ok) {
            const userData = await response.json();
            if (userData.user && isMounted) {
              const user: User = userData.user;
              const adminStatus = user.email === "rubenfonteijne@gmail.com" && user.role === "admin";
              setIsAdmin(adminStatus);
              
              // Store in localStorage for backward compatibility
              localStorage.setItem("lynqit_user", JSON.stringify(user));
              
              // Add/remove class from body when admin bar is visible
              if (adminStatus) {
                document.body.classList.add("has-admin-bar");
              } else {
                document.body.classList.remove("has-admin-bar");
              }
              return;
            }
          }
        }
        
        // Not logged in or not admin
        if (isMounted) {
          setIsAdmin(false);
          document.body.classList.remove("has-admin-bar");
        }
      } catch (error) {
        if (isMounted) {
          setIsAdmin(false);
          document.body.classList.remove("has-admin-bar");
        }
      }
    };

    checkAdminStatus();

    // Listen for auth state changes (only once)
    const supabase = createClientClient();
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event) => {
      // Only check on sign in/out events, not on every token refresh
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        checkAdminStatus();
      }
    });
    
    subscription = authSubscription;

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
      // Clean up class when component unmounts
      document.body.classList.remove("has-admin-bar");
    };
  }, []);

  useEffect(() => {
    // Fetch page ID from slug
    if (params.slug && isAdmin) {
      fetch(`/api/pages/slug/${params.slug}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.page?.id) {
            setPageId(data.page.id);
          }
        })
        .catch(() => {
          // Silently fail if page doesn't exist
        });
    }
  }, [params.slug, isAdmin]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 text-sm"
      style={{
        backgroundColor: "#23282d",
        color: "#a7aaad",
        height: "32px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif",
        fontSize: "13px",
        lineHeight: "2.46153846",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
      }}
    >
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="hover:text-white transition-colors"
          style={{ color: "#a7aaad", textDecoration: "none" }}
        >
          Dashboard
        </Link>
        {pageId && (
          <Link
            href={`/dashboard/pages/${pageId}/edit`}
            className="hover:text-white transition-colors"
            style={{ color: "#a7aaad", textDecoration: "none" }}
          >
            Bewerk deze lynqit pagina
          </Link>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span style={{ color: "#a7aaad" }}>Lynqit</span>
      </div>
    </div>
  );
}

