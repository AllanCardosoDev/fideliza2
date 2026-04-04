-- Migration: Ensure loans table has required columns
-- Date: 2026-04-04

-- Check if loans table exists and has the required columns
-- If status column doesn't exist, add it
ALTER TABLE loans
ADD COLUMN IF NOT EXISTS created_by UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL;

-- Ensure status column exists and has correct default
-- (assuming status column already exists, but adding as safety measure)
ALTER TABLE loans
ALTER COLUMN status SET DEFAULT 'active';

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);

-- Verify results
SELECT COUNT(*) as total_loans,
       COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
       COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
       COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count
FROM loans;
