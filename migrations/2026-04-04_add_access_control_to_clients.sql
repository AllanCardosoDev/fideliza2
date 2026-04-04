-- Migration: 2026-04-04 - Add access control fields to clients table
-- Purpose: Add created_by and owner_id fields to support employee-level data filtering

-- Add created_by field (tracks which employee created the client)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES employees(id) ON DELETE SET NULL;

-- Add owner_id field (same as created_by, alternative field name for compatibility)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS owner_id BIGINT REFERENCES employees(id) ON DELETE SET NULL;

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_clients_owner_id ON clients(owner_id);

-- Comment for clarity
COMMENT ON COLUMN clients.created_by IS 'Employee ID who created this client record';
COMMENT ON COLUMN clients.owner_id IS 'Employee ID who owns/created this client (alternative field name)';
