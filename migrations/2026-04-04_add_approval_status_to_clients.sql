-- Migration: Add approval_status and rejection_reason columns to clients table
-- Date: 2026-04-04

-- Add approval_status column to clients
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(25) DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL;

-- Add comment for approval_status
COMMENT ON COLUMN clients.approval_status IS 'Status of client approval: approved (default for admin-created), pending (for employee-created), or rejected';

-- Create index on approval_status for faster queries
CREATE INDEX IF NOT EXISTS idx_clients_approval_status ON clients(approval_status);

-- Update existing clients to have approval_status='approved' if not set
UPDATE clients SET approval_status = 'approved' WHERE approval_status IS NULL;

-- Verify results
SELECT COUNT(*) as total_clients, 
       COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved_count,
       COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending_count,
       COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected_count
FROM clients;
