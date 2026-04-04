# 🚀 GUIA RÁPIDO - Deploy Hostinger (Fidelizacred)

## ⚡ PASSO 1: Fazer Build do Projeto (Seu Computador)

Abra **PowerShell** e execute:

```powershell
cd "c:\Users\User\Desktop\financeiro\fidelizacred-react"
npm run build
```

✅ Isso vai criar uma pasta **`dist`** com todos os arquivos prontos para upload.

Tempo estimado: **2-3 minutos**

---

## 📤 PASSO 2: Acessar Hostinger cPanel

1. Acesse: **https://painel.hostinger.com.br** (ou seu painel Hostinger)
2. Faça login com suas credenciais
3. Clique em **"Gerenciar"** no domínio onde quer hospedar
4. Clique em **"Acessar cPanel"**

---

## 📁 PASSO 3: Upload dos Arquivos (Opção MAIS RÁPIDA)

### Via File Manager:

1. No cPanel, procure por **"File Manager"** (gerenciador de arquivos)
2. Clique em **"public_html"**
3. **IMPORTANTE:** Delete todo o conteúdo que está lá (se houver)
   - Selecione tudo com Ctrl+A
   - Clique em Delete/Excluir
4. Agora abra seu computador e navegue até:
   ```
   C:\Users\User\Desktop\financeiro\fidelizacred-react\dist
   ```
5. **Selecione TODOS os arquivos dentro de `dist`** (não a pasta dist em si):
   - Ctrl+A para selecionar tudo
   - Ctrl+C para copiar
6. Volte ao File Manager (cPanel)
7. Clique em **Upload** ou arraste os arquivos para a área indicada
8. Aguarde o upload terminar

**Tempo estimado: 3-5 minutos**

---

## 🔧 PASSO 4: Configurar .htaccess (ESSENCIAL PARA REACT ROUTER)

1. No File Manager do cPanel (dentro de `public_html`), clique em **"+ File"**
2. Digite o nome: **`.htaccess`** (com o ponto na frente)
3. Clique em **Create**
4. Clique com botão direito no arquivo → **Edit** (ou duplo clique)
5. Cole o código abaixo:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On

  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  RewriteRule ^ /index.html [QSA,L]
</IfModule>
```

6. Clique em **Save** e feche
7. ✅ Pronto!

**Este arquivo faz o React Router funcionar corretamente.**

---

## 🌐 PASSO 5: Testar o Acesso (VALIDAÇÃO FINAL)

1. Abra seu navegador
2. Acesse: **https://seudominio.com.br** (substitua pelo seu domínio)
3. Verifique:
   - ✅ Carrega sem erros?
   - ✅ Logo aparece (canto superior esquerdo)?
   - ✅ Cores estão aplicadas corretamente?
   - ✅ Consegue navegar entre páginas (Dashboard, Clientes, etc)?

### Parar Debug (se necessário):

- Pressione **F12** para abrir Console
- Procure por erros vermelhos
- Se houver erros de CORS ou 404, me informe

---

## 🆘 Possíveis Problemas

### ❌ "Erro 404 ao acessar /dashboard ou /clientes"

**Solução:** Verifique se o arquivo `.htaccess` foi criado corretamente.

### ❌ "Site sem cores/estilos"

**Solução:**

- Abra F12 → Console
- Procure por URLs com erro (vermelho)
- Se houver erro de CORS, tente limpar cache (Ctrl+Shift+Del)

### ❌ "Logo não aparece"

**Solução:** Na pasta `public_html`, verifique se existe arquivo `logo.jpeg`

- Se não existir, faça upload do arquivo de: `C:\Users\User\Desktop\financeiro\fidelizacred-react\public\logo.jpeg`

### ❌ "Erro de certificado SSL"

**Solução:**

1. Espere 5-10 minutos para propagação
2. No cPanel, vá a **AutoSSL** → clique em **Issue SSLCertificate**
3. Aguarde e atualize o navegador

---

## ✅ Checklist Final

- [ ] Fiz login no painel Hostinger
- [ ] Acessei cPanel
- [ ] Fiz upload de todos os arquivos de `dist`
- [ ] Criei arquivo `.htaccess` com o código correto
- [ ] Testei acessando o domínio
- [ ] Site carrega com estilos (cores, logo, layout)
- [ ] Conseguo navegar entre páginas

---

## 📞 Se Tudo Funcionou!

🎉 **Seu projeto está VIVO na Hostinger!**

Agora qualquer pessoa pode acessar seu domínio e usar o sistema.

---

## 🔄 Atualizar no Futuro

Quando fizer mudanças no projeto:

1. **Local:**

   ```powershell
   npm run build
   ```

2. **No cPanel:**
   - Delete conteúdo de `public_html`
   - Upload de novo conteúdo de `dist`
   - Pronto!
