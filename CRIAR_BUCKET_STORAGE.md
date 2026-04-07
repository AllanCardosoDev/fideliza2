# 📦 Criar Bucket "documents" no Supabase

## ⚠️ Problema

A aplicação não consegue criar o bucket automaticamente (requer permissões administrativas).

## ✅ Solução: Criar Manualmente

### Passo 1: Abrir Supabase Dashboard

1. Abra: https://supabase.com/dashboard
2. Faça login com sua conta

### Passo 2: Ir para Storage

1. Clique em seu **Projeto**
2. No menu lateral esquerdo, vá em: **Storage**

### Passo 3: Criar Novo Bucket

1. Clique em **"Create a new bucket"** (ou botão similar)
2. Preencha:
   - **Name:** `documents` (exatamente assim, em minúsculas)
   - **Privacy:** `Private` (não public)
3. Clique em **"Create Bucket"**

### Passo 4: Configurar Políticas de Acesso (Opcional, mas recomendado)

1. Clique no bucket `documents`
2. Vá na aba **"Policies"** ou **"Access"**
3. Adicione estas políticas:

#### Policy 1: Permitir Upload

- **Nome:** Allow authenticated to upload
- **Tipo:** INSERT
- **Verificação:** `bucket_id = 'documents'`

#### Policy 2: Permitir Visualizar

- **Nome:** Allow authenticated to view
- **Tipo:** SELECT
- **Verificação:** `bucket_id = 'documents'`

#### Policy 3: Permitir Deletar

- **Nome:** Allow authenticated to delete
- **Tipo:** DELETE
- **Verificação:** `bucket_id = 'documents'`

### Passo 5: Pronto!

Depois de criar o bucket, **recarregue a aplicação** (F5) e tente fazer upload novamente.

---

## 🎬 Vídeo Resumido (se preferir)

No Supabase Dashboard:

1. Storage ➜ Create new bucket
2. Name: `documents`
3. Privacy: `Private`
4. Create Bucket ✅

---

## ✅ Checklist de Teste

Depois de criar o bucket:

- [ ] Abra DevTools (F12)
- [ ] Vá para Clientes > Editar > Documentos
- [ ] Tente fazer upload
- [ ] Console deve mostrar: `✅ Bucket 'documents' já existe`
- [ ] Upload deve funcionar!

---

**Tempo estimado:** 2-3 minutos ⏱️
