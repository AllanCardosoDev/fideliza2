-- =============================================
-- FIDELIZA CRED - Schema completo para Supabase
-- Execute no SQL Editor do Supabase
-- =============================================

-- =============================================
-- OPÇÃO A: Adicionar colunas às tabelas existentes
-- (use se já tiver dados que não quer perder)
-- =============================================

-- Tabela LOANS - adicionar coluna notes
ALTER TABLE loans ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- Tabela EMPLOYEES - adicionar colunas extras
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary NUMERIC(12,2) DEFAULT NULL;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS department TEXT DEFAULT '';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS admission DATE DEFAULT NULL;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS username TEXT DEFAULT '';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'employee';

-- Tabela VEHICLES - adicionar colunas extras
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS price NUMERIC(12,2) DEFAULT NULL;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS km INT DEFAULT NULL;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- Tabela SALES - (já tem as colunas necessárias: description, client, value, status, date)
-- Nenhuma alteração necessária para sales

-- =============================================
-- OPÇÃO B: Criar schema completo do zero
-- (use somente se não tiver dados importantes)
-- =============================================

-- DROP TABLE IF EXISTS payments CASCADE;
-- DROP TABLE IF EXISTS installments CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS employees CASCADE;
-- DROP TABLE IF EXISTS vehicles CASCADE;
-- DROP TABLE IF EXISTS sales CASCADE;
-- DROP TABLE IF EXISTS transactions CASCADE;
-- DROP TABLE IF EXISTS loans CASCADE;
-- DROP TABLE IF EXISTS clients CASCADE;

-- Tabela CLIENTS
-- CREATE TABLE clients (
--   id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
--   name TEXT NOT NULL,
--   cpf_cnpj TEXT DEFAULT '',
--   phone TEXT DEFAULT '',
--   email TEXT DEFAULT '',
--   address TEXT DEFAULT '',
--   notes TEXT DEFAULT '',
--   status TEXT DEFAULT 'active',
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Tabela LOANS
-- CREATE TABLE loans (
--   id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
--   client TEXT DEFAULT '',
--   client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL,
--   value NUMERIC(12,2) NOT NULL DEFAULT 0,
--   installments INT NOT NULL DEFAULT 1,
--   paid INT DEFAULT 0,
--   status TEXT DEFAULT 'active',
--   interest_rate NUMERIC(5,2) DEFAULT 5.00,
--   interest_type TEXT DEFAULT 'compound',
--   start_date DATE DEFAULT CURRENT_DATE,
--   notes TEXT DEFAULT '',
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Tabela INSTALLMENTS
-- CREATE TABLE installments (
--   id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
--   loan_id BIGINT REFERENCES loans(id) ON DELETE CASCADE,
--   number INT NOT NULL DEFAULT 1,
--   due_date DATE NOT NULL,
--   amount NUMERIC(12,2) NOT NULL DEFAULT 0,
--   paid_amount NUMERIC(12,2) DEFAULT 0,
--   status TEXT DEFAULT 'pending',
--   paid_at TIMESTAMPTZ,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Tabela PAYMENTS
-- CREATE TABLE payments (
--   id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
--   loan_id BIGINT REFERENCES loans(id) ON DELETE CASCADE,
--   installment_id BIGINT REFERENCES installments(id) ON DELETE SET NULL,
--   amount NUMERIC(12,2) NOT NULL DEFAULT 0,
--   penalty NUMERIC(12,2) DEFAULT 0,
--   mora NUMERIC(12,2) DEFAULT 0,
--   payment_date DATE DEFAULT CURRENT_DATE,
--   notes TEXT DEFAULT '',
--   reversed BOOLEAN DEFAULT FALSE,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Tabela TRANSACTIONS
-- CREATE TABLE transactions (
--   id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
--   description TEXT DEFAULT '',
--   category TEXT DEFAULT '',
--   type TEXT DEFAULT 'income',
--   amount NUMERIC(12,2) DEFAULT 0,
--   date DATE DEFAULT CURRENT_DATE,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Tabela SALES
-- CREATE TABLE sales (
--   id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
--   description TEXT DEFAULT '',
--   client TEXT DEFAULT '',
--   value NUMERIC(12,2) DEFAULT 0,
--   status TEXT DEFAULT 'pending',
--   date DATE DEFAULT CURRENT_DATE,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Tabela VEHICLES
-- CREATE TABLE vehicles (
--   id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
--   model TEXT DEFAULT '',
--   plate TEXT DEFAULT '',
--   year INT,
--   color TEXT DEFAULT '',
--   status TEXT DEFAULT 'available',
--   price NUMERIC(12,2) DEFAULT NULL,
--   km INT DEFAULT NULL,
--   notes TEXT DEFAULT '',
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Tabela EMPLOYEES
-- CREATE TABLE employees (
--   id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
--   name TEXT NOT NULL DEFAULT '',
--   role TEXT DEFAULT '',
--   phone TEXT DEFAULT '',
--   email TEXT DEFAULT '',
--   status TEXT DEFAULT 'active',
--   salary NUMERIC(12,2) DEFAULT NULL,
--   department TEXT DEFAULT '',
--   admission DATE DEFAULT NULL,
--   username TEXT DEFAULT '',
--   password TEXT DEFAULT '',
--   access_level TEXT DEFAULT 'employee',
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Tabela NOTIFICATIONS
-- CREATE TABLE notifications (
--   id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
--   title TEXT DEFAULT '',
--   message TEXT DEFAULT '',
--   type TEXT DEFAULT 'info',
--   read BOOLEAN DEFAULT FALSE,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- =============================================
-- Permissões (garantir acesso com anon key)
-- =============================================
-- ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE loans DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE installments DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
