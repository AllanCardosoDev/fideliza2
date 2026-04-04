-- Migration: Add protocol column to loans table
-- Date: 2026-04-04
-- Purpose: Add unique protocol field for loan contracts

-- Add protocol column if it doesn't exist
ALTER TABLE loans ADD COLUMN IF NOT EXISTS protocol TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_loans_protocol ON loans(protocol);

-- Add comment explaining the protocol format
COMMENT ON COLUMN loans.protocol IS 'Contract protocol in format MMDD/NNNN/YYYY (e.g., 0403/0001/2026)';
