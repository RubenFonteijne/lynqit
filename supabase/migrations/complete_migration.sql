-- ============================================
-- COMPLETE SUPABASE MIGRATION FOR LYNCIT
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- Only for migration, will be removed after migration
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  mollie_customer_id TEXT,
  company_name TEXT,
  first_name TEXT,
  last_name TEXT,
  vat_number TEXT,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lynqit pages table
CREATE TABLE IF NOT EXISTS lynqit_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT,
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'start', 'pro')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired')),
  mollie_subscription_id TEXT,
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  template TEXT DEFAULT 'default' CHECK (template IN ('default', 'events', 'artist', 'webshop')),
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  brand_color TEXT DEFAULT '#2E47FF',
  background_color TEXT,
  header_type TEXT DEFAULT 'image' CHECK (header_type IN ('video', 'image')),
  header_url TEXT,
  promo_banner JSONB NOT NULL DEFAULT '{"enabled": false}'::jsonb,
  scheduled_message JSONB,
  events JSONB,
  products JSONB,
  shows JSONB,
  logo TEXT,
  spotify_url TEXT,
  intro TEXT,
  telefoonnummer TEXT,
  emailadres TEXT,
  cta_button JSONB NOT NULL DEFAULT '{"text": "", "link": ""}'::jsonb,
  social_media JSONB NOT NULL DEFAULT '{}'::jsonb,
  featured_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  custom_links JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Page views table for analytics
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES lynqit_pages(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  referrer TEXT,
  user_agent TEXT,
  ip TEXT
);

-- Clicks table for click tracking
CREATE TABLE IF NOT EXISTS clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES lynqit_pages(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  click_type TEXT NOT NULL,
  target_url TEXT,
  user_agent TEXT,
  ip TEXT
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lynqit_pages_updated_at BEFORE UPDATE ON lynqit_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INDEXES
-- ============================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Lynqit pages table indexes
CREATE INDEX IF NOT EXISTS idx_lynqit_pages_user_id ON lynqit_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_lynqit_pages_slug ON lynqit_pages(slug);
CREATE INDEX IF NOT EXISTS idx_lynqit_pages_subscription_status ON lynqit_pages(subscription_status);

-- Page views table indexes
CREATE INDEX IF NOT EXISTS idx_page_views_page_id ON page_views(page_id);
CREATE INDEX IF NOT EXISTS idx_page_views_timestamp ON page_views(timestamp);
CREATE INDEX IF NOT EXISTS idx_page_views_page_id_timestamp ON page_views(page_id, timestamp);

-- Clicks table indexes
CREATE INDEX IF NOT EXISTS idx_clicks_page_id ON clicks(page_id);
CREATE INDEX IF NOT EXISTS idx_clicks_timestamp ON clicks(timestamp);
CREATE INDEX IF NOT EXISTS idx_clicks_page_id_timestamp ON clicks(page_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_clicks_click_type ON clicks(click_type);

-- Settings table indexes
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lynqit_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE email = user_email 
    AND role = 'admin'
    AND email = 'rubenfonteijne@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user email from JWT
CREATE OR REPLACE FUNCTION get_user_email()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT auth.jwt() ->> 'email');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users policies
-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  USING (email = get_user_email() OR is_admin(get_user_email()));

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING (email = get_user_email() OR is_admin(get_user_email()));

-- Admins can read all users
CREATE POLICY "Admins can read all users" ON users
  FOR SELECT
  USING (is_admin(get_user_email()));

-- Lynqit pages policies
-- Public pages are readable by everyone (for public viewing)
CREATE POLICY "Public pages are readable" ON lynqit_pages
  FOR SELECT
  USING (true);

-- Users can read their own pages
CREATE POLICY "Users can read own pages" ON lynqit_pages
  FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE email = get_user_email()) OR is_admin(get_user_email()));

-- Users can insert their own pages
CREATE POLICY "Users can insert own pages" ON lynqit_pages
  FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM users WHERE email = get_user_email()));

-- Users can update their own pages
CREATE POLICY "Users can update own pages" ON lynqit_pages
  FOR UPDATE
  USING (user_id IN (SELECT id FROM users WHERE email = get_user_email()) OR is_admin(get_user_email()));

-- Users can delete their own pages
CREATE POLICY "Users can delete own pages" ON lynqit_pages
  FOR DELETE
  USING (user_id IN (SELECT id FROM users WHERE email = get_user_email()) OR is_admin(get_user_email()));

-- Page views policies
-- Anyone can insert page views (for tracking)
CREATE POLICY "Anyone can insert page views" ON page_views
  FOR INSERT
  WITH CHECK (true);

-- Users can read page views for their own pages
CREATE POLICY "Users can read own page views" ON page_views
  FOR SELECT
  USING (
    page_id IN (
      SELECT id FROM lynqit_pages 
      WHERE user_id IN (SELECT id FROM users WHERE email = get_user_email())
    ) OR is_admin(get_user_email())
  );

-- Clicks policies
-- Anyone can insert clicks (for tracking)
CREATE POLICY "Anyone can insert clicks" ON clicks
  FOR INSERT
  WITH CHECK (true);

-- Users can read clicks for their own pages
CREATE POLICY "Users can read own clicks" ON clicks
  FOR SELECT
  USING (
    page_id IN (
      SELECT id FROM lynqit_pages 
      WHERE user_id IN (SELECT id FROM users WHERE email = get_user_email())
    ) OR is_admin(get_user_email())
  );

-- Settings policies
-- Only admins can read settings
CREATE POLICY "Admins can read settings" ON settings
  FOR SELECT
  USING (is_admin(get_user_email()));

-- Only admins can update settings
CREATE POLICY "Admins can update settings" ON settings
  FOR UPDATE
  USING (is_admin(get_user_email()));

-- Only admins can insert settings
CREATE POLICY "Admins can insert settings" ON settings
  FOR INSERT
  WITH CHECK (is_admin(get_user_email()));

