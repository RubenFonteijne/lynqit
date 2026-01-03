-- Add is_demo column to lynqit_pages table
ALTER TABLE lynqit_pages 
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

-- Set default value for existing rows
UPDATE lynqit_pages 
SET is_demo = FALSE 
WHERE is_demo IS NULL;

