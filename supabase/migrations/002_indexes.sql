-- Indexes for performance optimization

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

