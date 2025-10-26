-- Fix storage RLS policies for product images
-- This ensures authenticated users can upload to product-images bucket

BEGIN;

-- Drop existing policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;

-- Create new policies with proper authentication checks

-- 1. Public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 2. Authenticated users can insert (no franchise check for product images)
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND (
    auth.uid() IS NOT NULL
    OR auth.role() = 'authenticated'
  )
);

-- 3. Authenticated users can update
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND auth.uid() IS NOT NULL
)
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.uid() IS NOT NULL
);

-- 4. Authenticated users can delete
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND auth.uid() IS NOT NULL
);

COMMIT;

-- Verify policies
SELECT 
  policyname, 
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || pg_get_expr(qual, 'storage.objects'::regclass)
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || pg_get_expr(with_check, 'storage.objects'::regclass)
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%product%'
ORDER BY policyname;
