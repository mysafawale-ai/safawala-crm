-- =====================================================
-- PRODUCT IMAGES STORAGE BUCKET SETUP
-- =====================================================
-- This script creates a storage bucket for product images
-- and sets up RLS policies for secure access

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true, -- Public access for viewing images
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Policy 1: Anyone can view product images (public bucket)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Policy 2: Authenticated users can upload product images
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- Policy 3: Authenticated users can update their own product images
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- Policy 4: Authenticated users can delete product images
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify bucket creation
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'product-images';

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage';
