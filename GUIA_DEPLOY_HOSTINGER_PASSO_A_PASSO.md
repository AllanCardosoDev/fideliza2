# 🚀 Guia Prático de Deploy no Hostinger - Passo a Passo

## 📋 O Que Você Precisa

- ✅ Domínio registrado no Hostinger
- ✅ Plano contratado (Shared Hosting, Cloud ou VPS)
- ✅ Acesso ao painel cPanel
- ✅ Cliente FTP (FileZilla) ou navegador
- ✅ Arquivos da pasta `dist/` gerados localmente

---

## 🎯 Etapa 1: Gerar os Arquivos para Upload (Sua Máquina)

### Passo 1.1: Abrir Terminal/PowerShell

```bash
cd c:\Users\User\Desktop\financeiro\fidelizacred-react
```

### Passo 1.2: Fazer Build da Aplicação

```bash
npm run build
```

**Resultado esperado:**

```
✓ 294 modules transformed.
✓ built in 2.01s

dist/
├── index.html
├── assets/
│   ├── *.js
│   ├── *.css
│   └── imagens
└── logo.jpeg
```

### Passo 1.3: Localizar a Pasta `dist/`

A pasta está em:

```
c:\Users\User\Desktop\financeiro\fidelizacred-react\dist\
```

**Copie o caminho para usar depois!**

---

## 🌐 Etapa 2: Acessar o Painel Hostinger

### Passo 2.1: Fazer Login

1. Abra: https://painel.hostinger.com.br
2. Faça login com suas credenciais
3. Você verá seus domínios

### Passo 2.2: Selecionar o Domínio

1. Clique no domínio onde quer fazer deploy
2. Clique em **Gerenciar**

### Passo 2.3: Acessar cPanel

1. Procure por **Acessar Painel cPanel** ou **Gerenciar cPanel**
2. É abri em uma nova aba

**Você agora está no cPanel! 🎉**

---

## 📁 Etapa 3: Preparar a Pasta no Servidor

### Passo 3.1: Abrir File Manager

No cPanel:

1. Procure por **File Manager** (geralmente na esquerda)
2. Clique para abrir
3. Selecione a pasta **public_html** (já deve estar selecionado)

### Passo 3.2: Limpar Conteúdo Anterior (Se Houver)

Se há arquivos antigos:

1. Selecione todos (Ctrl+A)
2. Clique em **Delete**
3. Confirme

**Resultado:** Pasta vazia e pronta

---

## 📤 Etapa 4: Upload dos Arquivos

### Método A: Upload Direto (Mais Simples)

**No File Manager cPanel:**

1. Clique em **Upload** (botão no topo)
2. Navegue até: `c:\Users\User\Desktop\financeiro\fidelizacred-react\dist\`
3. Selecione **TODOS os arquivos e pastas** dentro de `dist/`:
   - index.html
   - assets/ (pasta)
   - logo.jpeg
   - Qualquer outro arquivo

4. Clique em **Abrir** para enviar

**Espere a barra de progresso terminar!**

### Método B: Comprimir e Enviar (Para Arquivos Grandes)

**Na sua máquina:**

```powershell
cd c:\Users\User\Desktop\financeiro\fidelizacred-react
Compress-Archive -Path "dist/*" -DestinationPath "dist.zip" -Force
```

**No cPanel File Manager:**

1. Clique em **Upload**
2. Selecione o arquivo `dist.zip`
3. Espere upload terminar
4. Clique direito no arquivo
5. Selecione **Extract** (descompactar)
6. Delete o arquivo `dist.zip`

---

## ⚙️ Etapa 5: Configuração Crítica

### Passo 5.1: Criar Arquivo `.htaccess`

**IMPORTANTE:** Necessário para React Router funcionar!

**No File Manager cPanel:**

1. Clique em **+ File** (criar novo arquivo)
2. Nome: `.htaccess` (com ponto no início!)
3. Clique em **Create**
4. Clique no arquivo para editar
5. Cole este conteúdo:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  RewriteRule ^ /index.html [QSA,L]
</IfModule>
```

6. Clique em **Save Changes**

**Este arquivo já está no seu GitHub! Copie de lá se preferir.**

### Passo 5.2: Verificar Permissões

1. Clique em **Settings** (canto superior direito do File Manager)
2. Marque: "Show hidden files"
3. Clique em **Save**

Agora você verá arquivos começando com ponto (`.htaccess`, `.env`, etc)

---

## 🔒 Etapa 6: Configurar SSL (HTTPS)

### Passo 6.1: Ativar HTTPS

**No cPanel:**

1. Procure por **AutoSSL** ou **SSL/TLS**
2. Clique em **Issue** (se disponível)
3. Selecione seu domínio
4. Aguarde conclusão (geralmente 1-5 minutos)

**Resultado:** URL com 🔒 verde

### Passo 6.2: Redirecionar HTTP para HTTPS

1. Volte ao File Manager
2. Édite o arquivo `.htaccess`
3. Adicione no início:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  RewriteRule ^ /index.html [QSA,L]
</IfModule>
```

4. Clique em **Save Changes**

---

## ✅ Etapa 7: Testar o Site

### Passo 7.1: Acessar a URL

1. Abra: `https://seudominio.com.br`
2. Espere carregar (primeira vez leva alguns segundos)

