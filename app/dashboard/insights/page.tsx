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
  otherReferrers?: Record<string, number>; // Individual referrer URLs for "Other" category
  dailyViews: Array<{ date: string; views: number }>;
  totalClicks: number;
  clicksByType: Record<string, number>;
  dailyClicks: Array<{ date: string; clicks: number }>;
  // Engagement metrics
  uniqueVisitors: number;
  currentMonthUniqueVisitors: number;
  previousMonthUniqueVisitors: number;
  uniqueVisitorsPercentageChange: number;
  clickThroughRate: number;
  currentMonthCTR: number;
  previousMonthCTR: number;
  ctrPercentageChange: number;
  averageClicksPerVisitor: number;
  returnVisitors: number;
  newVisitors: number;
  last7DaysViews?: Record<string, number>; // Pageviews for the last 7 days (date keys: YYYY-MM-DD)
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
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default to 30 days ago
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]; // Today
  });
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
        if ((error || !session || !session.user)) {
          const cachedUser = localStorage.getItem("lynqit_user");
          if (cachedUser) {
            try {
              const user = JSON.parse(cachedUser);
              // User exists in localStorage, continue with cached user
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

        // Get user info from API
        const userResponse = await fetch(`/api/user?email=${encodeURIComponent(session.user.email || "")}`);
        if (!isMounted) return;
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.user && isMounted) {
            setUser(userData.user);
            // Store in localStorage for backward compatibility
            localStorage.setItem("lynqit_user", JSON.stringify(userData.user));
            
            // Show cached pages immediately for instant UI
            const cachedPages = localStorage.getItem("lynqit_pages");
            if (cachedPages && isMounted) {
              try {
                const pages = JSON.parse(cachedPages);
                const cacheTimestamp = localStorage.getItem("lynqit_pages_timestamp");
                if (cacheTimestamp) {
                  const age = Date.now() - parseInt(cacheTimestamp);
                  if (age < 5 * 60 * 1000) { // 5 minutes
                    setPages(pages);
                    // If there's only one page, select it by default
                    if (pages.length === 1) {
                      setSelectedPageId(pages[0].id);
                    }
                  }
                }
              } catch (e) {
                // Invalid cache, continue to fetch
              }
            }
            
            // Fetch user's pages with access token or email fallback
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

  const fetchPages = async (accessToken?: string) => {
    try {
      // Get user email from localStorage if no token
      let userEmail: string | undefined;
      if (!accessToken) {
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
      
      const pagesUrl = accessToken 
        ? `/api/pages`
        : `/api/pages?email=${encodeURIComponent(userEmail || "")}`;
      
      const fetchOptions: RequestInit = accessToken
        ? { headers: { "Authorization": `Bearer ${accessToken}` } }
        : {};
      
      const response = await fetch(pagesUrl, fetchOptions);
      
      if (response.ok) {
        const data = await response.json();
        const pagesData = data.pages || [];
        console.log(`[Insights] Loaded ${pagesData.length} pages`);
        setPages(pagesData);
        
        // Cache pages for next time
        localStorage.setItem("lynqit_pages", JSON.stringify(pagesData));
        localStorage.setItem("lynqit_pages_timestamp", Date.now().toString());
        
        // If there's only one page, select it by default
        if (pagesData.length === 1) {
          setSelectedPageId(pagesData[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching pages:", error);
    }
  };

  // Load analytics when selectedPageId changes
  useEffect(() => {
    if (!selectedPageId) return;

    // Mark as loading (using functional update to avoid dependency on pages)
    setPages((prevPages) => {
      const selectedPage = prevPages.find((p) => p.id === selectedPageId);
      if (!selectedPage) return prevPages; // Don't update if page not found
      
      return prevPages.map((p) =>
        p.id === selectedPageId ? { ...p, isLoadingAnalytics: true } : p
      );
    });

    // Fetch analytics with date filters
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    fetch(`/api/analytics/${selectedPageId}?${params.toString()}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error("Failed to fetch analytics");
      })
      .then((analyticsData) => {
        setPages((prevPages) =>
          prevPages.map((p) =>
            p.id === selectedPageId
              ? { ...p, analytics: analyticsData, isLoadingAnalytics: false }
              : p
          )
        );
      })
      .catch((error) => {
        console.error("Error fetching analytics:", error);
        setPages((prevPages) =>
          prevPages.map((p) =>
            p.id === selectedPageId ? { ...p, isLoadingAnalytics: false } : p
          )
        );
      });
  }, [selectedPageId, startDate, endDate]); // Re-run when selectedPageId or date filters change

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
  };

  // Don't show loading screen, just render empty state if needed

  return (
    <div className="min-h-screen font-sans flex" style={{ background: 'linear-gradient(#2F3441, #000)' }}>
      <DashboardSidebar />
      <div className="flex-1 ml-64">
        <div className="w-full px-8 py-8 mt-6 rounded-xl" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-white mb-2">
              Insights
            </h1>
            <p className="text-zinc-400 mb-4">
              Bekijk statistieken en prestaties van je Lynqit pages
            </p>
            
            {pages.length > 0 && (
              <div className="mb-6 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 md:flex-none md:w-96">
                  <label className="block text-md font-medium text-white mb-2">
                    Selecteer een pagina
                  </label>
                  <select
                    value={selectedPageId || ""}
                    onChange={(e) => setSelectedPageId(e.target.value || null)}
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-[#2E47FF] focus:border-transparent"
                  >
                    <option value="">Selecteer een pagina...</option>
                    {pages.map((page) => (
                      <option key={page.id} value={page.id}>
                        {formatPageTitle(page.slug)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-4 flex-1 md:flex-none">
                  <div className="flex-1">
                    <label className="block text-md font-medium text-white mb-2">
                      Startdatum
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-[#2E47FF] focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-md font-medium text-white mb-2">
                      Einddatum
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-[#2E47FF] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {!isLoading && pages.length === 0 ? (
            <div className="rounded-xl p-8 text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <p className="text-zinc-400">
                Je hebt nog geen Lynqit pages. Maak er een aan om statistieken te zien.
              </p>
            </div>
          ) : !isLoading && !selectedPageId ? (
            <div className="rounded-xl p-8 text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <p className="text-zinc-400">
                Selecteer een pagina uit de dropdown om statistieken te bekijken.
              </p>
            </div>
          ) : (
            (() => {
              const selectedPage = pages.find((p) => p.id === selectedPageId);
              if (!selectedPage) {
                return (
                  <div className="rounded-xl p-8 text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <p className="text-zinc-400">
                      Pagina niet gevonden.
                    </p>
                  </div>
                );
              }

              const analytics = selectedPage.analytics;
              const isLoading = selectedPage.isLoadingAnalytics;

              return (
                <div>
                  <div>
                          {isLoading ? (
                            <div className="text-center py-8">
                              <p className="text-zinc-400">
                                Statistieken laden...
                              </p>
                            </div>
                          ) : analytics ? (
                            <>
                              {/* Summary Cards - Top Row */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {/* Page Views Card */}
                                <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                  <p className="text-md text-zinc-400 mb-2">
                                    Page Views
                                  </p>
                                  <p className="text-3xl font-bold text-white mb-2">
                                    {analytics.totalViews.toLocaleString()}
                                  </p>
                                  <p className={`text-md font-medium ${
                                    analytics.percentageChange >= 0 ? "text-green-400" : "text-red-400"
                                  }`}>
                                    {analytics.percentageChange >= 0 ? "+" : ""}
                                    {analytics.percentageChange.toFixed(1)}% sinds vorige maand
                                  </p>
                                  <p className="text-md text-zinc-500 mt-1">
                                    {new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long" })}
                                  </p>
                                </div>

                                {/* Unique Visitors Card */}
                                <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                  <p className="text-md text-zinc-400 mb-2">
                                    Unieke Bezoekers
                                  </p>
                                  <p className="text-3xl font-bold text-white mb-2">
                                    {(analytics.uniqueVisitors ?? 0).toLocaleString()}
                                  </p>
                                  <p className={`text-md font-medium ${
                                    (analytics.uniqueVisitorsPercentageChange ?? 0) >= 0 ? "text-green-400" : "text-red-400"
                                  }`}>
                                    {(analytics.uniqueVisitorsPercentageChange ?? 0) >= 0 ? "+" : ""}
                                    {(analytics.uniqueVisitorsPercentageChange ?? 0).toFixed(1)}% sinds vorige maand
                                  </p>
                                  <p className="text-md text-zinc-500 mt-1">
                                    {new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long" })}
                                  </p>
                                </div>

                                {/* Click-Through Rate Card */}
                                <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                  <p className="text-md text-zinc-400 mb-2">
                                    Click-Through Rate
                                  </p>
                                  <p className="text-3xl font-bold text-white mb-2">
                                    {(analytics.clickThroughRate ?? 0).toFixed(1)}%
                                  </p>
                                  <p className={`text-md font-medium ${
                                    (analytics.ctrPercentageChange ?? 0) >= 0 ? "text-green-400" : "text-red-400"
                                  }`}>
                                    {(analytics.ctrPercentageChange ?? 0) >= 0 ? "+" : ""}
                                    {(analytics.ctrPercentageChange ?? 0).toFixed(1)}% sinds vorige maand
                                  </p>
                                  <p className="text-md text-zinc-500 mt-1">
                                    {new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long" })}
                                  </p>
                                </div>
                              </div>

                              {/* Last 7 Days Pageviews - Second Row */}
                              <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-8">
                                {(() => {
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  const days = [];
                                  
                                  for (let i = 6; i >= 0; i--) {
                                    const date = new Date(today);
                                    date.setDate(date.getDate() - i);
                                    const dateKey = date.toISOString().split("T")[0];
                                    const dayName = date.toLocaleDateString("nl-NL", { weekday: "short" });
                                    const dayNumber = date.getDate();
                                    const views = analytics.last7DaysViews?.[dateKey] || 0;
                                    
                                    days.push({
                                      dateKey,
                                      dayName,
                                      dayNumber,
                                      views,
                                      isToday: i === 0
                                    });
                                  }
                                  
                                  return days.map((day) => (
                                    <div key={day.dateKey} className="p-5 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                      <p className="text-md text-zinc-400 mb-1">
                                        {day.dayName}
                                      </p>
                                      <p className="text-md text-zinc-500 mb-2">
                                        {day.dayNumber} {new Date(day.dateKey).toLocaleDateString("nl-NL", { month: "short" })}
                                      </p>
                                      <p className={`text-2xl font-bold ${day.isToday ? "text-[#00F0EE]" : "text-white"}`}>
                                        {day.views.toLocaleString()}
                                      </p>
                                    </div>
                                  ));
                                })()}
                              </div>

                              {/* Charts Section - Bottom Row */}
                              <div className="mb-6">
                                {/* Daily Views Chart */}
                                <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                  <h3 className="text-lg font-semibold text-white mb-4">
                                    Pageviews
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
                                            tickFormatter={formatDate}
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
                                      <div className="flex items-center justify-center h-full text-zinc-500">
                                        Nog geen data beschikbaar
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Clicks Chart and Table */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                {/* Clicks Chart */}
                                {analytics.dailyClicks && analytics.dailyClicks.length > 0 ? (
                                  <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                    <h3 className="text-lg font-semibold text-white mb-4">
                                      Clicks
                                    </h3>
                                    <div className="h-64 w-full">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={analytics.dailyClicks}>
                                          <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#3f3f46"
                                          />
                                          <XAxis
                                            dataKey="date"
                                            tickFormatter={formatDate}
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
                                ) : (
                                  <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                    <h3 className="text-lg font-semibold text-white mb-4">
                                      Clicks
                                    </h3>
                                    <div className="h-64 w-full flex items-center justify-center">
                                      <p className="text-zinc-500 text-md">Nog geen clicks data beschikbaar</p>
                                    </div>
                                  </div>
                                )}

                                {/* Clicks Table */}
                                <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                  <h3 className="text-lg font-semibold text-white mb-4">
                                    Clicks per knop
                                  </h3>
                                  
                                  {analytics.clicksByType && Object.keys(analytics.clicksByType).length > 0 ? (
                                    <div className="overflow-x-auto">
                                    <table className="w-full">
                                      <thead>
                                        <tr>
                                          <th className="text-left py-2 px-4 text-md font-semibold text-white border-b border-zinc-700">
                                            Knop
                                          </th>
                                          <th className="text-right py-2 px-4 text-md font-semibold text-white border-b border-zinc-700">
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
                                              const link = Object.values(selectedPage.featuredLinks)[index];
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
                                              const event = selectedPage.events?.[index];
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
                                              const link = selectedPage.customLinks?.[index];
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
                                              const show = selectedPage.shows?.[index];
                                              displayName = show?.show || `Show ${index}`;
                                            } else {
                                              displayName = clickType.replace(/^show_/, "Show ");
                                            }
                                          }
                                          // Handle phone
                                          else if (clickType === "phone") {
                                            displayName = selectedPage.telefoonnummer || "Telefoon";
                                          }
                                          // Handle email
                                          else if (clickType === "email") {
                                            displayName = selectedPage.emailadres || "Email";
                                          }
                                          // Handle other types
                                          else {
                                            displayName = clickType.replace(/_/g, " ");
                                            displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
                                          }
                                          
                                          return (
                                            <tr key={clickType} className="border-b border-zinc-800">
                                              <td className="py-3 px-4 text-md text-white">
                                                {displayName}
                                              </td>
                                              <td className="py-3 px-4 text-md text-right font-bold text-[#2E47FF] dark:text-[#00F0EE]">
                                                {count.toLocaleString()}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                    </tbody>
                                  </table>
                                </div>
                                ) : (
                                  <p className="text-zinc-400 text-md">Nog geen clicks geregistreerd</p>
                                )}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-zinc-400">
                                Geen statistieken beschikbaar
                              </p>
                            </div>
                          )}
                        </div>
                    </div>
                  );
                })()
          )}
        </div>
      </div>
    </div>
  );
}
