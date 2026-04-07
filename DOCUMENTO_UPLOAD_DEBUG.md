# 🔧 Guia de Diagnóstico - Upload de Documentos

## ✅ Checklist de Requisitos

### 1. **Banco de Dados (Supabase)**

- [ ] Tabela `documents` existe com as seguintes colunas:
  - `id` (BIGINT, PK, auto-increment)
  - `client_id` (BIGINT, FK → clients.id)
  - `employee_id` (BIGINT, FK → employees.id, nullable)
  - `document_type` (TEXT)
  - `file_name` (TEXT)
  - `file_url` (TEXT)
  - `file_size` (INTEGER)
  - `mime_type` (TEXT)
  - `status` (TEXT, default 'active')
  - `uploaded_at` (TIMESTAMPTZ, default NOW())

- [ ] RLS está **DESABILITADO** na tabela `documents`

  ```sql
  ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
  ```

- [ ] Permissões estão concedidas:
  ```sql
  GRANT INSERT ON public.documents TO authenticated;
  GRANT SELECT ON public.documents TO authenticated;
  ```

### 2. **Storage (Supabase)**

- [ ] Bucket `documents` existe
  - Tipo: Private (RLS will handle)
  - Publicar objetos: No

- [ ] Policies configuradas:
  1. **INSERT** (Upload):
     - Nome: "Allow authenticated upload"
     - Verificação: `bucket_id = 'documents'`
  2. **SELECT** (Download/View):
     - Nome: "Allow public access"
     - Verificação: `bucket_id = 'documents'`
  3. **DELETE** (Delete):
     - Nome: "Allow authenticated delete"
     - Verificação: `bucket_id = 'documents'`

### 3. **Frontend (React)**

- [ ] `DocumentUpload.jsx` está sendo passado corretamente:
  - `clientId` (obrigatório)
  - `clientType` ("autonomo", "empresa", etc)
  - `currentUser` (objeto com propriedade `id`)
  - `onUploadSuccess` (callback)

- [ ] Variáveis de ambiente estão configuradas:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## 🐛 Troubleshooting

### Erro: "Erro ao fazer upload do arquivo"

**Causa 1: Bucket não existe ou não tem permissões**

- Solução:
  1. Abrir Supabase Dashboard
  2. Ir em Storage > Buckets
  3. Criar bucket "documents" ou verificar se existe
  4. Verificar se está com RLS habilitado
  5. Adicionar policies (ver acima)

**Causa 2: Arquivo proibido**

- Verificar tipos aceitos: PDF, JPG, PNG, DOC, DOCX
- Verificar tamanho máximo: 10MB
- Verificar console do navegador para mimetype real

### Erro: "Erro ao salvar documento no banco"

**Causa 1: cliente_id ou columns faltando**

- Verificar se `client_id` é um número válido
- Verificar se employee_id é optional (pode ser NULL)
- Verificar se tabela tem todas as colunas esperadas

**Causa 2: RLS bloqueando INSERT**

- Solução: Desabilitar RLS na tabela documents
  ```sql
  ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
  ```

**Causa 3: Chave estrangeira violada**

- Verificar se `client_id` existe na tabela `clients`
- Verificar se `employee_id` existe na tabela `employees`

### Modal fecha mas documento não foi enviado

**Causa: Callback executado antes da conclusão**

- O código foi corrigido em DocumentUpload.jsx
- `await fetchDocuments()` agora é aguardado
- `onUploadSuccess()` é chamado após tudo estar completo

## 📋 Como Verificar

### No Console do Navegador (F12)

```javascript
// 1. Verificar logs de upload
// Procurar por: "📤 Iniciando upload:"
// Procurar por: "✅ Upload concluído:"
// Procurar por: "💾 Salvando no BD:"
// Procurar por: "✅ Documento salvo com sucesso:"

// 2. Testar conexão com Supabase
import { supabase } from "./src/services/supabaseClient";

// Teste de conexão
await supabase.from("documents").select("count(*)").single();
// Deve retornar: { count: X } sem erros

// Teste de storage
await supabase.storage.from("documents").list("1");
// Deve retornar: lista de arquivos ou erro de bucket não encontrado
```

### No Supabase Dashboard

1. **Verificar tabela documents:**
   - Ir em SQL Editor
   - Executar: `SELECT * FROM documents ORDER BY uploaded_at DESC LIMIT 10;`
   - Verificar se há registros recentes

2. **Verificar storage:**
   - Ir em Storage > Objects
   - Clicar em bucket "documents"
   - Verificar se há pastas com client_id
   - Clicar em arquivo para ver URL pública

3. **Verificar logs:**
   - Ir em Logs > Database
   - Filtrar por table: documents
   - Verificar queries INSERT recentes

## 🎯 Teste passo-a-passo

1. **Abrir DevTools** (F12)
2. **Ir para Clientes page**
3. **Editar um cliente**
4. **Ir para aba Documentos**
5. **Selecionar: RG**
6. **Escolher arquivo (PDF pequeno)**
7. **Clicar: 📤 Upload**
8. **Observar console:**
   - Deve ver: "📤 Iniciando upload:"
   - Verifique clientId, currentUser?.id, etc
   - Aguarde: "✅ Upload concluído:"
   - Aguarde: "✅ Documento salvo com sucesso:"
9. **Modal deve permanecer aberto**
10. **Depois de ~2-3 seg, Alert: "✅ Documento enviado com sucesso!"**
11. **Documento lista deve atualizar**
12. **Modal pode fechar**

## 📞 Mais Ajuda

Se ainda tiver problemas:

1. Copie toda a saída do console (F12)
2. Abra Supabase Dashboard
3. Vá em Logs > Database
4. Procure por tentativas de INSERT na tabela documents
5. Verifique as mensagens de erro exatas

---

**Última atualização:** 2026-04-06
**Versão:** 2.0 (Com await em fetchDocuments)
