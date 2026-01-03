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

    // Get date filters from query parameters
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    let pageViews = await getPageViewsForPage(pageId);
    
    // Filter pageviews by date range if provided
    if (startDateParam || endDateParam) {
      const startDate = startDateParam ? new Date(startDateParam) : null;
      const endDate = endDateParam ? new Date(endDateParam) : null;
      
      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(23, 59, 59, 999);
      
      pageViews = pageViews.filter((pv) => {
        const timestamp = new Date(pv.timestamp);
        if (startDate && timestamp < startDate) return false;
        if (endDate && timestamp > endDate) return false;
        return true;
      });
    }

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
    const otherReferrers: Record<string, number> = {}; // Store individual referrer URLs for "Other"
    
    pageViews.forEach((pv) => {
      const source = categorizeReferrer(pv.referrer);
      referrerCounts[source] = (referrerCounts[source] || 0) + 1;
      
      // If it's "Other", also track the individual referrer URL
      if (source === "Other" && pv.referrer) {
        try {
          const url = new URL(pv.referrer);
          const hostname = url.hostname;
          otherReferrers[hostname] = (otherReferrers[hostname] || 0) + 1;
        } catch {
          // If URL parsing fails, use the referrer as-is (truncated if too long)
          const displayReferrer = pv.referrer.length > 50 ? pv.referrer.substring(0, 50) + "..." : pv.referrer;
          otherReferrers[displayReferrer] = (otherReferrers[displayReferrer] || 0) + 1;
        }
      }
    });

    // Group by day for the date range (or last 30 days if no range specified)
    const last30Days: Record<string, number> = {};
    const dateRangeStart = startDateParam ? new Date(startDateParam) : (() => {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      return date;
    })();
    dateRangeStart.setHours(0, 0, 0, 0);

    pageViews
      .filter((pv) => new Date(pv.timestamp) >= dateRangeStart)
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
    let clicks = await getClicksForPage(pageId);
    
    // Filter clicks by date range if provided
    if (startDateParam || endDateParam) {
      const startDate = startDateParam ? new Date(startDateParam) : null;
      const endDate = endDateParam ? new Date(endDateParam) : null;
      
      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(23, 59, 59, 999);
      
      clicks = clicks.filter((c) => {
        const timestamp = new Date(c.timestamp);
        if (startDate && timestamp < startDate) return false;
        if (endDate && timestamp > endDate) return false;
        return true;
      });
    }
    
    const totalClicks = clicks.length;

    // Group clicks by type
    const clicksByType: Record<string, number> = {};
    clicks.forEach((click) => {
      clicksByType[click.clickType] = (clicksByType[click.clickType] || 0) + 1;
    });

    // Group clicks by day for the date range (or last 30 days if no range specified)
    const last30DaysClicks: Record<string, number> = {};
    const dateRangeStartClicks = startDateParam ? new Date(startDateParam) : (() => {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      return date;
    })();
    dateRangeStartClicks.setHours(0, 0, 0, 0);

    clicks
      .filter((c) => new Date(c.timestamp) >= dateRangeStartClicks)
      .forEach((c) => {
        const date = new Date(c.timestamp);
        const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
        last30DaysClicks[dateKey] = (last30DaysClicks[dateKey] || 0) + 1;
      });

    // Convert to array for graph
    const dailyClicks = Object.entries(last30DaysClicks)
      .map(([date, count]) => ({ date, clicks: count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate Unique Visitors (based on IP + User Agent combination)
    const uniqueVisitorsSet = new Set<string>();
    pageViews.forEach((pv) => {
      const identifier = `${pv.ip || 'unknown'}_${pv.userAgent || 'unknown'}`;
      uniqueVisitorsSet.add(identifier);
    });
    const uniqueVisitors = uniqueVisitorsSet.size;

    // Current month unique visitors
    const currentMonthUniqueVisitorsSet = new Set<string>();
    currentMonthViews.forEach((pv) => {
      const identifier = `${pv.ip || 'unknown'}_${pv.userAgent || 'unknown'}`;
      currentMonthUniqueVisitorsSet.add(identifier);
    });
    const currentMonthUniqueVisitors = currentMonthUniqueVisitorsSet.size;

    // Previous month unique visitors
    const previousMonthUniqueVisitorsSet = new Set<string>();
    previousMonthViews.forEach((pv) => {
      const identifier = `${pv.ip || 'unknown'}_${pv.userAgent || 'unknown'}`;
      previousMonthUniqueVisitorsSet.add(identifier);
    });
    const previousMonthUniqueVisitors = previousMonthUniqueVisitorsSet.size;

    // Calculate percentage change for unique visitors
    let uniqueVisitorsPercentageChange = 0;
    if (previousMonthUniqueVisitors > 0) {
      uniqueVisitorsPercentageChange = ((currentMonthUniqueVisitors - previousMonthUniqueVisitors) / previousMonthUniqueVisitors) * 100;
    } else if (currentMonthUniqueVisitors > 0) {
      uniqueVisitorsPercentageChange = 100;
    }

    // Calculate Engagement Metrics
    // Click-Through Rate (CTR)
    const clickThroughRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

    // Average Clicks per Visitor
    const averageClicksPerVisitor = uniqueVisitors > 0 ? totalClicks / uniqueVisitors : 0;

    // Return Visitors (visitors who visited more than once)
    const visitorCounts: Record<string, number> = {};
    pageViews.forEach((pv) => {
      const identifier = `${pv.ip || 'unknown'}_${pv.userAgent || 'unknown'}`;
      visitorCounts[identifier] = (visitorCounts[identifier] || 0) + 1;
    });
    const returnVisitors = Object.values(visitorCounts).filter(count => count > 1).length;
    const newVisitors = uniqueVisitors - returnVisitors;

    // Calculate CTR for current month
    const currentMonthClicks = clicks.filter((c) => {
      const timestamp = new Date(c.timestamp);
      return timestamp >= currentMonthStart && timestamp <= currentMonthEnd;
    }).length;
    const currentMonthCTR = currentMonthCount > 0 ? (currentMonthClicks / currentMonthCount) * 100 : 0;

    // Previous month CTR
    const previousMonthClicks = clicks.filter((c) => {
      const timestamp = new Date(c.timestamp);
      return timestamp >= previousMonthStart && timestamp <= previousMonthEnd;
    }).length;
    const previousMonthCTR = previousMonthCount > 0 ? (previousMonthClicks / previousMonthCount) * 100 : 0;

    // CTR percentage change
    let ctrPercentageChange = 0;
    if (previousMonthCTR > 0) {
      ctrPercentageChange = ((currentMonthCTR - previousMonthCTR) / previousMonthCTR) * 100;
    } else if (currentMonthCTR > 0) {
      ctrPercentageChange = 100;
    }

    // Calculate pageviews for the last 7 days (or last 7 days of date range)
    const last7DaysViews: Record<string, number> = {};
    const today = endDateParam ? new Date(endDateParam) : new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get the last 7 days within the date range
    const sevenDaysStart = new Date(today);
    sevenDaysStart.setDate(sevenDaysStart.getDate() - 6);
    
    // If startDate is provided and is more recent than 7 days ago, use startDate
    const actualStart = startDateParam && new Date(startDateParam) > sevenDaysStart 
      ? new Date(startDateParam) 
      : sevenDaysStart;
    actualStart.setHours(0, 0, 0, 0);
    
    // Generate date keys for the last 7 days (or available days in range)
    const daysToShow = Math.min(7, Math.ceil((today.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
      last7DaysViews[dateKey] = 0;
    }

    pageViews.forEach((pv) => {
      const timestamp = new Date(pv.timestamp);
      timestamp.setHours(0, 0, 0, 0);
      const dateKey = timestamp.toISOString().split("T")[0];
      if (last7DaysViews.hasOwnProperty(dateKey)) {
        last7DaysViews[dateKey] = (last7DaysViews[dateKey] || 0) + 1;
      }
    });

    return NextResponse.json({
      totalViews,
      currentMonthViews: currentMonthCount,
      previousMonthViews: previousMonthCount,
      percentageChange: Math.round(percentageChange * 10) / 10, // Round to 1 decimal
      referrerSources: referrerCounts,
      otherReferrers, // Individual referrer URLs for "Other" category
      dailyViews,
      totalClicks,
      clicksByType,
      dailyClicks,
      // New metrics
      uniqueVisitors,
      currentMonthUniqueVisitors,
      previousMonthUniqueVisitors,
      uniqueVisitorsPercentageChange: Math.round(uniqueVisitorsPercentageChange * 10) / 10,
      clickThroughRate: Math.round(clickThroughRate * 10) / 10,
      currentMonthCTR: Math.round(currentMonthCTR * 10) / 10,
      previousMonthCTR: Math.round(previousMonthCTR * 10) / 10,
      ctrPercentageChange: Math.round(ctrPercentageChange * 10) / 10,
      averageClicksPerVisitor: Math.round(averageClicksPerVisitor * 10) / 10,
      returnVisitors,
      newVisitors,
      last7DaysViews, // Pageviews for the last 7 days
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

