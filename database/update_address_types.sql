-- Migration to update address_type constraint
-- Run this in your Supabase SQL Editor

ALTER TABLE addresses DROP CONSTRAINT IF EXISTS addresses_address_type_check;

ALTER TABLE addresses 
  ADD CONSTRAINT addresses_address_type_check 
  CHECK (address_type IN ('home', 'office', 'shop', 'beauty_parlor'));
