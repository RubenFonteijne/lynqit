import { createServerClient } from './supabase-server';

export interface PageView {
  id: string;
  pageId: string;
  timestamp: string;
  referrer?: string;
  userAgent?: string;
  ip?: string;
}

export interface Click {
  id: string;
  pageId: string;
  timestamp: string;
  clickType: string;
  targetUrl?: string;
  userAgent?: string;
  ip?: string;
}

// Get all analytics data
export async function getAnalytics(): Promise<PageView[]> {
  const supabase = createServerClient();
  
  try {
    const { data, error } = await supabase
      .from('page_views')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching analytics:', error);
      return [];
    }

    return (data || []).map(mapDbPageViewToPageView);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return [];
  }
}

// Save analytics data (not needed with Supabase, but kept for compatibility)
export async function saveAnalytics(analytics: PageView[]): Promise<void> {
  // This function is no longer needed with Supabase
  // Analytics are inserted directly via trackPageView
  console.warn('saveAnalytics is deprecated. Use trackPageView instead.');
}

// Track a pageview
export async function trackPageView(
  pageId: string,
  referrer?: string,
  userAgent?: string,
  ip?: string
): Promise<void> {
  const supabase = createServerClient();
  
  try {
    const { error } = await supabase
      .from('page_views')
      .insert({
        page_id: pageId,
        referrer: referrer || null,
        user_agent: userAgent || null,
        ip: ip || null,
        timestamp: new Date().toISOString(),
      });

    if (error) {
      console.error('Error tracking pageview:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error tracking pageview:', error);
    throw error;
  }
}

// Get pageviews for a specific page
export async function getPageViewsForPage(pageId: string): Promise<PageView[]> {
  const supabase = createServerClient();
  
  try {
    const { data, error } = await supabase
      .from('page_views')
      .select('*')
      .eq('page_id', pageId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching pageviews for page:', error);
      return [];
    }

    return (data || []).map(mapDbPageViewToPageView);
  } catch (error) {
    console.error('Error fetching pageviews for page:', error);
    return [];
  }
}

// Get pageviews in a date range
export async function getPageViewsInRange(
  pageId: string,
  startDate: Date,
  endDate: Date
): Promise<PageView[]> {
  const supabase = createServerClient();
  
  try {
    const { data, error } = await supabase
      .from('page_views')
      .select('*')
      .eq('page_id', pageId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching pageviews in range:', error);
      return [];
    }

    return (data || []).map(mapDbPageViewToPageView);
  } catch (error) {
    console.error('Error fetching pageviews in range:', error);
    return [];
  }
}

// Get all clicks data
export async function getClicks(): Promise<Click[]> {
  const supabase = createServerClient();
  
  try {
    const { data, error } = await supabase
      .from('clicks')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching clicks:', error);
      return [];
    }

    return (data || []).map(mapDbClickToClick);
  } catch (error) {
    console.error('Error fetching clicks:', error);
    return [];
  }
}

// Save clicks data (not needed with Supabase, but kept for compatibility)
export async function saveClicks(clicks: Click[]): Promise<void> {
  // This function is no longer needed with Supabase
  // Clicks are inserted directly via trackClick
  console.warn('saveClicks is deprecated. Use trackClick instead.');
}

// Track a click
export async function trackClick(
  pageId: string,
  clickType: string,
  targetUrl?: string,
  userAgent?: string,
  ip?: string
): Promise<void> {
  const supabase = createServerClient();
  
  try {
    const { error } = await supabase
      .from('clicks')
      .insert({
        page_id: pageId,
        click_type: clickType,
        target_url: targetUrl || null,
        user_agent: userAgent || null,
        ip: ip || null,
        timestamp: new Date().toISOString(),
      });

    if (error) {
      console.error('Error tracking click:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error tracking click:', error);
    throw error;
  }
}

// Get clicks for a specific page
export async function getClicksForPage(pageId: string): Promise<Click[]> {
  const supabase = createServerClient();
  
  try {
    const { data, error } = await supabase
      .from('clicks')
      .select('*')
      .eq('page_id', pageId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching clicks for page:', error);
      return [];
    }

    return (data || []).map(mapDbClickToClick);
  } catch (error) {
    console.error('Error fetching clicks for page:', error);
    return [];
  }
}

// Get clicks in a date range
export async function getClicksInRange(
  pageId: string,
  startDate: Date,
  endDate: Date
): Promise<Click[]> {
  const supabase = createServerClient();
  
  try {
    const { data, error } = await supabase
      .from('clicks')
      .select('*')
      .eq('page_id', pageId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching clicks in range:', error);
      return [];
    }

    return (data || []).map(mapDbClickToClick);
  } catch (error) {
    console.error('Error fetching clicks in range:', error);
    return [];
  }
}

// Categorize referrer source
export function categorizeReferrer(referrer?: string): string {
  if (!referrer) return "Direct";
  
  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();
    
    // Social media
    if (hostname.includes("facebook.com") || hostname.includes("fb.com")) return "Facebook";
    if (hostname.includes("instagram.com")) return "Instagram";
    if (hostname.includes("twitter.com") || hostname.includes("x.com")) return "Twitter/X";
    if (hostname.includes("linkedin.com")) return "LinkedIn";
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) return "YouTube";
    if (hostname.includes("tiktok.com")) return "TikTok";
    if (hostname.includes("soundcloud.com")) return "SoundCloud";
    
    // Search engines
    if (hostname.includes("google.")) return "Google";
    if (hostname.includes("bing.com")) return "Bing";
    if (hostname.includes("duckduckgo.com")) return "DuckDuckGo";
    
    // Other
    return "Other";
  } catch {
    return "Other";
  }
}

// Helper functions to map database records to interfaces
function mapDbPageViewToPageView(dbPageView: any): PageView {
  return {
    id: dbPageView.id,
    pageId: dbPageView.page_id,
    timestamp: dbPageView.timestamp,
    referrer: dbPageView.referrer,
    userAgent: dbPageView.user_agent,
    ip: dbPageView.ip,
  };
}

function mapDbClickToClick(dbClick: any): Click {
  return {
    id: dbClick.id,
    pageId: dbClick.page_id,
    timestamp: dbClick.timestamp,
    clickType: dbClick.click_type,
    targetUrl: dbClick.target_url,
    userAgent: dbClick.user_agent,
    ip: dbClick.ip,
  };
}
