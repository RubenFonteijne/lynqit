import { NextRequest, NextResponse } from "next/server";
import { getPageViewsForPage, getClicksForPage, categorizeReferrer } from "@/lib/analytics";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;
    
    if (!pageId) {
      return NextResponse.json(
        { error: "pageId is required" },
        { status: 400 }
      );
    }

    const pageViews = await getPageViewsForPage(pageId);

    // Calculate statistics
    const totalViews = pageViews.length;

    // Current month (first day to last day)
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // Previous month
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const currentMonthViews = pageViews.filter((pv) => {
      const timestamp = new Date(pv.timestamp);
      return timestamp >= currentMonthStart && timestamp <= currentMonthEnd;
    });

    const previousMonthViews = pageViews.filter((pv) => {
      const timestamp = new Date(pv.timestamp);
      return timestamp >= previousMonthStart && timestamp <= previousMonthEnd;
    });

    const currentMonthCount = currentMonthViews.length;
    const previousMonthCount = previousMonthViews.length;

    // Calculate percentage change
    let percentageChange = 0;
    if (previousMonthCount > 0) {
      percentageChange = ((currentMonthCount - previousMonthCount) / previousMonthCount) * 100;
    } else if (currentMonthCount > 0) {
      percentageChange = 100; // New data
    }

    // Group by referrer source
    const referrerCounts: Record<string, number> = {};
    pageViews.forEach((pv) => {
      const source = categorizeReferrer(pv.referrer);
      referrerCounts[source] = (referrerCounts[source] || 0) + 1;
    });

    // Group by day for the last 30 days
    const last30Days: Record<string, number> = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    pageViews
      .filter((pv) => new Date(pv.timestamp) >= thirtyDaysAgo)
      .forEach((pv) => {
        const date = new Date(pv.timestamp);
        const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
        last30Days[dateKey] = (last30Days[dateKey] || 0) + 1;
      });

    // Convert to array for graph
    const dailyViews = Object.entries(last30Days)
      .map(([date, count]) => ({ date, views: count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get clicks data
    const clicks = await getClicksForPage(pageId);
    const totalClicks = clicks.length;

    // Group clicks by type
    const clicksByType: Record<string, number> = {};
    clicks.forEach((click) => {
      clicksByType[click.clickType] = (clicksByType[click.clickType] || 0) + 1;
    });

    // Group clicks by day for the last 30 days
    const last30DaysClicks: Record<string, number> = {};
    const thirtyDaysAgoClicks = new Date();
    thirtyDaysAgoClicks.setDate(thirtyDaysAgoClicks.getDate() - 30);

    clicks
      .filter((c) => new Date(c.timestamp) >= thirtyDaysAgoClicks)
      .forEach((c) => {
        const date = new Date(c.timestamp);
        const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
        last30DaysClicks[dateKey] = (last30DaysClicks[dateKey] || 0) + 1;
      });

    // Convert to array for graph
    const dailyClicks = Object.entries(last30DaysClicks)
      .map(([date, count]) => ({ date, clicks: count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      totalViews,
      currentMonthViews: currentMonthCount,
      previousMonthViews: previousMonthCount,
      percentageChange: Math.round(percentageChange * 10) / 10, // Round to 1 decimal
      referrerSources: referrerCounts,
      dailyViews,
      totalClicks,
      clicksByType,
      dailyClicks,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

