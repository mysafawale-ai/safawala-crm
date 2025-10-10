-- Settings Module Database Tables Creation Script (FIXED VERSION)
-- Run this manually in your Supabase SQL Editor to fix the missing tables

-- 1. Company Settings Table
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  gst_number VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  website VARCHAR(255),
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Branding Settings Table
CREATE TABLE IF NOT EXISTS branding_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID DEFAULT '00000000-0000-0000-0000-000000000001',
  primary_color VARCHAR(10) DEFAULT '#3B82F6',
  secondary_color VARCHAR(10) DEFAULT '#EF4444',
  accent_color VARCHAR(10) DEFAULT '#10B981',
  background_color VARCHAR(10) DEFAULT '#FFFFFF',
  font_family VARCHAR(100) DEFAULT 'Inter',
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Document Settings Table
CREATE TABLE IF NOT EXISTS document_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID DEFAULT '00000000-0000-0000-0000-000000000001',
  invoice_number_format VARCHAR(50) DEFAULT 'INV-{YYYY}-{0001}',
  quote_number_format VARCHAR(50) DEFAULT 'QTE-{YYYY}-{0001}',
  invoice_template_id VARCHAR(50),
  quote_template_id VARCHAR(50),
  default_payment_terms VARCHAR(100) DEFAULT 'Net 30',
  default_tax_rate DECIMAL(5,2) DEFAULT 18.00,
  show_gst_breakdown BOOLEAN DEFAULT TRUE,
  default_terms_conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Banking Details Table (the one causing errors)
CREATE TABLE IF NOT EXISTS banking_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID DEFAULT '00000000-0000-0000-0000-000000000001',
  bank_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL DEFAULT 'Current',
  account_holder_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  ifsc_code VARCHAR(20) NOT NULL,
  branch_name VARCHAR(255),
  upi_id VARCHAR(100),
  qr_code_url TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  show_on_invoice BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Invoice Templates Table
CREATE TABLE IF NOT EXISTS invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'invoice', -- 'invoice' or 'quote'
  template_data JSONB,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some default templates (only if they don't exist)
INSERT INTO invoice_templates (name, type, template_data, is_active) 
SELECT * FROM (VALUES
  ('Classic Invoice Template', 'invoice', '{"layout": "classic", "style": "professional"}', true),
  ('Modern Invoice Template', 'invoice', '{"layout": "modern", "style": "clean"}', true),
  ('Minimal Invoice Template', 'invoice', '{"layout": "minimal", "style": "simple"}', true),
  ('Corporate Invoice Template', 'invoice', '{"layout": "corporate", "style": "formal"}', true),
  ('Creative Invoice Template', 'invoice', '{"layout": "creative", "style": "colorful"}', true),
  ('Standard Invoice Template', 'invoice', '{"layout": "standard", "style": "basic"}', true),
  ('Classic Quote Template', 'quote', '{"layout": "classic", "style": "professional"}', true),
  ('Modern Quote Template', 'quote', '{"layout": "modern", "style": "clean"}', true),
  ('Minimal Quote Template', 'quote', '{"layout": "minimal", "style": "simple"}', true),
  ('Corporate Quote Template', 'quote', '{"layout": "corporate", "style": "formal"}', true),
  ('Creative Quote Template', 'quote', '{"layout": "creative", "style": "colorful"}', true),
  ('Standard Quote Template', 'quote', '{"layout": "standard", "style": "basic"}', true)
) AS v(name, type, template_data, is_active)
WHERE NOT EXISTS (SELECT 1 FROM invoice_templates WHERE name = v.name AND type = v.type);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_settings_email ON company_settings(email);
CREATE INDEX IF NOT EXISTS idx_branding_settings_franchise_id ON branding_settings(franchise_id);
CREATE INDEX IF NOT EXISTS idx_document_settings_franchise_id ON document_settings(franchise_id);
CREATE INDEX IF NOT EXISTS idx_banking_details_franchise_id ON banking_details(franchise_id);
CREATE INDEX IF NOT EXISTS idx_banking_details_primary ON banking_details(is_primary);
CREATE INDEX IF NOT EXISTS idx_banking_details_active ON banking_details(is_active);
CREATE INDEX IF NOT EXISTS idx_invoice_templates_type ON invoice_templates(type);
CREATE INDEX IF NOT EXISTS idx_invoice_templates_active ON invoice_templates(is_active);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE banking_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;

-- 8. Drop existing policies if they exist, then create new ones
DO $$ 
BEGIN
  -- Drop policies if they exist
  DROP POLICY IF EXISTS "Enable all operations for company_settings" ON company_settings;
  DROP POLICY IF EXISTS "Enable all operations for branding_settings" ON branding_settings;
  DROP POLICY IF EXISTS "Enable all operations for document_settings" ON document_settings;
  DROP POLICY IF EXISTS "Enable all operations for banking_details" ON banking_details;
  DROP POLICY IF EXISTS "Enable all operations for invoice_templates" ON invoice_templates;
  
  -- Create new policies
  EXECUTE 'CREATE POLICY "Enable all operations for company_settings" ON company_settings FOR ALL USING (true)';
  EXECUTE 'CREATE POLICY "Enable all operations for branding_settings" ON branding_settings FOR ALL USING (true)';
  EXECUTE 'CREATE POLICY "Enable all operations for document_settings" ON document_settings FOR ALL USING (true)';
  EXECUTE 'CREATE POLICY "Enable all operations for banking_details" ON banking_details FOR ALL USING (true)';
  EXECUTE 'CREATE POLICY "Enable all operations for invoice_templates" ON invoice_templates FOR ALL USING (true)';
END $$;

-- 9. Create update function and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers and create new ones
DROP TRIGGER IF EXISTS update_company_settings_updated_at ON company_settings;
CREATE TRIGGER update_company_settings_updated_at 
  BEFORE UPDATE ON company_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_branding_settings_updated_at ON branding_settings;
CREATE TRIGGER update_branding_settings_updated_at 
  BEFORE UPDATE ON branding_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_document_settings_updated_at ON document_settings;
CREATE TRIGGER update_document_settings_updated_at 
  BEFORE UPDATE ON document_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_banking_details_updated_at ON banking_details;
CREATE TRIGGER update_banking_details_updated_at 
  BEFORE UPDATE ON banking_details 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoice_templates_updated_at ON invoice_templates;
CREATE TRIGGER update_invoice_templates_updated_at 
  BEFORE UPDATE ON invoice_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Settings module database tables created successfully!' as message;