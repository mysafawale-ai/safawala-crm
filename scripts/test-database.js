const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xplnyaxkusvuajtmorss.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  console.log('🚀 Setting up Safawala CRM database...');
  
  try {
    // Check if tables already exist by trying to query them
    const tables = ['franchises', 'users', 'customers', 'products', 'bookings'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (!error) {
          console.log(`✅ Table ${table} already exists with ${data?.length || 0} records`);
        }
      } catch (err) {
        console.log(`❌ Table ${table} needs to be created`);
      }
    }
    
    // Test inserting sample data to existing tables
    console.log('🔍 Testing database operations...');
    
    // Test franchise insertion
    try {
      const { data: existingFranchise } = await supabase
        .from('franchises')
        .select('*')
        .eq('code', 'MAIN001')
        .single();
        
      if (!existingFranchise) {
        const { data, error } = await supabase
          .from('franchises')
          .insert({
            id: '95168a3d-a6a5-4f9b-bbe2-7b88c7cef050',
            name: 'Main Franchise',
            code: 'MAIN001',
            address: '123 Wedding Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            phone: '+91-9876543210',
            owner_name: 'Suresh Pithara',
            is_active: true
          })
          .select();
          
        if (error) {
          console.log('❌ Franchise insert error:', error.message);
        } else {
          console.log('✅ Default franchise created successfully');
        }
      } else {
        console.log('✅ Default franchise already exists');
      }
    } catch (err) {
      console.log('⚠️ Franchise table operation:', err.message);
    }
    
    // Test user insertion
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'admin@safawala.com')
        .single();
        
      if (!existingUser) {
        const { data, error } = await supabase
          .from('users')
          .insert({
            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            name: 'Super Admin',
            email: 'admin@safawala.com',
            password_hash: '$2b$10$rOdpNb2LFRh0fR9xQgJ8g.K1vJJxhHdJ8fJKnEjDdJ9jHdJKnEjDdJ',
            role: 'super_admin',
            franchise_id: '95168a3d-a6a5-4f9b-bbe2-7b88c7cef050',
            is_active: true
          })
          .select();
          
        if (error) {
          console.log('❌ User insert error:', error.message);
        } else {
          console.log('✅ Admin user created successfully');
        }
      } else {
        console.log('✅ Admin user already exists');
      }
    } catch (err) {
      console.log('⚠️ User table operation:', err.message);
    }
    
    // Insert sample products
    try {
      const { data: existingProducts } = await supabase
        .from('products')
        .select('*')
        .limit(1);
        
      if (!existingProducts || existingProducts.length === 0) {
        const sampleProducts = [
          {
            id: 'prod-turban-001',
            product_code: 'TUR001',
            name: 'Royal Red Turban',
            description: 'Premium silk turban in royal red color',
            price: 5000,
            rental_price: 500,
            cost_price: 2000,
            stock_total: 10,
            stock_available: 8,
            franchise_id: '95168a3d-a6a5-4f9b-bbe2-7b88c7cef050'
          },
          {
            id: 'prod-turban-002',
            product_code: 'TUR002',
            name: 'Golden Yellow Turban',
            description: 'Traditional yellow turban with golden work',
            price: 4500,
            rental_price: 450,
            cost_price: 1800,
            stock_total: 15,
            stock_available: 12,
            franchise_id: '95168a3d-a6a5-4f9b-bbe2-7b88c7cef050'
          }
        ];
        
        const { data, error } = await supabase
          .from('products')
          .insert(sampleProducts)
          .select();
          
        if (error) {
          console.log('❌ Product insert error:', error.message);
        } else {
          console.log(`✅ ${data?.length || 0} sample products created`);
        }
      } else {
        console.log('✅ Products already exist');
      }
    } catch (err) {
      console.log('⚠️ Product table operation:', err.message);
    }
    
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  }
}

setupDatabase();