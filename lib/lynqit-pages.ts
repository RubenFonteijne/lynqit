import { createServerClient } from './supabase-server';
import { getUserByEmail } from './users';

export type SubscriptionPlan = "free" | "start" | "pro";

export interface SocialMediaLinks {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
  linkedin?: string;
  soundcloud?: string;
  spotify?: string;
  website?: string;
}

export interface FeaturedLink {
  image?: string;
  title: string;
  link: string;
}

export interface PromoBanner {
  enabled: boolean;
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundImage?: string;
}

export interface ScheduledMessage {
  enabled?: boolean;
  text: string;
  link: string;
  visibleFrom?: string;
  visibleUntil?: string;
  eventDate?: string;
}

export interface EventButton {
  text: string;
  link: string;
  eventDate: string;
  location?: string;
  visibleFrom?: string;
  visibleUntil?: string;
  enabled?: boolean;
}

export interface ShowButton {
  show: string;
  date: string;
  location?: string;
  link?: string;
  enabled?: boolean;
}

export interface CustomLink {
  text: string;
  url: string;
  enabled?: boolean;
}

export interface Product {
  name: string;
  price: string;
  discountPrice?: string;
  isFromPrice?: boolean;
  link: string;
  image: string;
  enabled?: boolean;
}

export type TemplateType = "default" | "events" | "artist" | "webshop";

export interface LynqitPage {
  id: string;
  userId: string; // email of the user who owns this page
  slug: string;
  title?: string;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionStatus?: "active" | "cancelled" | "expired";
  mollieSubscriptionId?: string;
  stripeSubscriptionId?: string; // Stripe subscription ID
  isDemo?: boolean;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  template?: TemplateType;
  theme?: "dark" | "light";
  brandColor?: string;
  ctaTextColor?: string;
  backgroundColor?: string;
  header: {
    type: "video" | "image";
    url?: string;
  };
  promoBanner: PromoBanner;
  scheduledMessage?: ScheduledMessage;
  events?: EventButton[];
  products?: Product[];
  shows?: ShowButton[];
  logo?: string;
  spotifyUrl?: string;
  intro?: string;
  telefoonnummer?: string;
  emailadres?: string;
  ctaButton: {
    text: string;
    link: string;
  };
  socialMedia: SocialMediaLinks;
  featuredLinks: {
    link1?: FeaturedLink;
    link2?: FeaturedLink;
    link3?: FeaturedLink;
    link4?: FeaturedLink;
  };
  customLinks?: CustomLink[];
  createdAt: string;
  updatedAt: string;
}

// Get all pages
export async function getPages(): Promise<LynqitPage[]> {
  const supabase = createServerClient();
  
  try {
    // First, get all pages
    const { data: pagesData, error: pagesError } = await supabase
      .from('lynqit_pages')
      .select('*')
      .order('created_at', { ascending: false });

    if (pagesError) {
      console.error('Error fetching pages:', pagesError);
      return [];
    }

    if (!pagesData || pagesData.length === 0) {
      return [];
    }

    // Get all unique user IDs
    const userIds = [...new Set(pagesData.map((p: any) => p.user_id))];
    
    // Fetch all users in one query
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return [];
    }

    // Create a map of user_id -> email
    const userEmailMap = new Map(
      (usersData || []).map((u: any) => [u.id, u.email])
    );

    // Map pages with user emails
    const pagesWithUsers = pagesData.map((page: any) => ({
      ...page,
      users: userEmailMap.get(page.user_id) ? { email: userEmailMap.get(page.user_id) } : null,
    }));

    return pagesWithUsers.map(mapDbPageToPage);
  } catch (error) {
    console.error('Error fetching pages:', error);
    return [];
  }
}

