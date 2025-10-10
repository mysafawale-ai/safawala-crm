/**
 * Fix Settings Database Schema Issues
 * Creates missing tables and fixes schema problems
 */

// Simple database schema fix script
console.log('Database Schema Fix Instructions:');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDatabaseSchema() {
  console.log('🔧 Fixing Settings Database Schema Issues...\n');

  // 1. Create banking_details table
  console.log('1. Creating banking_details table...');
  const bankingTableSQL = `
    CREATE TABLE IF NOT EXISTS banking_details (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
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

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_banking_details_franchise_id ON banking_details(franchise_id);
    CREATE INDEX IF NOT EXISTS idx_banking_details_primary ON banking_details(is_primary);
    CREATE INDEX IF NOT EXISTS idx_banking_details_active ON banking_details(is_active);

    -- Enable RLS
    ALTER TABLE banking_details ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY IF NOT EXISTS "Users can view their banking details" ON banking_details FOR SELECT USING (true);
    CREATE POLICY IF NOT EXISTS "Users can manage their banking details" ON banking_details FOR ALL USING (true);
  `;

  try {
    const { error: bankingError } = await supabase.rpc('exec_sql', { sql: bankingTableSQL });
    if (bankingError) {
      console.log('   Note: Table may already exist or require manual creation');
      console.log('   Error:', bankingError.message);
    } else {
      console.log('   ✅ Banking details table created/verified');
    }
  } catch (error) {
    console.log('   ⚠️  Banking table creation may need manual setup');
  }

  // 2. Create company_settings table
  console.log('2. Creating company_settings table...');
  const companyTableSQL = `
    CREATE TABLE IF NOT EXISTS company_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
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

    -- Enable RLS
    ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY IF NOT EXISTS "Users can view company settings" ON company_settings FOR SELECT USING (true);
    CREATE POLICY IF NOT EXISTS "Users can manage company settings" ON company_settings FOR ALL USING (true);
  `;

  try {
    const { error: companyError } = await supabase.rpc('exec_sql', { sql: companyTableSQL });
    if (companyError) {
      console.log('   Note: Table may already exist');
    } else {
      console.log('   ✅ Company settings table created/verified');
    }
  } catch (error) {
    console.log('   ⚠️  Company settings table may need manual setup');
  }

  // 3. Create branding_settings table
  console.log('3. Creating branding_settings table...');
  const brandingTableSQL = `
    CREATE TABLE IF NOT EXISTS branding_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
      primary_color VARCHAR(10) DEFAULT '#3B82F6',
      secondary_color VARCHAR(10) DEFAULT '#EF4444',
      accent_color VARCHAR(10) DEFAULT '#10B981',
      background_color VARCHAR(10) DEFAULT '#FFFFFF',
      font_family VARCHAR(100) DEFAULT 'Inter',
      logo_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Enable RLS
    ALTER TABLE branding_settings ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY IF NOT EXISTS "Users can view branding settings" ON branding_settings FOR SELECT USING (true);
    CREATE POLICY IF NOT EXISTS "Users can manage branding settings" ON branding_settings FOR ALL USING (true);
  `;

  try {
    const { error: brandingError } = await supabase.rpc('exec_sql', { sql: brandingTableSQL });
    if (brandingError) {
      console.log('   Note: Table may already exist');
    } else {
      console.log('   ✅ Branding settings table created/verified');
    }
  } catch (error) {
    console.log('   ⚠️  Branding settings table may need manual setup');
  }

  // 4. Create document_settings table
  console.log('4. Creating document_settings table...');
  const documentTableSQL = `
    CREATE TABLE IF NOT EXISTS document_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
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

    -- Enable RLS
    ALTER TABLE document_settings ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY IF NOT EXISTS "Users can view document settings" ON document_settings FOR SELECT USING (true);
    CREATE POLICY IF NOT EXISTS "Users can manage document settings" ON document_settings FOR ALL USING (true);
  `;

  try {
    const { error: documentError } = await supabase.rpc('exec_sql', { sql: documentTableSQL });
    if (documentError) {
      console.log('   Note: Table may already exist');
    } else {
      console.log('   ✅ Document settings table created/verified');
    }
  } catch (error) {
    console.log('   ⚠️  Document settings table may need manual setup');
  }

  // 5. Test table access
  console.log('\n5. Testing table access...');
  
  const tables = ['banking_details', 'company_settings', 'branding_settings', 'document_settings'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('id').limit(1);
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: Accessible`);
      }
    } catch (error) {
      console.log(`   ❌ ${table}: Connection error`);
    }
  }

  console.log('\n✅ Database schema fix attempt completed!');
  console.log('\n📝 If tables still don\'t exist, please run these commands in Supabase SQL Editor:');
  console.log('   1. Go to your Supabase project dashboard');
  console.log('   2. Navigate to SQL Editor');
  console.log('   3. Run the table creation scripts manually');
}

// Run the fix
fixDatabaseSchema().catch(console.error);