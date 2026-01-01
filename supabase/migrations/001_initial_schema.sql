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

