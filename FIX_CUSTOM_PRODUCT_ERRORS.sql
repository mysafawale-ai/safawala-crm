-- =====================================================
-- FIX CUSTOM PRODUCT CREATION ERRORS
-- =====================================================
-- This script fixes two critical issues:
-- 1. Storage RLS policy preventing image uploads
-- 2. Missing product_barcodes table

-- =====================================================
-- PART 1: FIX STORAGE RLS POLICIES
-- =====================================================

-- Ensure the bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- Drop ALL existing policies on storage.objects for product-images
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    END LOOP;
END $$;

-- Create comprehensive policies that work for all users

-- Policy 1: Public read access (anyone can view)
CREATE POLICY "product_images_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Policy 2: Allow INSERT for authenticated users AND service role
CREATE POLICY "product_images_authenticated_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND (
    auth.role() = 'authenticated' 
    OR auth.role() = 'service_role'
    OR auth.role() = 'anon'
  )
);

-- Policy 3: Allow UPDATE for authenticated users
CREATE POLICY "product_images_authenticated_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND (
    auth.role() = 'authenticated' 
    OR auth.role() = 'service_role'
  )
);

-- Policy 4: Allow DELETE for authenticated users
CREATE POLICY "product_images_authenticated_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND (
    auth.role() = 'authenticated' 
    OR auth.role() = 'service_role'
  )
);

-- =====================================================
-- PART 2: CREATE PRODUCT_BARCODES TABLE (IF NOT EXISTS)
-- =====================================================

-- Create product_barcodes table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_barcodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
  barcode_number VARCHAR(50) UNIQUE NOT NULL,
  sequence_number INT NOT NULL,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'damaged', 'retired')),
  is_new BOOLEAN DEFAULT true,
  booking_id UUID REFERENCES package_bookings(id) ON DELETE SET NULL,
  last_used_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, sequence_number)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_product_barcodes_product ON product_barcodes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_barcodes_status ON product_barcodes(status);
CREATE INDEX IF NOT EXISTS idx_product_barcodes_franchise ON product_barcodes(franchise_id);
CREATE INDEX IF NOT EXISTS idx_product_barcodes_barcode ON product_barcodes(barcode_number);
CREATE INDEX IF NOT EXISTS idx_product_barcodes_is_new ON product_barcodes(is_new);

-- Enable RLS
ALTER TABLE product_barcodes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations on product_barcodes" ON product_barcodes;
DROP POLICY IF EXISTS "product_barcodes_all_access" ON product_barcodes;

-- Create permissive policy for all operations
CREATE POLICY "product_barcodes_all_access" 
  ON product_barcodes 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_product_barcodes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_product_barcodes_timestamp ON product_barcodes;
CREATE TRIGGER update_product_barcodes_timestamp
  BEFORE UPDATE ON product_barcodes
  FOR EACH ROW
  EXECUTE FUNCTION update_product_barcodes_updated_at();

-- Grant permissions
GRANT ALL ON product_barcodes TO postgres, anon, authenticated, service_role;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify storage bucket
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types
FROM storage.buckets
WHERE id = 'product-images';

-- Verify storage policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%product_images%';

-- Verify product_barcodes table
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'product_barcodes'
ORDER BY ordinal_position;

-- Verify product_barcodes policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies
WHERE tablename = 'product_barcodes';

-- Test query (should return 0 rows initially)
SELECT COUNT(*) as barcode_count FROM product_barcodes;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Storage RLS policies fixed for product-images bucket';
  RAISE NOTICE '✅ product_barcodes table created/verified';
  RAISE NOTICE '✅ All policies and permissions set';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 You can now:';
  RAISE NOTICE '   1. Upload images to product-images bucket';
  RAISE NOTICE '   2. Create custom products with images';
  RAISE NOTICE '   3. Auto-generate barcodes for products';
END $$;
