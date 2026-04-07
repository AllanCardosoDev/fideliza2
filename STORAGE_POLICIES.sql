-- ======================================================================
-- CONFIGURAR STORAGE BUCKET "documents" no Supabase
-- ======================================================================

-- 1. Criar bucket "documents" (se não existir)
-- NOTA: Fazer isso manualmente no Supabase Dashboard em Storage > Buckets > Create a new bucket
-- Nome: documents
-- Privacy: Private (RLS will handle permissions)

-- 2. Habilitar RLS no bucket documents
-- Ir em Storage > Policies e adicionar as seguintes policies:

-- ======================================================================
-- POLICY 1: Permitir upload anônimo (para testes)
-- ======================================================================
-- Aplicar a: documents (storage.objects)
-- Tipo: INSERT
-- Com verificação: true

-- Expressão:
-- bucket_id = 'documents' AND auth.role() = 'authenticated'

-- ======================================================================
-- POLICY 2: Permitir leitura pública (URLs públicas)
-- ======================================================================
-- Aplicar a: documents (storage.objects)
-- Tipo: SELECT
-- Com verificação: true

-- Expressão:
-- bucket_id = 'documents'

-- ======================================================================
-- POLICY 3: Permitir deletar apenas para o proprietário
-- ======================================================================
-- Aplicar a: documents (storage.objects)
-- Tipo: DELETE
-- Com verificação: true

-- Expressão:
-- bucket_id = 'documents' AND auth.role() = 'authenticated'

-- ======================================================================
-- VERIFICAR PERMISSÕES NA TABELA documents
-- ======================================================================

-- Se necessário, dar permissões especiais:
GRANT INSERT ON public.documents TO authenticated;
GRANT SELECT ON public.documents TO authenticated;
GRANT UPDATE ON public.documents TO authenticated;
GRANT DELETE ON public.documents TO authenticated;

-- Para usuários anônimos (se necessário):
GRANT INSERT ON public.documents TO anon;
GRANT SELECT ON public.documents TO anon;

-- ======================================================================
-- PASSOS MANUAIS NO SUPABASE DASHBOARD
-- ======================================================================

-- 1. Ir em Storage > Buckets
-- 2. Procurar ou criar bucket "documents"
-- 3. Clicar em "Policies" (ícone de escudo)
-- 4. Adicionar a seguinte política para UPLOAD:
--    - Nome: "Allow authenticated users to upload documents"
--    - Tipo: INSERT
--    - Verificação: bucket_id = 'documents'

-- 5. Adicionar política para DOWNLOAD (SELECT):
--    - Nome: "Allow anyone to view documents"
--    - Tipo: SELECT
--    - Verificação: bucket_id = 'documents'

-- 6. Adicionar política para DELETE:
--    - Nome: "Allow authenticated users to delete own documents"
--    - Tipo: DELETE
--    - Verificação: bucket_id = 'documents'

-- ======================================================================
-- DEBUG: Verificar estado do bucket
-- ======================================================================

-- No Supabase Dashboard, ir em Storage > Objects
-- Verificar se há uploads em: documents/[client_id]/...

-- Nel console do navegador, abrir DevTools (F12)
-- Buscar por console.log com "📤 Iniciando upload:"
-- Verificar se há mensagens de sucesso ou erro
