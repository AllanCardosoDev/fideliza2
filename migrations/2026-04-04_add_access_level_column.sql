-- 2026-04-04_add_access_level_column.sql
-- Adiciona suporte a controle de acesso granular (RBAC) para funcionários

BEGIN;

-- Verificar e adicionar coluna access_level na tabela employees se não existir
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'employee';

-- Criar índice para melhorar queries por access_level
CREATE INDEX IF NOT EXISTS idx_employees_access_level ON employees(access_level);

-- Comentário de documentação para a coluna
COMMENT ON COLUMN employees.access_level IS 'Nível de acesso: admin (total), supervisor (gestão operacional), employee (básico), guest (leitura apenas)';

-- Garantir que todos os registros têm um access_level válido
UPDATE employees
SET access_level = 'employee'
WHERE access_level IS NULL OR access_level = '';

-- Adicionar constraint para validar valores permitidos
ALTER TABLE employees
ADD CONSTRAINT access_level_check 
CHECK (access_level IN ('admin', 'supervisor', 'employee', 'guest'))
DEFERRABLE INITIALLY DEFERRED;

COMMIT;
