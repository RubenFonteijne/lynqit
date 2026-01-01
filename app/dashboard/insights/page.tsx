"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { LynqitPage } from "@/lib/lynqit-pages";
import { formatPageTitle } from "@/lib/utils";
import DashboardSidebar from "@/app/components/DashboardSidebar";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { createClientClient } from "@/lib/supabase-client";

interface User {
  email: string;
  role: string;
}

interface AnalyticsData {
  totalViews: number;
  currentMonthViews: number;
  previousMonthViews: number;
  percentageChange: number;
  referrerSources: Record<string, number>;
  dailyViews: Array<{ date: string; views: number }>;
  totalClicks: number;
  clicksByType: Record<string, number>;
  dailyClicks: Array<{ date: string; clicks: number }>;
}

interface PageWithAnalytics extends LynqitPage {
  analytics?: AnalyticsData;
  isLoadingAnalytics?: boolean;
}

export default function InsightsPage() {
  useEffect(() => {
    document.title = "Insights - Lynqit";
  }, []);

  const [user, setUser] = useState<User | null>(null);
  const [pages, setPages] = useState<PageWithAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const router = useRouter();

  // Social platforms mapping
  const socialPlatforms: Record<string, { icon: string; label: string }> = {
    linkedin: { icon: "fab fa-linkedin-in", label: "LinkedIn" },
    instagram: { icon: "fab fa-instagram", label: "Instagram" },
    facebook: { icon: "fab fa-facebook-f", label: "Facebook" },
    youtube: { icon: "fab fa-youtube", label: "YouTube" },
    tiktok: { icon: "fab fa-tiktok", label: "TikTok" },
    soundcloud: { icon: "fab fa-soundcloud", label: "SoundCloud" },
    spotify: { icon: "fab fa-spotify", label: "Spotify" },
    website: { icon: "fas fa-globe", label: "Website" },
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const supabase = createClientClient();
        
        // Get current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error || !session || !session.user) {
          setIsLoading(false);
          router.push("/");
          return;
        }

        // Get user info from API
        const userResponse = await fetch(`/api/user?email=${encodeURIComponent(session.user.email || "")}`);
        if (!isMounted) return;
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.user && isMounted) {
            setUser(userData.user);
            // Store in localStorage for backward compatibility
            localStorage.setItem("lynqit_user", JSON.stringify(userData.user));
            // Fetch user's pages with access token
            await fetchPages(session.access_token);
          }
        } else {
          setIsLoading(false);
          router.push("/");
        }
      } catch (error) {
        console.error("Error loading user:", error);
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

  const fetchPages = async (accessToken: string) => {
    try {
      const response = await fetch(`/api/pages`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const pagesData = data.pages || [];
        setPages(pagesData);
        
        // If there's only one page, expand it by default
        if (pagesData.length === 1) {
          setExpandedPages(new Set([pagesData[0].id]));
        }
        
        // Fetch analytics for each page
        pagesData.forEach((page: PageWithAnalytics) => {
          fetchAnalytics(page);
        });
      }
    } catch (error) {
      console.error("Error fetching pages:", error);
    }
  };

  const togglePage = (pageId: string) => {
    setExpandedPages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pageId)) {
        newSet.delete(pageId);
      } else {
        newSet.add(pageId);
      }
      return newSet;
    });
  };

  const fetchAnalytics = async (page: PageWithAnalytics) => {
    setPages((prevPages) =>
      prevPages.map((p) =>
        p.id === page.id ? { ...p, isLoadingAnalytics: true } : p
      )
    );

    try {
      const response = await fetch(`/api/analytics/${page.id}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setPages((prevPages) =>
          prevPages.map((p) =>
            p.id === page.id
              ? { ...p, analytics: analyticsData, isLoadingAnalytics: false }
              : p
          )
        );
      } else {
        setPages((prevPages) =>
          prevPages.map((p) =>
            p.id === page.id ? { ...p, isLoadingAnalytics: false } : p
          )
        );
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setPages((prevPages) =>
        prevPages.map((p) =>
          p.id === page.id ? { ...p, isLoadingAnalytics: false } : p
        )
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center font-sans" style={{ background: 'linear-gradient(#2F3441, #000)' }}>
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans flex" style={{ background: 'linear-gradient(#2F3441, #000)' }}>
      <DashboardSidebar />
      <div className="flex-1 ml-64">
        <div className="w-full px-8 py-8 mt-6 rounded-xl" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-white mb-2">
              Insights
            </h1>
            <p className="text-zinc-400">
              Bekijk statistieken en prestaties van je Lynqit pages
            </p>
          </div>

          {pages.length === 0 ? (
            <div className="rounded-xl p-8 text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <p className="text-zinc-400">
                Je hebt nog geen Lynqit pages. Maak er een aan om statistieken te zien.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
                {pages.map((page) => {
                  const analytics = page.analytics;
                  const isLoading = page.isLoadingAnalytics;
                  const isExpanded = expandedPages.has(page.id);
                  const hasMultiplePages = pages.length > 1;

                  return (
                    <div
                      key={page.id}
                      className="rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                    >
                      <div
                        className={`flex items-center justify-between p-6 cursor-pointer transition-colors ${
                          hasMultiplePages ? "" : "cursor-default"
                        }`}
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'}
                        onClick={() => hasMultiplePages && togglePage(page.id)}
                      >
                        <h2 className="text-xl font-semibold text-white">
                          {formatPageTitle(page.slug)}
                        </h2>
                        {hasMultiplePages && (
                          <i
                            className={`fas fa-chevron-${isExpanded ? "up" : "down"} text-zinc-400 transition-transform`}
                          ></i>
                        )}
                      </div>
                      
                      {(isExpanded || !hasMultiplePages) && (
                        <div className="px-6 pb-6">
                          {isLoading ? (
                            <div className="text-center py-8">
                              <p className="text-zinc-400">
                                Statistieken laden...
                              </p>
                            </div>
                          ) : analytics ? (
                            <>
                              {/* Main Statistics */}
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                              <p className="text-sm text-zinc-400 mb-1">
                                Totale pageviews
                              </p>
                              <p className="text-2xl font-bold text-white">
                                {analytics.totalViews.toLocaleString()}
                              </p>
                            </div>
                            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                              <p className="text-sm text-zinc-400 mb-1">
                                Huidige maand
                              </p>
                              <p className="text-2xl font-bold text-white">
                                {analytics.currentMonthViews.toLocaleString()}
                              </p>
                            </div>
                            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                              <p className="text-sm text-zinc-400 mb-1">
                                Vorige maand
                              </p>
                              <p className="text-2xl font-bold text-white">
                                {analytics.previousMonthViews.toLocaleString()}
                              </p>
                            </div>
                            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                              <p className="text-sm text-zinc-400 mb-1">
                                Verandering
                              </p>
                              <p
                                className={`text-2xl font-bold ${
                                  analytics.percentageChange >= 0
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {analytics.percentageChange >= 0 ? "+" : ""}
                                {analytics.percentageChange.toFixed(1)}%
                              </p>
                            </div>
                          </div>

                              {/* Referrer Sources */}
                              <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-4">
                              Bron van herkomst
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {Object.entries(analytics.referrerSources)
                                .sort(([, a], [, b]) => b - a)
                                .map(([source, count]) => (
                                  <div
                                    key={source}
                                    className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                                  >
                                    <p className="text-sm font-medium text-white">
                                      {source}
                                    </p>
                                    <p className="text-lg font-bold text-[#2E47FF] dark:text-[#00F0EE]">
                                      {count.toLocaleString()}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              </div>

                              {/* Click Statistics */}
                              <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-4">
                              Totale clicks
                            </h3>
                            <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                              <p className="text-3xl font-bold text-[#2E47FF] dark:text-[#00F0EE]">
                                {analytics.totalClicks?.toLocaleString() || 0}
                              </p>
                            </div>
                            
                            {analytics.clicksByType && Object.keys(analytics.clicksByType).length > 0 && (
                              <>
                                <h4 className="text-md font-semibold text-white mb-3">
                                  Clicks per type
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full">
                                    <thead>
                                      <tr>
                                        <th className="text-left py-2 px-4 text-sm font-semibold text-white border-b border-zinc-700">
                                          Knop
                                        </th>
                                        <th className="text-right py-2 px-4 text-sm font-semibold text-white border-b border-zinc-700">
                                          Clicks
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {Object.entries(analytics.clicksByType)
                                        .sort(([, a], [, b]) => b - a)
                                        .map(([clickType, count]) => {
                                          // Get the actual button name from page data
                                          let displayName = clickType;
                                          
                                          // Handle CTA buttons - extract the button text
                                          if (clickType.startsWith("cta_")) {
                                            displayName = clickType.replace(/^cta_/, "");
                                          }
                                          // Handle promo banner buttons - extract the button text
                                          else if (clickType.startsWith("promo_banner_")) {
                                            displayName = clickType.replace(/^promo_banner_/, "");
                                          }
                                          // Handle social media
                                          else if (clickType.startsWith("social_")) {
                                            const platform = clickType.replace(/^social_/, "");
                                            const platformInfo = socialPlatforms[platform];
                                            displayName = platformInfo?.label || platform.charAt(0).toUpperCase() + platform.slice(1);
                                          }
                                          // Handle featured links
                                          else if (clickType.startsWith("featured_")) {
                                            const match = clickType.match(/^featured_(\d+)$/);
                                            if (match) {
                                              const index = parseInt(match[1]) - 1;
                                              const link = Object.values(page.featuredLinks)[index];
                                              displayName = link?.title || `Featured Link ${index + 1}`;
                                            } else {
                                              displayName = clickType.replace(/^featured_/, "Featured ");
                                            }
                                          }
                                          // Handle events
                                          else if (clickType.startsWith("event_")) {
                                            const match = clickType.match(/^event_(\d+)$/);
                                            if (match) {
                                              const index = parseInt(match[1]);
                                              const event = page.events?.[index];
                                              displayName = event?.text || `Event ${index}`;
                                            } else {
                                              displayName = clickType.replace(/^event_/, "Event ");
                                            }
                                          }
                                          // Handle custom links
                                          else if (clickType.startsWith("custom_link_")) {
                                            const match = clickType.match(/^custom_link_(\d+)$/);
                                            if (match) {
                                              const index = parseInt(match[1]);
                                              const link = page.customLinks?.[index];
                                              displayName = link?.text || `Custom Link ${index}`;
                                            } else {
                                              displayName = clickType.replace(/^custom_link_/, "Custom Link ");
                                            }
                                          }
                                          // Handle shows
                                          else if (clickType.startsWith("show_")) {
                                            const match = clickType.match(/^show_(\d+)$/);
                                            if (match) {
                                              const index = parseInt(match[1]);
                                              const show = page.shows?.[index];
                                              displayName = show?.show || `Show ${index}`;
                                            } else {
                                              displayName = clickType.replace(/^show_/, "Show ");
                                            }
                                          }
                                          // Handle phone
                                          else if (clickType === "phone") {
                                            displayName = page.telefoonnummer || "Telefoon";
                                          }
                                          // Handle email
                                          else if (clickType === "email") {
                                            displayName = page.emailadres || "Email";
                                          }
                                          // Handle other types
                                          else {
                                            displayName = clickType.replace(/_/g, " ");
                                            displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
                                          }
                                          
                                          return (
                                            <tr key={clickType} className="border-b border-zinc-800">
                                              <td className="py-3 px-4 text-sm text-white">
                                                {displayName}
                                              </td>
                                              <td className="py-3 px-4 text-sm text-right font-bold text-[#2E47FF] dark:text-[#00F0EE]">
                                                {count.toLocaleString()}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                    </tbody>
                                  </table>
                                </div>
                              </>
                            )}
                              </div>

                              {/* Daily Views Graph */}
                              <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-4">
                              Pageviews per dag (laatste 30 dagen)
                            </h3>
                            <div className="h-64 w-full">
                              {analytics.dailyViews.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={analytics.dailyViews}>
                                    <CartesianGrid
                                      strokeDasharray="3 3"
                                      stroke="#e4e4e7"
                                      className="dark:stroke-zinc-700"
                                    />
                                    <XAxis
                                      dataKey="date"
                                      tickFormatter={formatDate}
                                      stroke="#71717a"
                                      className="dark:stroke-zinc-400"
                                    />
                                    <YAxis
                                      stroke="#71717a"
                                      className="dark:stroke-zinc-400"
                                    />
                                    <Tooltip
                                      contentStyle={{
                                        backgroundColor: "white",
                                        border: "1px solid #e4e4e7",
                                        borderRadius: "8px",
                                      }}
                                      labelFormatter={(label) => formatDate(label)}
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
                                <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
                                  Nog geen data beschikbaar
                                </div>
                              )}
                              </div>
                              </div>

                              {/* Daily Clicks Graph */}
                              {analytics.dailyClicks && analytics.dailyClicks.length > 0 && (
                                <div>
                              <h3 className="text-lg font-semibold text-white mb-4">
                                Clicks per dag (laatste 30 dagen)
                              </h3>
                              <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={analytics.dailyClicks}>
                                    <CartesianGrid
                                      strokeDasharray="3 3"
                                      stroke="#e4e4e7"
                                      className="dark:stroke-zinc-700"
                                    />
                                    <XAxis
                                      dataKey="date"
                                      tickFormatter={formatDate}
                                      stroke="#71717a"
                                      className="dark:stroke-zinc-400"
                                    />
                                    <YAxis
                                      stroke="#71717a"
                                      className="dark:stroke-zinc-400"
                                    />
                                    <Tooltip
                                      contentStyle={{
                                        backgroundColor: "white",
                                        border: "1px solid #e4e4e7",
                                        borderRadius: "8px",
                                      }}
                                      labelFormatter={(label) => formatDate(label)}
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
                                </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-zinc-400">
                                Geen statistieken beschikbaar
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
