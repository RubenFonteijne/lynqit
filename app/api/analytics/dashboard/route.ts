import { NextRequest, NextResponse } from "next/server";
import { getPageViewsForPage, getClicksForPage, categorizeReferrer } from "@/lib/analytics";
import { getPagesByUser } from "@/lib/lynqit-pages";
import { createServerClientFromRequest } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    const supabase = createServerClientFromRequest(request);
    
    // Verify the access token and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !user || !user.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get all pages for this user
    const pages = await getPagesByUser(user.email);
    
    if (pages.length === 0) {
      return NextResponse.json({
        totalViews: 0,
        totalClicks: 0,
        totalUniqueVisitors: 0,
        averageCTR: 0,
        topPagesByViews: [],
        topPagesByClicks: [],
        dailyViews: [],
        dailyClicks: [],
        recentPages: [],
      });
    }

    // Get date filters from query parameters (optional)
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Aggregate analytics for all pages
    let totalViews = 0;
    let totalClicks = 0;
    const uniqueVisitorsSet = new Set<string>();
    const pageStats: Array<{
      pageId: string;
      slug: string;
      title?: string;
      views: number;
      clicks: number;
      uniqueVisitors: number;
    }> = [];

    // Daily aggregation for last 30 days
    const dailyViewsMap: Record<string, number> = {};
    const dailyClicksMap: Record<string, number> = {};
    
    const dateRangeStart = startDateParam ? new Date(startDateParam) : (() => {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      return date;
    })();
    dateRangeStart.setHours(0, 0, 0, 0);

    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    endDate.setHours(23, 59, 59, 999);

    // Process each page
    for (const page of pages) {
      let pageViews = await getPageViewsForPage(page.id);
      let clicks = await getClicksForPage(page.id);

      // Filter by date range if provided
      if (startDateParam || endDateParam) {
        pageViews = pageViews.filter((pv) => {
          const timestamp = new Date(pv.timestamp);
          if (startDateParam && timestamp < dateRangeStart) return false;
          if (endDateParam && timestamp > endDate) return false;
          return true;
        });

        clicks = clicks.filter((c) => {
          const timestamp = new Date(c.timestamp);
          if (startDateParam && timestamp < dateRangeStart) return false;
          if (endDateParam && timestamp > endDate) return false;
          return true;
        });
      } else {
        // Default: last 30 days
        pageViews = pageViews.filter((pv) => new Date(pv.timestamp) >= dateRangeStart);
        clicks = clicks.filter((c) => new Date(c.timestamp) >= dateRangeStart);
      }

      const pageViewsCount = pageViews.length;
      const clicksCount = clicks.length;

      // Calculate unique visitors for this page
      const pageUniqueVisitorsSet = new Set<string>();
      pageViews.forEach((pv) => {
        const identifier = `${pv.ip || 'unknown'}_${pv.userAgent || 'unknown'}`;
        pageUniqueVisitorsSet.add(identifier);
        uniqueVisitorsSet.add(identifier);
      });

      totalViews += pageViewsCount;
      totalClicks += clicksCount;

      // Aggregate daily views and clicks
      pageViews.forEach((pv) => {
        const date = new Date(pv.timestamp);
        const dateKey = date.toISOString().split("T")[0];
        if (new Date(dateKey) >= dateRangeStart) {
          dailyViewsMap[dateKey] = (dailyViewsMap[dateKey] || 0) + 1;
        }
      });

      clicks.forEach((c) => {
        const date = new Date(c.timestamp);
        const dateKey = date.toISOString().split("T")[0];
        if (new Date(dateKey) >= dateRangeStart) {
          dailyClicksMap[dateKey] = (dailyClicksMap[dateKey] || 0) + 1;
        }
      });

      // Store page stats
      pageStats.push({
        pageId: page.id,
        slug: page.slug,
        title: page.title,
        views: pageViewsCount,
        clicks: clicksCount,
        uniqueVisitors: pageUniqueVisitorsSet.size,
      });
    }

    // Calculate average CTR
    const averageCTR = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

    // Get top pages by views and clicks
    const topPagesByViews = pageStats
      .sort((a, b) => b.views - a.views)
      .slice(0, 3)
      .map((p) => ({
        pageId: p.pageId,
        slug: p.slug,
        title: p.title,
        views: p.views,
      }));

    const topPagesByClicks = pageStats
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 3)
      .map((p) => ({
        pageId: p.pageId,
        slug: p.slug,
        title: p.title,
        clicks: p.clicks,
      }));

    // Convert daily maps to arrays
    const dailyViews = Object.entries(dailyViewsMap)
      .map(([date, count]) => ({ date, views: count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const dailyClicks = Object.entries(dailyClicksMap)
      .map(([date, count]) => ({ date, clicks: count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get recent pages (sorted by updated_at)
    const recentPages = pages
      .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5)
      .map((p) => ({
        pageId: p.id,
        slug: p.slug,
        title: p.title,
        updatedAt: p.updatedAt,
      }));

    return NextResponse.json({
      totalViews,
      totalClicks,
      totalUniqueVisitors: uniqueVisitorsSet.size,
      averageCTR: Math.round(averageCTR * 10) / 10,
      topPagesByViews,
      topPagesByClicks,
      dailyViews,
      dailyClicks,
      recentPages,
    });
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard analytics" },
      { status: 500 }
    );
  }
}

