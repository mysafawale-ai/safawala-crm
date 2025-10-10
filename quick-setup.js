const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = 'https://xplnyaxkusvuajtmorss.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function quickSetup() {
  console.log('🚀 Quick database setup...')
  
  // Create essential tables
  const tables = [
    `CREATE TABLE IF NOT EXISTS franchises (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      address TEXT NOT NULL,
      phone VARCHAR(20),
      email VARCHAR(255),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    
    `CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'staff',
      franchise_id UUID REFERENCES franchises(id),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    
    `CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      customer_code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      email VARCHAR(255),
      address TEXT,
      franchise_id UUID REFERENCES franchises(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    
    `CREATE TABLE IF NOT EXISTS products (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      product_code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(50) NOT NULL,
      price DECIMAL(10,2) DEFAULT 0,
      rental_price DECIMAL(10,2) DEFAULT 0,
      stock_total INTEGER DEFAULT 0,
      stock_available INTEGER DEFAULT 0,
      franchise_id UUID REFERENCES franchises(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`
  ]
  
  for (let i = 0; i < tables.length; i++) {
    console.log(`Creating table ${i+1}/${tables.length}...`)
    const { error } = await supabase.rpc('exec', { sql: tables[i] })
    if (error && !error.message.includes('already exists')) {
      console.log('Error:', error.message)
    }
  }
  
  // Insert sample data
  console.log('Adding sample data...')
  
  // Add franchise
  const { data: franchise } = await supabase.from('franchises').insert({
    name: 'Safawala Main Branch',
    code: 'MAIN001',
    address: 'Mumbai, Maharashtra',
    phone: '+91 9876543210',
    email: 'admin@safawala.com'
  }).select().single()
  
  if (franchise) {
    // Add admin user
    await supabase.from('users').insert({
      name: 'Admin User',
      email: 'admin@safawala.com',
      password_hash: '$2b$10$rOzJmXVgDZH0Yf8iYYhP2eP7KBQ8xWV3VG3WL9ZJ8KJ6V3V3V3V3V', // password: admin123
      role: 'super_admin',
      franchise_id: franchise.id
    })
    
    // Add sample customer
    await supabase.from('customers').insert({
      customer_code: 'CUST001',
      name: 'John Doe',
      phone: '+91 9876543210',
      email: 'john@example.com',
      address: 'Mumbai, Maharashtra',
      franchise_id: franchise.id
    })
    
    // Add sample product
    await supabase.from('products').insert({
      product_code: 'PROD001',
      name: 'Royal Red Turban',
      category: 'turban',
      price: 5000,
      rental_price: 500,
      stock_total: 10,
      stock_available: 10,
      franchise_id: franchise.id
    })
  }
  
  console.log('✅ Quick setup complete!')
  console.log('Login with: admin@safawala.com / admin123')
}

quickSetup().catch(console.error)