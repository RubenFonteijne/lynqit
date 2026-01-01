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

