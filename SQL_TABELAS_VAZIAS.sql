-- ======================================================================
-- CRIAÇÃO DO SCHEMA - Tabelas Vazias (Para Novo Supabase)
-- ======================================================================
-- Execute este SQL no novo Supabase → SQL Editor
-- Copia todo o conteúdo e clica em "Run"

-- ======================================================================
-- CRIAR AS TABELAS
-- ======================================================================

CREATE TABLE IF NOT EXISTS employees (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  role TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  salary NUMERIC(12,2) DEFAULT NULL,
  department TEXT DEFAULT '',
  admission DATE DEFAULT NULL,
  username TEXT DEFAULT '',
  password TEXT DEFAULT '',
  access_level TEXT DEFAULT 'employee',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT access_level_check CHECK (access_level IN ('admin', 'supervisor', 'employee', 'guest'))
);

CREATE TABLE IF NOT EXISTS clients (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  cpf_cnpj TEXT UNIQUE,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  owner_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  approval_status TEXT DEFAULT 'approved'
);

CREATE TABLE IF NOT EXISTS loans (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  client TEXT DEFAULT '',
  client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL,
  value NUMERIC(12,2) NOT NULL DEFAULT 0,
  installments INT NOT NULL DEFAULT 1,
  paid INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  interest_rate NUMERIC(5,2) DEFAULT 5.00,
  interest_type TEXT DEFAULT 'compound',
  start_date DATE DEFAULT CURRENT_DATE,
  notes TEXT DEFAULT '',
  protocol TEXT UNIQUE,
  approved_at TIMESTAMP NULL,
  approved_by UUID NULL,
  rejected_at TIMESTAMP NULL,
  rejected_by UUID NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS installments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  loan_id BIGINT REFERENCES loans(id) ON DELETE CASCADE,
  number INT NOT NULL DEFAULT 1,
  due_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  loan_id BIGINT REFERENCES loans(id) ON DELETE CASCADE,
  installment_id BIGINT REFERENCES installments(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  penalty NUMERIC(12,2) DEFAULT 0,
  mora NUMERIC(12,2) DEFAULT 0,
  payment_date DATE DEFAULT CURRENT_DATE,
  notes TEXT DEFAULT '',
  reversed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  type TEXT DEFAULT 'income',
  amount NUMERIC(12,2) DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  description TEXT DEFAULT '',
  client TEXT DEFAULT '',
  value NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  model TEXT DEFAULT '',
  plate TEXT DEFAULT '',
  year INT,
  color TEXT DEFAULT '',
  status TEXT DEFAULT 'available',
  price NUMERIC(12,2) DEFAULT NULL,
  km INT DEFAULT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT DEFAULT '',
  message TEXT DEFAULT '',
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_assignments (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer',
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  notes TEXT,
  UNIQUE(client_id, employee_id, role)
);

-- ======================================================================
-- CRIAR ÍNDICES (Melhora Performance)
-- ======================================================================

CREATE INDEX IF NOT EXISTS idx_clients_cpf_cnpj ON clients(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_clients_owner_id ON clients(owner_id);
CREATE INDEX IF NOT EXISTS idx_clients_approval_status ON clients(approval_status);

CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_access_level ON employees(access_level);

CREATE INDEX IF NOT EXISTS idx_loans_client_id ON loans(client_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_protocol ON loans(protocol);
CREATE INDEX IF NOT EXISTS idx_loans_approved_at ON loans(approved_at);
CREATE INDEX IF NOT EXISTS idx_loans_rejected_at ON loans(rejected_at);
CREATE INDEX IF NOT EXISTS idx_loans_approved_by ON loans(approved_by);
CREATE INDEX IF NOT EXISTS idx_loans_created_at ON loans(created_at);

CREATE INDEX IF NOT EXISTS idx_installments_loan_id ON installments(loan_id);
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);

CREATE INDEX IF NOT EXISTS idx_payments_loan_id ON payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_payments_installment_id ON payments(installment_id);

CREATE INDEX IF NOT EXISTS idx_client_assignments_client_id ON client_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_employee_id ON client_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_role ON client_assignments(role);
CREATE INDEX IF NOT EXISTS idx_client_assignments_search ON client_assignments(client_id, employee_id);

-- ======================================================================
-- DESABILITAR SECURITY (Se necessário)
-- ======================================================================

ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE installments DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_assignments DISABLE ROW LEVEL SECURITY;

-- ======================================================================
-- CONCEDER PERMISSÕES
-- ======================================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ======================================================================
-- PRONTO! Todas as tabelas foram criadas vazias
-- ======================================================================
