"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { LynqitPage } from "@/lib/lynqit-pages";
import { formatPageTitle } from "@/lib/utils";
import DashboardSidebar from "@/app/components/DashboardSidebar";
import { createClientClient } from "@/lib/supabase-client";

interface User {
  email: string;
  role: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [pages, setPages] = useState<LynqitPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    document.title = "Dashboard - Lynqit";
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const supabase = createClientClient();
        
        // Get current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        // Check authentication
        if (error || !session || !session.user || !session.user.email) {
          setIsLoading(false);
          router.push("/");
          return;
        }

        // Try to get user from localStorage first (faster)
        const cachedUser = localStorage.getItem("lynqit_user");
        if (cachedUser && isMounted) {
          try {
            const user = JSON.parse(cachedUser);
            setUser(user);
          } catch (e) {
            // Invalid cache, continue to fetch
          }
        }

        // Fetch user info and pages in parallel
        const [userResponse, pagesResponse] = await Promise.all([
          fetch(`/api/user?email=${encodeURIComponent(session.user.email)}`),
          fetch(`/api/pages`, {
            headers: {
              "Authorization": `Bearer ${session.access_token}`,
            },
          }),
        ]);

        if (!isMounted) return;

        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.user && isMounted) {
            setUser(userData.user);
            localStorage.setItem("lynqit_user", JSON.stringify(userData.user));
          }
        }

        if (pagesResponse.ok && isMounted) {
          const pagesData = await pagesResponse.json();
          setPages(pagesData.pages || []);
        } else if (!userResponse.ok) {
          setIsLoading(false);
          router.push("/");
          return;
        }
      } catch (error) {
        console.error("Error loading data:", error);
        if (isMounted) {
          setIsLoading(false);
          router.push("/");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []); // Removed router to prevent loops


  return (
    <div className="h-screen font-sans flex overflow-hidden" style={{ background: 'linear-gradient(#2F3441, #000)' }}>
          <DashboardSidebar />
          <div className="flex-1 ml-64 overflow-y-auto">
            <div className="w-full px-8 py-8 mt-6 rounded-xl" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-white mb-2">
              Dashboard
            </h1>
            <p className="text-zinc-400">
              Welcome to your dashboard
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-zinc-400">Loading...</div>
            </div>
          )}

          {/* Empty State */}
          {pages.length === 0 && (
            <div className="rounded-xl p-8 text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <p className="text-white mb-6">
                Je hebt nog geen Lynqit pages. Maak er een aan om te beginnen!
              </p>
              <Link
                href="/dashboard/pages"
                className="inline-block px-6 py-3 bg-[#2E47FF] text-white rounded-lg hover:bg-[#1E37E6] transition-colors font-medium"
              >
                Eerste Page Aanmaken
              </Link>
            </div>
          )}

          {/* My Pages Overview */}
          {pages.length > 0 && (
            <div>
              <div className="space-y-3">
                {pages.map((page) => {
                const handleCopyLink = async () => {
                  const pageUrl = typeof window !== 'undefined' 
                    ? `${window.location.origin}/${page.slug}`
                    : `/${page.slug}`;
                  
                  try {
                    await navigator.clipboard.writeText(pageUrl);
                    alert("Link gekopieerd naar klembord!");
                  } catch (error) {
                    console.error("Failed to copy link:", error);
                    // Fallback for older browsers
                    const textArea = document.createElement("textarea");
                    textArea.value = pageUrl;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand("copy");
                    document.body.removeChild(textArea);
                    alert("Link gekopieerd naar klembord!");
                  }
                };

                return (
                  <div
                    key={page.id}
                    className="flex items-center justify-between px-5 py-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-white">{formatPageTitle(page.slug)}</p>
                      <p className="text-xs text-zinc-400 font-mono">
                        /{page.slug}
                      </p>
                      {(!page.subscriptionPlan || page.subscriptionPlan === "free") && (
                        <p className="text-xs text-[#2E47FF] dark:text-[#00F0EE] mt-1">
                          Basis plan
                        </p>
                      )}
                      {page.subscriptionPlan && page.subscriptionPlan !== "free" && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          {page.subscriptionPlan === "start" ? "Start plan" : "Pro plan"}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/pages/${page.id}/edit`}
                        className="p-3 bg-[#2E47FF] text-white rounded-lg text-sm font-medium hover:bg-[#1E37E6] transition-colors flex items-center justify-center"
                        title="Bewerken"
                      >
                        Bewerken <i className="pl-4 fas fa-edit"></i>
                      </Link>
                      <Link
                        href={`/${page.slug}`}
                        target="_blank"
                        className="p-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-zinc-50 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
                        title="Bekijken"
                      >
                        Bekijken <i className="pl-2 fas fa-eye"></i> 
                      </Link>
                      <button
                        onClick={handleCopyLink}
                        className="p-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-zinc-50 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
                        title="Copy link"
                      >
                        Link kopieren <i className="pl-2 fas fa-copy"></i>
                      </button>
                    </div>
                  </div>
                );
                })}
              </div>
            </div>
          )}
            </div>
          </div>
        </div>
  );
}