// Get page by ID
export async function getPageById(id: string): Promise<LynqitPage | undefined> {
  const supabase = createServerClient();
  
  try {
    const { data: pageData, error } = await supabase
      .from('lynqit_pages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return undefined;
      }
      console.error('Error fetching page by id:', error);
      return undefined;
    }

    if (!pageData) {
      return undefined;
    }

    // Get user email
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', pageData.user_id)
      .single();

    const pageWithUser = {
      ...pageData,
      users: userData ? { email: userData.email } : null,
    };

    return mapDbPageToPage(pageWithUser);
  } catch (error) {
    console.error('Error fetching page by id:', error);
    return undefined;
  }
}

// Get page by slug
export async function getPageBySlug(slug: string): Promise<LynqitPage | undefined> {
  const supabase = createServerClient();
  
  try {
    const { data: pageData, error } = await supabase
      .from('lynqit_pages')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return undefined;
      }
      console.error('Error fetching page by slug:', error);
      return undefined;
    }

    if (!pageData) {
      return undefined;
    }

    // Get user email
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', pageData.user_id)
      .single();

    const pageWithUser = {
      ...pageData,
      users: userData ? { email: userData.email } : null,
    };

    return mapDbPageToPage(pageWithUser);
  } catch (error) {
    console.error('Error fetching page by slug:', error);
    return undefined;
  }
}

// Get pages by user email
export async function getPagesByUser(userId: string): Promise<LynqitPage[]> {
  const supabase = createServerClient();
  
  // First get the user to get their ID
  const user = await getUserByEmail(userId);
  if (!user) {
    return [];
  }

  try {
    // Get pages for this user
    const { data: pagesData, error: pagesError } = await supabase
      .from('lynqit_pages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (pagesError) {
      console.error('Error fetching pages by user:', pagesError);
      return [];
    }

    if (!pagesData || pagesData.length === 0) {
      return [];
    }

    // Map pages with user email
    const pagesWithUsers = pagesData.map((page: any) => ({
      ...page,
      users: { email: user.email },
    }));

    return pagesWithUsers.map(mapDbPageToPage);
  } catch (error) {
    console.error('Error fetching pages by user:', error);
    return [];
  }
}

