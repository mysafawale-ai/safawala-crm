-- Add missing fields to product_orders and package_bookings tables
-- These fields were present in the legacy bookings table but missing in the split
-- 
-- ⚠️ NOTE: This file is now REDUNDANT if you run MIGRATION_SPLIT_PRODUCT_AND_PACKAGE_BOOKINGS.sql
-- The main migration has been updated to include these fields from the start.
--
-- Only use this file if you already ran the old migration and need to ADD columns to existing tables.

begin;

-- Add fields to product_orders (only if table already exists without these columns)
alter table product_orders 
  add column if not exists event_participant text,
  add column if not exists groom_whatsapp text,
  add column if not exists groom_address text,
  add column if not exists bride_whatsapp text,
  add column if not exists bride_address text;

-- Add fields to package_bookings (only if table already exists without these columns)
alter table package_bookings
  add column if not exists event_participant text,
  add column if not exists groom_whatsapp text,
  add column if not exists groom_address text,
  add column if not exists bride_whatsapp text,
  add column if not exists bride_address text;

commit;
