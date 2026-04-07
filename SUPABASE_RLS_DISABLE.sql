-- ======================================================================
-- Desabilitar RLS na Tabela DOCUMENTS (Supabase)
-- ======================================================================
-- Execute este SQL no Supabase SQL Editor para permitir uploads

-- Passo 1: Desabilitar RLS
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- Passo 2: Conceder permissões
GRANT INSERT ON public.documents TO anon;
GRANT INSERT ON public.documents TO authenticated;
GRANT SELECT ON public.documents TO anon;
GRANT SELECT ON public.documents TO authenticated;
GRANT UPDATE ON public.documents TO authenticated;
GRANT DELETE ON public.documents TO authenticated;

-- Pronto! Agora os uploads funcionarão ✅