### Passo 7.2: Verificar Se Funciona

Procure por:

- ✅ Logo aparece no canto superior esquerdo
- ✅ Menu lateral funcionando
- ✅ Páginas responsivas
- ✅ Sem erros 404 ao navegar

### Passo 7.3: Abrir Console (F12)

Pressione **F12** no navegador:

1. Vá para aba **Console**
2. Procure por erros em vermelho
3. Se houver mensagens amarelas, pode ignorar

**Se não houver erros vermelhos = Site funcionando! 🎉**

---

## 🔑 Etapa 8: Configurar Supabase (Importante!)

O site está rodando, mas precisa conectar ao banco de dados Supabase.

### Passo 8.1: Obter Credenciais Supabase

1. Acesse: https://app.supabase.com
2. Faça login com sua conta
3. Selecione seu projeto
4. Vá para **Settings** → **API**
5. Copie:
   - **Project URL** (URL do Supabase)
   - **Anon Key** (chave pública)

### Passo 8.2: Adicionar ao Site

Há duas formas:

**Forma A: Variáveis Compiladas (Já Feito)**

O build automaticamente incluiu as credenciais no arquivo JavaScript. Se vê a URL Supabase no Console, está funcionando!

**Forma B: Modificar Localmente (Se Precisar Mudar)**

Se publicar novamente:

1. Na sua máquina, edite `.env.local`
2. Atualize credenciais
3. Execute `npm run build`
4. Envie `dist/` novamente para Hostinger

---

## 🧪 Etapa 9: Testar as Funcionalidades

### Teste 1: Login

1. Vá para a página de login
2. Digite qualquer usuário/senha (funciona com qualquer valor em dev)
3. Clique em **Entrar**

Deve aparecer o Dashboard!

### Teste 2: Upload de Documentos

1. Vá para **Clientes**
2. Clique em editar um cliente
3. Vá para aba **Documentos**
4. Escolha um arquivo (PDF, JPG, PNG, DOC - máx 10MB)
5. Clique em **Enviar**

**Resultado esperado:**

- ✅ Arquivo enviado
- ✅ Mensagem de sucesso
- ✅ Arquivo aparece na lista
- ✅ Arquivo visível no Supabase Storage

### Teste 3: Outras Funcionalidades

- Criar empréstimo
- Registrar pagamento
- Acessar relatórios
- Gerar PDF

---

## 🐛 Troubleshooting

### Erro 1: Página em Branco

**Solução:**

1. Pressione F12
2. Vá para **Console**
3. Procure por erros
4. Mais comum: falta de `.htaccess`
5. Recrie o arquivo `.htaccess` (Etapa 5.1)

### Erro 2: 404 em rotas como `/clientes`, `/dashboard`

**Solução:**

1. Verifique se `.htaccess` existe
2. Conteúdo está correto (veja Etapa 5.1)
3. Limpe cache: Ctrl+Shift+R

### Erro 3: Upload falha ou não autosalva no banco

**Solução:**

1. Verifique credenciais Supabase
2. Abra Console (F12)
3. Procure por erro de conexão
4. Verifique se Supabase RLS está desabilitado
5. Verifique se bucket `documents` existe

### Erro 4: HTTPS com aviso de certificado

**Solução:**

1. Aguarde propagação de DNS (até 24h)
2. Limpe cache do navegador
3. Tente em navegador privado (Incognito)

### Erro 5: Imagens/Logos não carregam

**Solução:**

1. Verifique se arquivo existe em `public_html`
2. Caminho correto no código
3. Permissões do arquivo (755)
4. Limpe cache: Ctrl+Shift+R

---

## 📋 Checklist Final

Antes de considerar o deploy completo:

- [ ] Build gerado com `npm run build`
- [ ] Arquivos enviados para `public_html`
- [ ] `.htaccess` criado e configurado
- [ ] SSL/HTTPS ativado
- [ ] Site carrega sem erros (F12)
- [ ] Login funciona
- [ ] Upload de documentos funciona
- [ ] Navigação entre páginas funciona
- [ ] Supabase conectado e salvando dados
- [ ] Formulários salvam corretamente

---

## 📞 Dúvidas Comuns

**P: Preciso de Node.js no servidor?**
R: Não! O build (`dist/`) é HTML/CSS/JS puro. Funciona em qualquer servidor web.

**P: Posso usar GitHub para deploy automático?**
R: Sim, se seu plano suporta Git. Avançado para depois.

**P: Como atualizar o site com novos código?**
R: Execute `npm run build` localmente, envie `dist/` novamente.

**P: Cadê minha página de login?**
R: Está em `/` (raiz). Se vê branco ou 404, recrie o `.htaccess`.

**P: Como faço backup?**
R: Faça download dos arquivos via File Manager ou FTP regularmente.

---

## 🎉 Sucesso!

Se seguiu todos os passos, seu site estará ONLINE!

**Domínio:** `https://seudominio.com.br`

Para dúvidas, consulte também:

- `DEPLOYMENT_HOSTINGER.md` (versão detalhada)
- `DOCUMENTO_UPLOAD_DEBUG.md` (problemas de upload)
- Console do navegador (F12) para ver erros

---

**Próximo passo:** Publicar o GitHub na sua rede ou deixar este guia à mão para futuras atualizações! 📚
