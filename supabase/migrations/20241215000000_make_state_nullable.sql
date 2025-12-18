-- Migration to make state field nullable in addresses table
-- This aligns the database schema with the UI which doesn't collect state information

ALTER TABLE public.addresses 
ALTER COLUMN state DROP NOT NULL;

-- Optionally update existing rows with NULL state to have a default value if needed
-- UPDATE public.addresses SET state = NULL WHERE state = 'N/A';
