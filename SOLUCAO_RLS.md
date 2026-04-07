# ⚠️ Erro de RLS - Solução Rápida

## Problema

Erro ao salvar documento: **"new row violates row-level security policy"**

Isso significa: a tabela `documents` tem RLS (Row Level Security) habilitado e está bloqueando a inserção.

## ✅ Solução em 2 passos

### Passo 1️⃣: Abra o Supabase SQL Editor

1. Abra: https://supabase.com/dashboard
2. Seu Projeto: `fidelizacred`
3. Menu esquerdo: **SQL Editor**
4. Clique: **+ New query**

### Passo 2️⃣: Cole e Execute Este SQL

```sql
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

GRANT INSERT ON public.documents TO anon;
GRANT INSERT ON public.documents TO authenticated;
GRANT SELECT ON public.documents TO anon;
GRANT SELECT ON public.documents TO authenticated;
GRANT UPDATE ON public.documents TO authenticated;
GRANT DELETE ON public.documents TO authenticated;
```

5. Clique: **▶️ Run** (botão verde)
6. Veja: ✅ "Success. No rows returned"

### Passo 3️⃣: Pronto!

Volte para a aplicação, **recarregue** (F5) e tente upload novamente! 🎉

---

## ⏱️ Tempo Total: 1 minuto

Se tiver dúvidas, o arquivo `SUPABASE_RLS_DISABLE.sql` contém o mesmo SQL.
