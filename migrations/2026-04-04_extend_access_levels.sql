-- Migration: Extend access_level values for employees
-- Date: 2026-04-04
-- Purpose: Add supervisor role to the employees table

-- Update the constraint if needed (Supabase may not need this but documented for clarity)
-- The access_level column will accept: 'employee', 'supervisor', 'admin'

-- Example of how the data should look:
-- UPDATE employees SET access_level = 'supervisor' WHERE id = 1;
-- INSERT INTO employees (name, access_level) VALUES ('João Silva', 'supervisor');

-- No schema changes needed as TEXT columns accept any string value
-- This migration is for documentation purposes
