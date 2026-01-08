-- Add 'mobile_app' to the template check constraint
-- First, drop the existing constraint
ALTER TABLE lynqit_pages 
DROP CONSTRAINT IF EXISTS lynqit_pages_template_check;

-- Add the new constraint with 'mobile_app' included
ALTER TABLE lynqit_pages 
ADD CONSTRAINT lynqit_pages_template_check 
CHECK (template IN ('default', 'events', 'artist', 'webshop', 'mobile_app'));