// Create a new page
export async function createPage(
  userId: string, 
  slug: string, 
  options?: { 
    subscriptionPlan?: SubscriptionPlan; 
    subscriptionStatus?: "active" | "cancelled" | "expired";
    isDemo?: boolean;
  }
): Promise<LynqitPage> {
  const supabase = createServerClient();
  
  // Check if slug already exists
  const existingPage = await getPageBySlug(slug);
  if (existingPage) {
    throw new Error("Deze URL is al bezet. Kies een andere URL.");
  }

  // Get user to get their ID
  const user = await getUserByEmail(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const now = new Date().toISOString();
  const insertData: any = {
    user_id: user.id,
    slug,
    subscription_plan: options?.subscriptionPlan || 'free',
    subscription_status: options?.subscriptionStatus || 'active',
    template: 'default',
    theme: 'dark',
    brand_color: '#2E47FF',
    header_type: 'image',
    header_url: null,
    promo_banner: { enabled: false },
    cta_button: { text: '', link: '' },
    social_media: {},
    featured_links: {},
    custom_links: [],
    created_at: now,
    updated_at: now,
  };
  
  // Only include is_demo if it's explicitly set (column might not exist yet)
  if (options?.isDemo !== undefined) {
    insertData.is_demo = options.isDemo;
  }

  const { data: pageData, error } = await supabase
    .from('lynqit_pages')
    .insert(insertData)
    .select('*')
    .single();

  if (error) {
    console.error('Error creating page:', error);
    throw new Error('Failed to create page');
  }

  if (!pageData) {
    throw new Error('Page not created');
  }

  // Get user email
  const { data: userData } = await supabase
    .from('users')
    .select('email')
    .eq('id', pageData.user_id)
    .single();

  const pageWithUser = {
    ...pageData,
    users: userData ? { email: userData.email } : null,
  };

  return mapDbPageToPage(pageWithUser);
}

// Update a page
export async function updatePage(id: string, updates: Partial<LynqitPage>, allowUserIdUpdate: boolean = false): Promise<LynqitPage> {
  const supabase = createServerClient();
  
  // Don't allow updating id, userId, createdAt (unless explicitly allowed for admin)
  const { id: _, userId: __, createdAt: ___, ...allowedUpdates } = updates;
  
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };
  
  // Allow userId update if explicitly allowed (for admin operations)
  if (allowUserIdUpdate && updates.userId !== undefined) {
    // Get user ID from email
    const user = await getUserByEmail(updates.userId);
    if (!user) {
      throw new Error('User not found');
    }
    updateData.user_id = user.id;
  }

  // Map interface fields to database fields
  if (allowedUpdates.title !== undefined) updateData.title = allowedUpdates.title;
  if (allowedUpdates.subscriptionPlan !== undefined) updateData.subscription_plan = allowedUpdates.subscriptionPlan;
  if (allowedUpdates.subscriptionStatus !== undefined) updateData.subscription_status = allowedUpdates.subscriptionStatus;
  if (allowedUpdates.mollieSubscriptionId !== undefined) updateData.mollie_subscription_id = allowedUpdates.mollieSubscriptionId;
  if (allowedUpdates.stripeSubscriptionId !== undefined) updateData.stripe_subscription_id = allowedUpdates.stripeSubscriptionId;
  if (allowedUpdates.isDemo !== undefined) updateData.is_demo = allowedUpdates.isDemo;
  if (allowedUpdates.subscriptionStartDate !== undefined) updateData.subscription_start_date = allowedUpdates.subscriptionStartDate;
  if (allowedUpdates.subscriptionEndDate !== undefined) updateData.subscription_end_date = allowedUpdates.subscriptionEndDate;
  if (allowedUpdates.template !== undefined) updateData.template = allowedUpdates.template;
  if (allowedUpdates.theme !== undefined) updateData.theme = allowedUpdates.theme;
  if (allowedUpdates.brandColor !== undefined) updateData.brand_color = allowedUpdates.brandColor;
  // Only include cta_text_color if it's explicitly provided (column might not exist yet)
  if (allowedUpdates.ctaTextColor !== undefined) {
    updateData.cta_text_color = allowedUpdates.ctaTextColor;
  }
  if (allowedUpdates.backgroundColor !== undefined) updateData.background_color = allowedUpdates.backgroundColor;
  if (allowedUpdates.header !== undefined) {
    updateData.header_type = allowedUpdates.header.type;
    updateData.header_url = allowedUpdates.header.url;
  }
  if (allowedUpdates.promoBanner !== undefined) updateData.promo_banner = allowedUpdates.promoBanner;
  if (allowedUpdates.scheduledMessage !== undefined) updateData.scheduled_message = allowedUpdates.scheduledMessage;
  if (allowedUpdates.events !== undefined) updateData.events = allowedUpdates.events;
  if (allowedUpdates.products !== undefined) updateData.products = allowedUpdates.products;
  if (allowedUpdates.shows !== undefined) updateData.shows = allowedUpdates.shows;
  if (allowedUpdates.logo !== undefined) updateData.logo = allowedUpdates.logo;
  if (allowedUpdates.spotifyUrl !== undefined) updateData.spotify_url = allowedUpdates.spotifyUrl;
  if (allowedUpdates.intro !== undefined) updateData.intro = allowedUpdates.intro;
  if (allowedUpdates.telefoonnummer !== undefined) updateData.telefoonnummer = allowedUpdates.telefoonnummer;
  if (allowedUpdates.emailadres !== undefined) updateData.emailadres = allowedUpdates.emailadres;
  if (allowedUpdates.ctaButton !== undefined) updateData.cta_button = allowedUpdates.ctaButton;
  if (allowedUpdates.socialMedia !== undefined) updateData.social_media = allowedUpdates.socialMedia;
  if (allowedUpdates.featuredLinks !== undefined) updateData.featured_links = allowedUpdates.featuredLinks;
  if (allowedUpdates.customLinks !== undefined) updateData.custom_links = allowedUpdates.customLinks;

  let { data: pageData, error } = await supabase
    .from('lynqit_pages')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  // If update fails due to missing column, retry without it
  if (error && (error.message?.includes('column') || error.code === '42703')) {
    console.warn('Column does not exist, retrying update without new columns');
    // Remove potentially missing columns from updateData and retry
    const { cta_text_color, is_demo, ...updateDataWithoutNewColumns } = updateData;
    const retryResult = await supabase
      .from('lynqit_pages')
      .update(updateDataWithoutNewColumns)
      .eq('id', id)
      .select('*')
      .single();
    
    if (retryResult.error) {
      console.error('Error updating page (retry):', retryResult.error);
      throw new Error(`Failed to update page: ${retryResult.error.message || 'Unknown error'}`);
    }
    
    pageData = retryResult.data;
    error = null;
  } else if (error) {
    console.error('Error updating page:', error);
    throw new Error(`Failed to update page: ${error.message || 'Unknown error'}`);
  }

  if (!pageData) {
    throw new Error('Page not found');
  }

  // Get user email
  const { data: userData } = await supabase
    .from('users')
    .select('email')
    .eq('id', pageData.user_id)
    .single();

  const pageWithUser = {
    ...pageData,
    users: userData ? { email: userData.email } : null,
  };

  return mapDbPageToPage(pageWithUser);
}

