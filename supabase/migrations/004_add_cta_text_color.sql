-- Add cta_text_color column to lynqit_pages table
ALTER TABLE lynqit_pages 
ADD COLUMN IF NOT EXISTS cta_text_color TEXT;

-- Set default value for existing rows (white text)
UPDATE lynqit_pages 
SET cta_text_color = '#FFFFFF' 
WHERE cta_text_color IS NULL;

