-- Add Stripe fields to support Stripe payment provider
-- This allows parallel operation with Mollie during migration

-- Add stripe_customer_id to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add stripe_subscription_id to lynqit_pages table
ALTER TABLE lynqit_pages 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create index on stripe_subscription_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_lynqit_pages_stripe_subscription_id 
ON lynqit_pages(stripe_subscription_id);

-- Create index on stripe_customer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id 
ON users(stripe_customer_id);

-- Add comment to document the fields
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for Stripe payment provider';
COMMENT ON COLUMN lynqit_pages.stripe_subscription_id IS 'Stripe subscription ID for Stripe payment provider';

