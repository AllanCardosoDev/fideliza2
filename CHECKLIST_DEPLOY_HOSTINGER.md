# ✅ Deploy Hostinger - Checklist Rápido

## 🎯 5 Minutos - Versão Resumida

### Pré-requisito: Ter a pasta `dist/` pronta

```bash
npm run build
```

---

## ✅ Checklist de Deploy

### 1️⃣ Acessar Hospedagem

- [ ] Abrir: https://painel.hostinger.com.br
- [ ] Fazer login
- [ ] Clicar no domínio → **Gerenciar**
- [ ] Clicar em **cPanel**

### 2️⃣ Limpar Pasta Pública

- [ ] No cPanel, abrir **File Manager**
- [ ] Garantir que está em `/public_html`
- [ ] Selecionar todos os arquivos antigos
- [ ] Clicar **Delete**

### 3️⃣ Enviar Arquivos

**Opção Simples (recomendado):**

- [ ] Clicar em **Upload**
- [ ] Arrastar arquivos de `dist/` para a janela
- [ ] OU selecionar manualmente cada arquivo
- [ ] Esperar upload completar
- [ ] Fechar janela de upload

**Opção ZIP (se tiver muitos arquivos):**

- [ ] Compactar `dist/` em ZIP na sua máquina
- [ ] Upload do ZIP
- [ ] Clique direito no ZIP → **Extract**
- [ ] Delete o ZIP

### 4️⃣ Criar arquivo `.htaccess`

- [ ] No File Manager, clique em **+ File**
- [ ] Digite: `.htaccess` (com ponto!)
- [ ] Clique em **Create**
- [ ] Clique para editar
- [ ] Cole este código:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  RewriteRule ^ /index.html [QSA,L]
</IfModule>
```

- [ ] Clique em **Save Changes**

### 5️⃣ Ativar HTTPS

- [ ] No cPanel, procure por **AutoSSL** ou **SSL/TLS**
- [ ] Clique em **Issue** ou **Install**
- [ ] Aguarde 5 minutos
- [ ] Seu site agora tem 🔒

### 6️⃣ Testar

- [ ] Abrir: `https://seudominio.com.br`
- [ ] Verificar se carrega
- [ ] Pressionar F12 (Console)
- [ ] Procurar por erros vermelhos
- [ ] Se OK → **Deploy Completo!** ✅

---

## 📂 Estrutura de Pastas Esperada

Após upload, o cPanel deve mostrar assim:

```
/home/seu_usuario/public_html/
├── .htaccess ← IMPORTANTE!
├── index.html
├── assets/
│   ├── index-D_W9TWOH.css
│   ├── index.es-BdZ_Mf5d.js
│   ├── html2canvas-BTLVC7Rt.js
│   └── ...outros arquivos.js/css
└── logo.jpeg
```

---

## 🚨 Erros Comuns

| Erro                     | Solução                     |
| ------------------------ | --------------------------- |
| **Página em branco**     | Crie `.htaccess` (passo 4)  |
| **404 em rotas**         | Verifique `.htaccess`       |
| **Imagens não carregam** | Delete cache (Ctrl+Shift+R) |
| **HTTPS aviso**          | Aguarde 24h de propagação   |
| **Login não funciona**   | Verifique console (F12)     |

---

## 🔄 Atualizar Site Depois

```bash
# Sua máquina:
npm run build

# Hostinger:
1. File Manager → /public_html
2. Delete todos arquivos antigos
3. Upload da nova pasta dist/
4. Pronto!
```

---

## 📞 Suporte

- Problemas detalhados? Veja: `GUIA_DEPLOY_HOSTINGER_PASSO_A_PASSO.md`
- Dúvidas de Supabase? Veja: `DOCUMENTO_UPLOAD_DEBUG.md`
- Mais informações? Veja: `DEPLOYMENT_HOSTINGER.md`

---

## ✨ Pronto! Seu site está online! 🚀

ID do domínio e passos completados? Compartilhe o link! 🎉
