# 🚀 Guia de Deploy na Hostinger

Este guia detalha os passos para fazer o deploy do projeto **Fidelizacred** (React + Vite) em um domínio na Hostinger.

---

## 📋 Pré-requisitos

- ✅ Domínio registrado na Hostinger
- ✅ Hospedagem contratada (plano recomendado: Premium ou superior)
- ✅ Acesso ao painel de controle cPanel da Hostinger
- ✅ Node.js + npm instalados localmente
- ✅ Git instalado (opcional, mas recomendado)

---

## 🔧 PASSO 1: Preparar o Build Local

### 1.1 Instalar dependências (primeira vez)

```bash
cd c:\Users\User\Desktop\financeiro\fidelizacred-react
npm install
```

### 1.2 Criar o build de produção

```bash
npm run build
```

**Resultado:** Uma pasta `dist/` será criada com os arquivos otimizados para produção.

Estrutura esperada:

```
dist/
├── index.html
├── assets/
│   ├── *.js (JavaScript bundles)
│   ├── *.css (Stylesheets)
│   └── *.png, *.svg (Imagens)
└── logo.jpeg (se copiado)
```

---

## 📦 PASSO 2: Preparar Arquivo para Upload

### 2.1 Comprimir os arquivos (opcional, mas recomendado)

**Windows (PowerShell):**

```powershell
Compress-Archive -Path "dist/*" -DestinationPath "dist.zip"
```

**Mac/Linux:**

```bash
cd dist && zip -r ../dist.zip . && cd ..
```

---

## 🌐 PASSO 3: Configurar Domínio na Hostinger

### 3.1 Acessar o cPanel

1. Faça login na **Hostinger** (painel.hostinger.com.br)
2. Vá para **Gerenciar** → Seu domínio
3. Clique em **Acessar cPanel**

### 3.2 Configura DNS (se necessário)

1. No cPanel, vá para **Domains** ou **Domínios**
2. Verifique se o domínio está apontando para seu servidor
3. Se precisar alterar:
   - Vá paraas **DNS Records**
   - Adicione registros A apontando para o servidor Hostinger
   - Aguarde propagação (até 24h)

---

## 📤 PASSO 4: Upload dos Arquivos

### Opção A: Via File Manager (cPanel)

1. No cPanel, abra **File Manager**
2. Navegue até a pasta **public_html**
3. Delete conteúdo anterior (se houver)
4. Clique em **Upload** ou **Upload File**
5. Selecione `dist.zip` ou arraste a pasta `dist`
6. Se for ZIP, descompacte aqui mesmo:
   - Clique direito no arquivo
   - Selecione **Extract**

### Opção B: Via FTP/SFTP (Recomendado para projetos maiores)

1. No cPanel, vá para **FTP Accounts**
2. Anote as credenciais:
   - **Servidor**: ftp.seudominio.com.br
   - **Usuário**: conta FTP
   - **Senha**: senha gerada

3. Use um cliente FTP (ex: FileZilla):

   ```
   Host: ftp.seudominio.com.br
   Username: [seu_usuario_ftp]
   Password: [sua_senha]
   Port: 21 (ou 22 para SFTP)
   ```

4. Conecte e navegue até `/public_html`
5. Faça upload de todos os arquivos da pasta `dist`

---

## ⚙️ PASSO 5: Configurar SPA (Single Page Application)

**IMPORTANTE**: React Router precisa de configuração especial para funcionar corretamente.

### 5.1 Criar arquivo `.htaccess`

No cPanel **File Manager**, navegue até `public_html` e crie um novo arquivo chamado `.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On

  # Se o arquivo/diretório for solicitado, use-o como está
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Caso contrário, redirecione para index.html
  RewriteRule ^ /index.html [QSA,L]
</IfModule>
```

**Como criar:**

1. Clique em **+ File** (File Manager)
2. Nome: `.htaccess`
3. Cole o conteúdo acima
4. Clique em **Create**

---

## 🔒 PASSO 6: Configurar SSL (HTTPS)

1. No cPanel, vá para **AutoSSL** ou **SSL/TLS**
2. Se disponível, clique em **Issue** para gerar certificado Let's Encrypt
3. Aguarde a validação (geralmente imediato)
4. Faça o login no site para verificar se usa HTTPS

---

## 🌍 PASSO 7: Testar o Acesso

1. Abra seu navegador
2. Acesse `https://seudominio.com.br`
3. Verifique se:
   - ✅ O site carrega corretamente
   - ✅ Logo aparece no canto superior esquerdo
   - ✅ Todos os estilos CSS estão sendo aplicados
   - ✅ JavaScript está funcionando (abra o Console: F12)

---

## 🔑 PASSO 8: Verificar Variáveis de Ambiente

O arquivo `.env` com variáveis Supabase **não é necessário** fazer upload, pois as credenciais estão compiladas no build.

**Verificar em `public_html/assets/`:**

- Abra qualquer arquivo `.js` e procure por:
  - `tqckovyzshnkqxpnyzoo.supabase.co` (URL Supabase)
  - `eyJhbGc...` (começo da chave ANON)

Se encontrar, significa que está configurado corretamente.

---

## 🐛 Troubleshooting

### Erro 404 em rotas secundárias

**Problema:** Acessar `/clientes` ou `/dashboard` retorna 404
**Solução:** Verifique se o `.htaccess` foi criado corretamente

### Estilos CSS não carregam

**Problema:** Site aparece sem estilo
**Solução:**

1. Abra o Console (F12)
2. Procure por erros de CORS
3. Verifique se os paths dos arquivos estão corretos

### Imagens não aparecem

**Problema:** Logo e imagens em branco
**Solução:**

1. Verifique se `public/logo.jpeg` foi copiada para `public_html/`
2. Atualize o cache do navegador (Ctrl+Shift+R)

### HTTPS retorna erro de certificado

**Problema:** Aviso de "conexção não segura"
**Solução:**

1. Aguarde propagação de DNS (24h)
2. Regenere o certificado SSL no cPanel
3. Limpe cache do navegador

---

## 📊 Estrutura Final no Servidor

```
/home/usuario/public_html/
├── index.html
├── .htaccess
├── assets/
│   ├── *.js
│   ├── *.css
│   └── imagens/
├── logo.jpeg
└── ...outros arquivos estáticos
```

---

## 🔄 Atualização Futura

Para atualizar o site com novas versões:

1. **Local:**

   ```bash
   npm run build
   ```

2. **No servidor:**
   - Delete conteúdo anterior em `public_html`
   - Upload nova pasta `dist`
   - Limpe cache do navegador

---

## 📞 Suporte

Se encontrar problemas:

- **Hostinger Support**: https://support.hostinger.com.br
- **Vite Docs**: https://vitejs.dev
- **React Router**: https://reactrouter.com

---

**Deploy realizado:** ✅ Projeto pronto para produção!
