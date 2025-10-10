-- Essential database setup for Safawala CRM

-- Create franchises table
CREATE TABLE IF NOT EXISTS franchises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'staff' CHECK (role IN ('super_admin', 'franchise_admin', 'staff', 'readonly')),
  franchise_id UUID REFERENCES franchises(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  pincode VARCHAR(10),
  franchise_id UUID REFERENCES franchises(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  rental_price DECIMAL(10,2) DEFAULT 0,
  stock_total INTEGER DEFAULT 0,
  stock_available INTEGER DEFAULT 0,
  franchise_id UUID REFERENCES franchises(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) NOT NULL,
  franchise_id UUID REFERENCES franchises(id) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('rental', 'sale')) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'completed', 'cancelled')),
  event_date DATE,
  total_amount DECIMAL(10,2) DEFAULT 0,
  advance_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample franchise
INSERT INTO franchises (name, code, address, phone, email) 
VALUES ('Safawala Main Branch', 'MAIN001', 'Mumbai, Maharashtra', '+91 9876543210', 'admin@safawala.com')
ON CONFLICT (code) DO NOTHING;

-- Get franchise ID for user creation
DO $$
DECLARE
    franchise_uuid UUID;
BEGIN
    SELECT id INTO franchise_uuid FROM franchises WHERE code = 'MAIN001';
    
    -- Insert admin user with proper password hash
    INSERT INTO users (name, email, password_hash, role, franchise_id) 
    VALUES (
        'Admin User', 
        'admin@safawala.com', 
        '$2b$10$rOzJmXVgDZH0Yf8iYYhP2eP7KBQ8xWV3VG3WL9ZJ8KJ6V3V3V3V3V', 
        'super_admin', 
        franchise_uuid
    )
    ON CONFLICT (email) DO NOTHING;
    
    -- Insert sample customer
    INSERT INTO customers (customer_code, name, phone, email, address, franchise_id) 
    VALUES (
        'CUST001', 
        'John Doe', 
        '+91 9876543210', 
        'john@example.com', 
        'Mumbai, Maharashtra', 
        franchise_uuid
    )
    ON CONFLICT (customer_code) DO NOTHING;
    
    -- Insert sample product
    INSERT INTO products (product_code, name, category, price, rental_price, stock_total, stock_available, franchise_id) 
    VALUES (
        'PROD001', 
        'Royal Red Turban', 
        'turban', 
        5000, 
        500, 
        10, 
        10, 
        franchise_uuid
    )
    ON CONFLICT (product_code) DO NOTHING;
END $$;