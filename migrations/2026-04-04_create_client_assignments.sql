-- Migration: 2026-04-04 - Create client_assignments table for N:N employee-client relationships
-- Purpose: Allow multiple employees to access a single client with different roles (owner, supervisor, viewer)

-- Create client_assignments table (junction table for N:N relationship)
CREATE TABLE IF NOT EXISTS client_assignments (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer', -- owner, supervisor, viewer
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  notes TEXT,
  
  -- Ensure unique combination of client and employee (can't assign same employee twice to same client with same role)
  UNIQUE(client_id, employee_id, role)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_client_assignments_client_id ON client_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_employee_id ON client_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_role ON client_assignments(role);
CREATE INDEX IF NOT EXISTS idx_client_assignments_search ON client_assignments(client_id, employee_id);

-- Add created_by to clients table (for audit trail)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES employees(id) ON DELETE SET NULL;

-- Create index on clients.created_by
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);

-- Comments for clarity
COMMENT ON TABLE client_assignments IS 'Junction table: N:N relationship between clients and employees with role-based access';
COMMENT ON COLUMN client_assignments.role IS 'Access level: owner (full control), supervisor (approve/edit), viewer (read-only)';
COMMENT ON COLUMN client_assignments.assigned_by IS 'Employee ID who made this assignment (for audit)';
COMMENT ON COLUMN clients.created_by IS 'Employee ID who originally created the client (for audit)';

-- Example query to get all clients for an employee:
-- SELECT c.* FROM clients c
-- INNER JOIN client_assignments ca ON c.id = ca.client_id
-- WHERE ca.employee_id = ? AND ca.role != 'viewer';
