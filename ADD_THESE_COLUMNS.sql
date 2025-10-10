-- SQL commands to add missing columns to company_settings table
-- Copy and paste these commands into the Supabase SQL Editor

-- Add city column
ALTER TABLE public.company_settings ADD COLUMN city VARCHAR(100);

-- Add state column  
ALTER TABLE public.company_settings ADD COLUMN state VARCHAR(100);

-- Add logo_url column
ALTER TABLE public.company_settings ADD COLUMN logo_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.company_settings.city IS 'Company city location';
COMMENT ON COLUMN public.company_settings.state IS 'Company state/province location'; 
COMMENT ON COLUMN public.company_settings.logo_url IS 'URL to company logo image';

-- Verify the columns were added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'company_settings' 
AND table_schema = 'public'
ORDER BY column_name;