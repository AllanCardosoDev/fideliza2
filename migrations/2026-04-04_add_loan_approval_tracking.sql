-- Adicionar campos para rastrear aprovações e rejeições de requisições de empréstimo
ALTER TABLE loans ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS approved_by UUID NULL;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP NULL;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS rejected_by UUID NULL;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_loans_approved_at ON loans(approved_at);
CREATE INDEX IF NOT EXISTS idx_loans_rejected_at ON loans(rejected_at);
CREATE INDEX IF NOT EXISTS idx_loans_approved_by ON loans(approved_by);

-- Adicionar coluna created_at se não existir (para rastrear quando foi criada)
ALTER TABLE loans ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Criar índice em created_at
CREATE INDEX IF NOT EXISTS idx_loans_created_at ON loans(created_at);
