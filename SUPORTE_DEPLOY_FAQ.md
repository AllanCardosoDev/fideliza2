# 🆘 Suporte Deploy - FAQ & Troubleshooting

## ❓ Perguntas Frequentes

### P: Como faço o build da aplicação?

**R:** Na sua máquina, no terminal:

```bash
cd c:\Users\User\Desktop\financeiro\fidelizacred-react
npm run build
```

Uma pasta `dist/` será criada com todos os arquivos prontos para upload.

---

### P: Qual pasta envio para o Hostinger?

**R:** Apenas o **conteúdo** de `dist/`:

```
dist/
├── index.html ← Envie tudo isto
├── assets/
├── logo.jpeg
└── ...
```

**NÃO envie:**

- `.env.local` (tem suas senhas!)
- `node_modules/` (não precisa)
- `src/` (código-fonte, já compilado)

---

### P: Preciso de Node.js no servidor?

**R:** NÃO! O `npm run build` já compilou tudo para HTML/CSS/JS puro.

O servidor Hostinger não precisa ter Node.js instalado.

---

### P: Posso usar uma versão anterior do site?

**R:** Sim! Antes de fazer novo upload, salve a pasta `dist/` anterior:

```bash
# Sua máquina
Rename-Item -Path "dist" -NewName "dist-backup"
npm run build
# Agora você tem dist (nova) e dist-backup (antiga)
```

Se algo der errado, você pode recuperar a versão anterior no Hostinger.

---

### P: Quanto de espaço o site usa?

**R:** Aproximadamente **2-3 MB** (depois de comprimido).

Planos compartilhados da Hostinger têm geralmente 50-100 GB, então não é problema.

---

### P: Preciso fazer upload de todas as dependências npm?

**R:** NÃO! Tudo já está compilado na pasta `dist/`.

O servidor só precisa servir os arquivos HTML/CSS/JS.

---

## 🐛 Problemas e Soluções

### Problema 1: "Página em Branco Branca"

**Sintomas:** Site carrega mas mostra página totalmente branca.

**Causas Possíveis:**

1. `.htaccess` faltando
2. Arquivo `index.html` não está em `/public_html`
3. Erro de JavaScript no console

**Solução:**

1. Abra DevTools (F12)
2. Vá para aba **Console**
3. Procure por erros em vermelho
4. Copie o erro e procure na próxima seção

Se vir erro como "Cannot GET /":

```
→ Recrie o arquivo .htaccess (Checklist passo 4)
```

---

### Problema 2: "Erro 404 ao clicar em links"

**Sintomas:**

- Home funciona (/)
- Mas /clientes, /dashboard, /emprestimos retornam 404

**Causa:** `.htaccess` não está configurado corretamente.

**Solução:**

1. File Manager → clique no arquivo `.htaccess`
2. Édite e certifique-se de que tem este conteúdo:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  RewriteRule ^ /index.html [QSA,L]
</IfModule>
```

3. Salve
4. Limpe cache do navegador (Ctrl+Shift+R)
5. Teste novamente

---

### Problema 3: "Muitos erros no Console"

**Sintomas:** F12 mostra vários erros vermelhos

**Soluções Comuns:**

**Erro A: "Uncaught TypeError: Cannot read property 'x' of undefined"**

→ Algum JavaScript não foi carregado corretamente
→ Aguarde 2-3 segundos e recarregue (F5)
→ Se persistir, limpe cache: Ctrl+Shift+R

**Erro B: "CORS error" ou "Access denied"**

→ Problema de conexão com Supabase
→ Verifique credenciais em `.env.local`
→ Verifique se URL Supabase está correta
→ Se foi alterada, recompile: `npm run build`

**Erro C: "blob:http://... is not allowed"**

→ Geração de PDF
→ Isto é normal, não afeta o uso
→ Pode ignorar

---

### Problema 4: "Upload de documentos não funciona"

**Sintomas:**

- Clico em "Enviar", aparece sucesso, mas não salva
- Erro na tela

**Causas:**

1. RLS bloqueando INSERT no banco
2. Bucket `documents` não existe
3. Credenciais Supabase incorretas

**Solução:**

**Passo 1:** Verificar bucket no Supabase

```
→ Supabase Dashboard
→ Storage → Buckets
→ Verificar se "documents" existe
→ Se não existe, criar
```

**Passo 2:** Desabilitar RLS (desenvolvimento)

```sql
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
```

Execute no Supabase SQL Editor.

**Passo 3:** Verificar Console do navegador

F12 → Console → Procurar mensagem de erro

Se vir "row violates row-level security policy":
→ RLS ainda está ativo
→ Execute SQL acima novamente

---

### Problema 5: "SSL/HTTPS não funciona"

**Sintomas:**

- Navegador avisa "Conexão não segura"
- Certificado inválido

**Soluções:**

**Opção A: Aguardar**
→ DNS pode levar até 24h
→ Tente novamente após algumas horas

**Opção B: Regenerar Certificado**

No cPanel:

1. Procure **AutoSSL** ou **SSL/TLS**
2. Clique em **Remove** (se tiver)
3. Agarde 5 minutos
4. Clique em **Issue** novamente
5. Aguarde conclusão

**Opção C: Usar URL sem HTTPS (temporário)**

Enquanto o SSL está sendo gerado:

```
http://seudominio.com.br
```

---

### Problema 6: "Imagens não carregam"

**Sintomas:**

- Logo ou imagens aparecem com X ou em branco
- Console mostra erro 404 para imagens

**Causas:**

1. Arquivo não foi enviado
2. Caminho incorreto no código
3. Permissões do arquivo erradas

**Solução:**

**Passo 1:** Verificar se arquivo existe

No File Manager, procure por `logo.jpeg` ou a imagem em questão.

Se não existe:
→ Envie manualmente ou execute `npm run build` novamente

**Passo 2:** Verificar permissões

Clique direito no arquivo → **Change Permissions**

Coloque:

- Owner: Read (4) + Write (2) + Execute (1) = 7
- Group: Read (4) = 4
- Public: Read (4) = 4

**Resultado:** 744

**Passo 3:** Limpar cache do navegador

```
Ctrl + Shift + R
```

---

### Problema 7: "Site lenta ou muito devagar"

**Causas Comuns:**

1. Servidor Hostinger sobrecarregado
2. Conexão Supabase lenta
3. Arquivos não estão comprimidos corretamente

**Soluções:**

**Opção A: Verificar tamanho dos arquivos**

No Console, verificar tamanho em MB:

```javascript
// Copie e execute no Console (F12)
fetch(window.location.href)
  .then((r) => r.blob())
  .then((b) => console.log(`Tamanho: ${(b.size / 1024 / 1024).toFixed(2)} MB`));