// Delete a page
export async function deletePage(id: string): Promise<void> {
  const supabase = createServerClient();
  
  const { error } = await supabase
    .from('lynqit_pages')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting page:', error);
    throw new Error('Failed to delete page');
  }
}

// Check if user owns the page
export async function userOwnsPage(userId: string, pageId: string): Promise<boolean> {
  const { isAdminUserAsync } = await import('./users');
  
  // Admin users have access to all pages
  if (await isAdminUserAsync(userId)) {
    return true;
  }
  
  const page = await getPageById(pageId);
  return page?.userId === userId;
}

// Helper function to map database page to LynqitPage interface
function mapDbPageToPage(dbPage: any): LynqitPage {
  return {
    id: dbPage.id,
    userId: dbPage.users?.email || '', // Get email from joined users table
    slug: dbPage.slug,
    title: dbPage.title,
    subscriptionPlan: dbPage.subscription_plan,
    subscriptionStatus: dbPage.subscription_status,
    mollieSubscriptionId: dbPage.mollie_subscription_id,
    stripeSubscriptionId: dbPage.stripe_subscription_id,
    isDemo: dbPage.is_demo || false,
    subscriptionStartDate: dbPage.subscription_start_date,
    subscriptionEndDate: dbPage.subscription_end_date,
    template: dbPage.template,
    theme: dbPage.theme,
    brandColor: dbPage.brand_color,
    ctaTextColor: dbPage.cta_text_color,
    backgroundColor: dbPage.background_color,
    header: {
      type: dbPage.header_type,
      url: dbPage.header_url,
    },
    promoBanner: dbPage.promo_banner || { enabled: false },
    scheduledMessage: dbPage.scheduled_message,
    events: dbPage.events,
    products: dbPage.products,
    shows: dbPage.shows,
    logo: dbPage.logo,
    spotifyUrl: dbPage.spotify_url,
    intro: dbPage.intro,
    telefoonnummer: dbPage.telefoonnummer,
    emailadres: dbPage.emailadres,
    ctaButton: dbPage.cta_button || { text: '', link: '' },
    socialMedia: dbPage.social_media || {},
    featuredLinks: dbPage.featured_links || {},
    customLinks: dbPage.custom_links,
    createdAt: dbPage.created_at,
    updatedAt: dbPage.updated_at,
  };
}
