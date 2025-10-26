-- Add reserved_products JSONB column to package_booking_items
-- This stores the products selected/reserved for each package item (UI selection)
-- Format: [{ "id": "uuid", "name": "Product Name", "qty": 2, "image_url": "..." }, ...]

-- Add column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'package_booking_items' 
    AND column_name = 'reserved_products'
  ) THEN
    ALTER TABLE public.package_booking_items 
    ADD COLUMN reserved_products JSONB DEFAULT '[]'::jsonb;
    
    RAISE NOTICE 'Added reserved_products column to package_booking_items';
  ELSE
    RAISE NOTICE 'reserved_products column already exists in package_booking_items';
  END IF;
END $$;

-- Create index for better query performance on JSONB column
CREATE INDEX IF NOT EXISTS idx_package_booking_items_reserved_products 
ON public.package_booking_items USING GIN (reserved_products);

COMMENT ON COLUMN public.package_booking_items.reserved_products IS 
'Reserved products for this package item in JSON format: [{"id":"uuid","name":"string","qty":number,"image_url":"string"}]';