```

Se > 5MB → contate Hostinger, pode ser problema do servidor

**Opção B: Reduzir tamanho do build**

Execute localmente:

```bash
npm run build --mode production
```

Garanta que `dist/` tem menos de 3MB total.

---

### Problema 8: "Não consigo acessar cPanel"

**Causas:**

1. Esqueceu a senha
2. IP bloqueado
3. Plano expirou

**Soluções:**

**Se esqueceu a senha:**

1. Vá para: https://painel.hostinger.com.br
2. Clique em **Esqueceu a senha?**
3. Siga instruções de recuperação

**Se suspeita de IP bloqueado:**

1. Contate suporte Hostinger
2. Solicite reset de IP

**Se plano expirou:**

1. Acesse: https://painel.hostinger.com.br
2. Renove o plano
3. Aguarde ativação (geralmente imediato)

---

## 📞 Quando Contatar Suporte

Contate **Suporte Hostinger** se:

- [ ] Site não carrega mesmo após todos os passos
- [ ] Recebe erro 500 (erro do servidor)
- [ ] cPanel não abre ou está indisponível
- [ ] Não consegue fazer upload via File Manager
- [ ] Certificate SSL não ativa após 24h

**Informações para fornecer:**

- Seu domínio
- O que tentou fazer
- Screenshots de erros
- Hora aproximada do problema

---

## ✅ Checklist de Verificação Final

Antes de considerar o deploy feito:

- [ ] Site carrega em `https://seudominio.com.br`
- [ ] Logo e estilos aparecem corretamente
- [ ] Navegação entre páginas funciona
- [ ] Login não retorna erro
- [ ] Console (F12) não tem erros vermelhos
- [ ] Upload de documentos funciona
- [ ] Formulários salvam no banco
- [ ] PDFs podem ser gerados
- [ ] Responsivo funciona (teste em mobile)
- [ ] HTTPS tem cadeado 🔒

Se tudo acima passar ✅, parabéns! **Seu site está em produção!** 🚀

---

## 📖 Documentação Relacionada

- **GUIA_DEPLOY_HOSTINGER_PASSO_A_PASSO.md** - Guia completo passo a passo
- **CHECKLIST_DEPLOY_HOSTINGER.md** - Versão resumida em 5 minutos
- **DEPLOYMENT_HOSTINGER.md** - Documentação técnica detalhada
- **DOCUMENTO_UPLOAD_DEBUG.md** - Problemas específicos de upload
- **SETUP_DESENVOLVIMENTO.md** - Como rodar localmente

---

## 💡 Dicas Finais

1. **Mantenha backup:** Salve a pasta `dist/` depois de cada deploy
2. **Teste localmente primeiro:** `npm run dev` antes de fazer upload
3. **Use versionamento:** Incremente versão em `package.json` para rastrear
4. **Monitore performance:** Verifique speed no Google PageSpeed Insights
5. **Planifique updates:** Antes de fazer deploy em produção, sempre teste

---

**Ficou com dúvida? Volte ao guia passo a passo ou procure a seção específica do seu problema acima!** 💪
