"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { LynqitPage } from "@/lib/lynqit-pages";
import { formatPageTitle } from "@/lib/utils";
import DashboardSidebar from "@/app/components/DashboardSidebar";
import ConfirmModal from "@/app/components/ConfirmModal";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { createClientClient } from "@/lib/supabase-client";

interface User {
  email: string;
  role: string;
}

interface DashboardAnalytics {
  totalViews: number;
  totalClicks: number;
  totalUniqueVisitors: number;
  averageCTR: number;
  topPagesByViews: Array<{ pageId: string; slug: string; title?: string; views: number }>;
  topPagesByClicks: Array<{ pageId: string; slug: string; title?: string; clicks: number }>;
  dailyViews: Array<{ date: string; views: number }>;
  dailyClicks: Array<{ date: string; clicks: number }>;
  recentPages: Array<{ pageId: string; slug: string; title?: string; updatedAt?: string }>;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [pages, setPages] = useState<LynqitPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    page: LynqitPage | null;
  }>({ isOpen: false, page: null });
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
        let session = null;
        let error = null;
        
        try {
          const sessionData = await supabase.auth.getSession();
          session = sessionData.data?.session || null;
          error = sessionData.error || null;
        } catch (e) {
          error = e as any;
        }
        
        // Fallback: check localStorage for user data if Supabase session is not available
        if ((error || !session || !session.user || !session.user.email)) {
          const cachedUser = localStorage.getItem("lynqit_user");
          if (cachedUser) {
            try {
              const user = JSON.parse(cachedUser);
              // User exists in localStorage, continue with cached user
              // We'll use the cached user email for API calls
              session = {
                user: { email: user.email },
                access_token: localStorage.getItem("supabase.auth.token") ? JSON.parse(localStorage.getItem("supabase.auth.token")!).access_token : undefined,
              } as any;
            } catch (e) {
              // Invalid cache
              if (!isMounted) return;
              setIsLoading(false);
              router.push("/");
              return;
            }
          } else {
            // No session and no cached user
            if (!isMounted) return;
            setIsLoading(false);
            router.push("/");
            return;
          }
        }
        
        if (!isMounted) return;

        // Try to get user and pages from localStorage first (faster)
        const cachedUser = localStorage.getItem("lynqit_user");
        const cachedPages = localStorage.getItem("lynqit_pages");
        
        if (cachedUser && isMounted) {
          try {
            const user = JSON.parse(cachedUser);
            setUser(user);
          } catch (e) {
            // Invalid cache, continue to fetch
          }
        }
        
        // Show cached pages immediately for instant UI
        if (cachedPages && isMounted) {
          try {
            const pages = JSON.parse(cachedPages);
            // Only use cache if it's less than 5 minutes old
            const cacheTimestamp = localStorage.getItem("lynqit_pages_timestamp");
            if (cacheTimestamp) {
              const age = Date.now() - parseInt(cacheTimestamp);
              if (age < 5 * 60 * 1000) { // 5 minutes
                setPages(pages);
              }
            }
          } catch (e) {
            // Invalid cache, continue to fetch
          }
        }

        // Fetch user info and pages in parallel
        const userEmail = session.user.email || "";
        const pagesUrl = session.access_token 
          ? `/api/pages`
          : `/api/pages?email=${encodeURIComponent(userEmail)}`;
        const pagesHeaders: Record<string, string> = session.access_token
          ? { "Authorization": `Bearer ${session.access_token}` }
          : {};
        
        const [userResponse, pagesResponse] = await Promise.all([
          fetch(`/api/user?email=${encodeURIComponent(userEmail)}`),
          fetch(pagesUrl, { headers: pagesHeaders }),
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
          const freshPages = pagesData.pages || [];
          console.log(`[Dashboard] Loaded ${freshPages.length} pages`);
          setPages(freshPages);
          // Cache pages for next time
          localStorage.setItem("lynqit_pages", JSON.stringify(freshPages));
          localStorage.setItem("lynqit_pages_timestamp", Date.now().toString());

          // Fetch dashboard analytics if user has pages
          if (freshPages.length > 0) {
            const analyticsHeaders = session.access_token
              ? { "Authorization": `Bearer ${session.access_token}` }
              : {};
            const analyticsResponse = await fetch(`/api/analytics/dashboard`, {
              headers: analyticsHeaders,
            });

            if (analyticsResponse.ok && isMounted) {
              const analyticsData = await analyticsResponse.json();
              setAnalytics(analyticsData);
            }
          }
          setIsLoadingAnalytics(false);
        } else {
          // Log error for debugging
          if (pagesResponse.status !== 200) {
            const errorData = await pagesResponse.json().catch(() => ({ error: "Unknown error" }));
            console.error("Error fetching pages:", pagesResponse.status, errorData);
          }
          // Still set pages to empty array to show empty state
          if (isMounted) {
            setPages([]);
          }
        }
        
        if (!userResponse.ok) {
          if (isMounted) {
            setIsLoading(false);
            router.push("/");
          }
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

  const fetchPages = async () => {
    try {
      const supabase = createClientClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      // Get user email from session or localStorage
      let userEmail = session?.user?.email;
      if (!userEmail) {
        const cachedUser = localStorage.getItem("lynqit_user");
        if (cachedUser) {
          try {
            const user = JSON.parse(cachedUser);
            userEmail = user.email;
          } catch (e) {
            // Invalid cache
          }
        }
      }
      
      if (!userEmail) {
        return;
      }

      // Use access token if available, otherwise use email parameter
      const pagesUrl = session?.access_token 
        ? `/api/pages`
        : `/api/pages?email=${encodeURIComponent(userEmail)}`;
      const pagesHeaders = session?.access_token
        ? { "Authorization": `Bearer ${session.access_token}` }
        : {};

      const pagesResponse = await fetch(pagesUrl, { headers: pagesHeaders });

      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        const freshPages = pagesData.pages || [];
        setPages(freshPages);
        // Update cache
        localStorage.setItem("lynqit_pages", JSON.stringify(freshPages));
        localStorage.setItem("lynqit_pages_timestamp", Date.now().toString());
      } else {
        // Log error for debugging
        const errorData = await pagesResponse.json().catch(() => ({ error: "Unknown error" }));
        console.error("Error fetching pages:", pagesResponse.status, errorData);
      }
    } catch (error) {
      console.error("Error fetching pages:", error);
    }
  };

  const handleDeletePage = (page: LynqitPage) => {
    setDeleteModal({ isOpen: true, page });
  };

  const getDeleteMessage = (page: LynqitPage | null) => {
    if (!page) return "";
    
    const isPaidPlan = page.subscriptionPlan && page.subscriptionPlan !== "free";
    
    let message = `Weet je zeker dat je de pagina "${formatPageTitle(page.slug)}" wilt verwijderen?\n\n`;
    
    if (isPaidPlan) {
      const endDate = page.subscriptionEndDate 
        ? new Date(page.subscriptionEndDate).toLocaleDateString("nl-NL")
        : "einde facturatieperiode";
      
      message += `⚠️ Deze pagina heeft een betaald abonnement (${page.subscriptionPlan === "start" ? "Start" : "Pro"}).\n\n`;
      message += `Het abonnement loopt door tot ${endDate}. Na verwijdering wordt het abonnement automatisch geannuleerd.\n\n`;
    }
    
    message += "Deze actie kan niet ongedaan worden gemaakt.";
    
    return message;
  };

  const confirmDelete = async () => {
    if (!deleteModal.page || !user?.email) return;

    const page = deleteModal.page;
    setIsDeleting(page.id);
    
    try {
      const response = await fetch(`/api/pages/${page.id}?userId=${encodeURIComponent(user.email)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Fout bij verwijderen van pagina");
        setDeleteModal({ isOpen: false, page: null });
        return;
      }

      // Refresh pages list
      await fetchPages();
    } catch (error) {
      console.error("Error deleting page:", error);
      alert("Er is een fout opgetreden bij het verwijderen van de pagina");
    } finally {
      setIsDeleting(null);
      setDeleteModal({ isOpen: false, page: null });
    }
  };


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
              Overzicht van je Lynqit pagina's en prestaties
            </p>
          </div>

          {/* Empty State */}
          {!isLoading && pages.length === 0 && (
            <div className="rounded-xl p-8 text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <p className="text-white mb-6">
                Je hebt nog geen Lynqit pages. Maak er een aan om te beginnen!
              </p>
              <Link
                href="/dashboard/pages"
                className="inline-block px-6 py-3 bg-gradient-to-r from-[#2E47FF] to-[#00F0EE] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                Eerste Page Aanmaken
              </Link>
            </div>
          )}

          {/* Dashboard Content */}
          {!isLoading && pages.length > 0 && (
            <>
              {/* Summary Cards - Top Row */}
              {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <p className="text-md text-zinc-400 mb-2">
                      Totaal Pageviews
                    </p>
                    <p className="text-3xl font-bold text-white mb-2">
                      {analytics.totalViews.toLocaleString()}
                    </p>
                    <Link
                      href="/dashboard/insights"
                      className="text-md text-[#00F0EE] hover:underline"
                    >
                      Bekijk Insights →
                    </Link>
                  </div>

                  <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <p className="text-md text-zinc-400 mb-2">
                      Totaal Clicks
                    </p>
                    <p className="text-3xl font-bold text-white mb-2">
                      {analytics.totalClicks.toLocaleString()}
                    </p>
                    <Link
                      href="/dashboard/insights"
                      className="text-md text-[#00F0EE] hover:underline"
                    >
                      Bekijk Insights →
                    </Link>
                  </div>

                  <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <p className="text-md text-zinc-400 mb-2">
                      Unieke Bezoekers
                    </p>
                    <p className="text-3xl font-bold text-white mb-2">
                      {analytics.totalUniqueVisitors.toLocaleString()}
                    </p>
                    <Link
                      href="/dashboard/insights"
                      className="text-md text-[#00F0EE] hover:underline"
                    >
                      Bekijk Insights →
                    </Link>
                  </div>

                  <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <p className="text-md text-zinc-400 mb-2">
                      Gemiddelde CTR
                    </p>
                    <p className="text-3xl font-bold text-white mb-2">
                      {analytics.averageCTR.toFixed(1)}%
                    </p>
                    <Link
                      href="/dashboard/insights"
                      className="text-md text-[#00F0EE] hover:underline"
                    >
                      Bekijk Insights →
                    </Link>
                  </div>
                </div>
              )}

              {/* Performance Highlights - Second Row */}
              {analytics && (analytics.topPagesByViews.length > 0 || analytics.topPagesByClicks.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Top Pages by Views */}
                  <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Meest Bekeken Pagina's
                    </h3>
                    <div className="space-y-3">
                      {analytics.topPagesByViews.map((page, index) => (
                        <Link
                          key={page.pageId}
                          href={`/dashboard/pages/${page.pageId}/edit`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#2E47FF] to-[#00F0EE] flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-md font-medium text-white">
                                {page.title || formatPageTitle(page.slug)}
                              </p>
                              <p className="text-xs text-zinc-400 font-mono">
                                /{page.slug}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-white">
                              {page.views.toLocaleString()}
                            </p>
                            <p className="text-xs text-zinc-400">views</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Top Pages by Clicks */}
                  <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Meest Geklikte Pagina's
                    </h3>
                    <div className="space-y-3">
                      {analytics.topPagesByClicks.map((page, index) => (
                        <Link
                          key={page.pageId}
                          href={`/dashboard/pages/${page.pageId}/edit`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#2E47FF] to-[#00F0EE] flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-md font-medium text-white">
                                {page.title || formatPageTitle(page.slug)}
                              </p>
                              <p className="text-xs text-zinc-400 font-mono">
                                /{page.slug}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-white">
                              {page.clicks.toLocaleString()}
                            </p>
                            <p className="text-xs text-zinc-400">clicks</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Charts - Third Row */}
              {analytics && (analytics.dailyViews.length > 0 || analytics.dailyClicks.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Pageviews Trend */}
                  <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Pageviews Trend
                    </h3>
                    <div className="h-64 w-full">
                      {analytics.dailyViews.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analytics.dailyViews}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#3f3f46"
                            />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(label) => {
                                const date = new Date(label);
                                return date.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
                              }}
                              stroke="#71717a"
                              style={{ fontSize: '12px' }}
                            />
                            <YAxis
                              stroke="#71717a"
                              style={{ fontSize: '12px' }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#18181b",
                                border: "1px solid #3f3f46",
                                borderRadius: "8px",
                                color: "#fff"
                              }}
                              labelFormatter={(label) => {
                                const date = new Date(label);
                                return date.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="views"
                              stroke="#2E47FF"
                              strokeWidth={2}
                              dot={{ fill: "#2E47FF", r: 3 }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-zinc-500">
                          Nog geen data beschikbaar
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Clicks Trend */}
                  <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Clicks Trend
                    </h3>
                    <div className="h-64 w-full">
                      {analytics.dailyClicks.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analytics.dailyClicks}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#3f3f46"
                            />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(label) => {
                                const date = new Date(label);
                                return date.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
                              }}
                              stroke="#71717a"
                              style={{ fontSize: '12px' }}
                            />
                            <YAxis
                              stroke="#71717a"
                              style={{ fontSize: '12px' }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#18181b",
                                border: "1px solid #3f3f46",
                                borderRadius: "8px",
                                color: "#fff"
                              }}
                              labelFormatter={(label) => {
                                const date = new Date(label);
                                return date.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="clicks"
                              stroke="#00F0EE"
                              strokeWidth={2}
                              dot={{ fill: "#00F0EE", r: 3 }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-zinc-500">
                          Nog geen data beschikbaar
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions & Recent Activity - Bottom Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Quick Actions */}
                <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <Link
                      href="/dashboard/pages"
                      className="block w-full px-4 py-3 bg-gradient-to-r from-[#2E47FF] to-[#00F0EE] text-white rounded-lg hover:opacity-90 transition-opacity font-medium text-center"
                    >
                      + Nieuwe Lynqit
                    </Link>
                    <Link
                      href="/dashboard/pages"
                      className="block w-full px-4 py-3 border border-zinc-700 text-white rounded-lg hover:bg-white/5 transition-colors font-medium text-center"
                    >
                      Bekijk Alle Pagina's
                    </Link>
                    <Link
                      href="/dashboard/insights"
                      className="block w-full px-4 py-3 border border-zinc-700 text-white rounded-lg hover:bg-white/5 transition-colors font-medium text-center"
                    >
                      Bekijk Insights
                    </Link>
                  </div>
                </div>

                {/* Recent Activity */}
                {analytics && analytics.recentPages.length > 0 && (
                  <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Recent Bewerkte Pagina's
                    </h3>
                    <div className="space-y-2">
                      {analytics.recentPages.map((page) => (
                        <Link
                          key={page.pageId}
                          href={`/dashboard/pages/${page.pageId}/edit`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <div>
                            <p className="text-md font-medium text-white">
                              {page.title || formatPageTitle(page.slug)}
                            </p>
                            <p className="text-xs text-zinc-400 font-mono">
                              /{page.slug}
                            </p>
                          </div>
                          {page.updatedAt && (
                            <p className="text-xs text-zinc-500">
                              {new Date(page.updatedAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                            </p>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
            </div>
          </div>
          
          {deleteModal.page && (
            <ConfirmModal
              isOpen={deleteModal.isOpen}
              onClose={() => setDeleteModal({ isOpen: false, page: null })}
              onConfirm={confirmDelete}
              title="Pagina verwijderen"
              message={getDeleteMessage(deleteModal.page)}
              confirmText="Verwijderen"
              cancelText="Annuleren"
              variant="danger"
            />
          )}
        </div>
  );
}