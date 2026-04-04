# 📄 Sistema de Upload de Documentos - Versão Melhorada

## 🎯 Mudanças Implementadas

O sistema de upload de documentos foi adaptado para permitir **seleção de tipo de documento** com indicadores de **obrigatório** e **recomendado**.

## 📋 Tipos de Documentos Disponíveis

### 🔴 Obrigatórios + Recomendados
- **RG** - Registro Geral (documento de identidade)
- **CPF** - Cadastro de Pessoa Física
- **Comprovante de Renda** - Necessário para análise de crédito
- **Comprovante de Endereço** - Validação de endereço

### 🟢 Recomendados (Complementares)
- **CNH** - Carteira Nacional de Habilitação
- **Extrato Bancário** - Para análise financeira

### ⚪ Opcionais
- **Documento de Propriedade** - Para empréstimos com garantia
- **Aval** - Informações do avalista
- **Outros** - Documentos adicionais

## 🚀 Como Funciona

### 1. **Escolher Tipo de Documento**
```
No modal de Documentos, selecione o tipo no dropdown:
┌─────────────────────────────────┐
│ Tipo de Documento *             │
├─────────────────────────────────┤
│ RG (Obrigatório)                │ ← Mostra indicador
│ CPF (Obrigatório)               │
│ CNH (Recomendado)               │
│ ...                             │
└─────────────────────────────────┘
```

### 2. **Ver Indicadores**
Após selecionar o tipo, aparecem badges:
- 🔴 **Obrigatório** ← vermelho (required)
- ✓ **Recomendado** ← verde (recommended)

### 3. **Enviar Arquivo**
- Clique em "📤 Upload"
- Selecione arquivo (PDF, JPG, PNG, DOC, DOCX)
- Máximo 10MB

### 4. **Documentos Pendentes**
O sistema **automaticamente** mostra:

#### ⚠️ Documentos Obrigatórios Pendentes (Amarelo)
```
⚠️ Documentos Obrigatórios Pendentes:
• RG
• CPF
• Comprovante de Renda
• Comprovante de Endereço
```
*(Desaparece quando todos são entregues)*

#### ℹ️ Documentos Recomendados Pendentes (Verde)
```
ℹ️ Documentos Recomendados Pendentes:
• CNH
• Extrato Bancário
```
*(Informativo, não bloqueia o progresso)*

### 5. **Listar Documentos Entregues**
```
📁 Documentos Anexados (3)

📄 rg.pdf          ┌────────┐
2024-04-04 | 2.5MB│  RG    │  [🗑️ Deletar]
                   └────────┘

📄 comprovante.jpg ┌──────────────┐
2024-04-04 | 1.2MB│Comprovante RE│  [🗑️ Deletar]
                   └──────────────┘
```

## 🔧 Funcionalidades

### ✅ Feito
- [x] Seletor de tipo de documento
- [x] Indicadores visuais (Obrigatório/Recomendado)
- [x] Lista de documentos obrigatórios pendentes
- [x] Lista de documentos recomendados pendentes
- [x] Campo de tipo salvo no banco de dados
- [x] Badge com tipo na listagem
- [x] Upload de até 10MB
- [x] Validação de tipos (PDF, JPG, PNG, DOC, DOCX)
- [x] Deleção de documentos
- [x] Integração na aba "Documentos" (Tab 4)

### 🔄 Em Desenvolvimento
- [ ] Aprovação/Rejeição de documentos
- [ ] Comentários no documento
- [ ] Versioning (histórico de uploads)
- [ ] Análise automática de documentos

## 📊 Estrutura do Banco de Dados

### Tabela: `documents`
```sql
id                BIGINT PRIMARY KEY
client_id         BIGINT (FK) — Cliente associado
document_type     TEXT — Tipo (RG, CPF, etc.)
file_name         TEXT — Nome original do arquivo
file_url          TEXT — URL pública no Supabase Storage
file_size         INTEGER — Tamanho em bytes
mime_type         TEXT — Tipo MIME (application/pdf, etc.)
uploaded_at       TIMESTAMPTZ — Data de upload
employee_id       BIGINT — Funcionário que fez upload
status            TEXT — 'active', 'rejected', etc.
notes             TEXT — Observações sobre aprovação
```

### Exemplo de Registro
```json
{
  "id": 123,
  "client_id": 456,
  "document_type": "RG",
  "file_name": "rg.pdf",
  "file_url": "https://supabase.../documents/456/1712...",
  "file_size": 2560000,
  "mime_type": "application/pdf",
  "uploaded_at": "2024-04-04T10:30:00Z",
  "employee_id": 1
}
```

## 🎨 Cores e Indicadores

| Status | Cor | Significado |
|--------|-----|------------|
| 🔴 Obrigatório | #ff5252 (Vermelho) | Necessário para continuar |
| ✓ Recomendado | #4CAF50 (Verde) | Aumenta confiança na análise |
| 📋 Tipo do Doc | #e3f2fd (Azul claro) | Identificação visual |
| ⚠️ Aviso | #fff3cd (Amarelo) | Documentos faltando |
| ℹ️ Info | #e8f5e9 (Verde claro) | Sugestão de melhorias |

## 📋 Checklist do Usuário

Antes de solicitar empréstimo, verifique:

- [ ] RG enviado
- [ ] CPF enviado  
- [ ] Comprovante de Renda enviado
- [ ] Comprovante de Endereço enviado
- [ ] CNH enviado (recomendado)
- [ ] Extrato Bancário enviado (recomendado)

## 🚀 Para Começar Agora

1. Abra **Clientes → Editar Cliente**
2. Clique na aba **"4. Documentos"**
3. Selecione o tipo de documento no dropdown
4. Clique em **📤 Upload**
5. Escolha o arquivo
6. Pronto! O documento foi salvo

## 📞 Suporte

Se os documentos não aparecem:
1. Abra DevTools (F12)
2. Verifique console para erros
3. Certifique-se que o Supabase Storage bucket "documents" existe
4. Bucket deve ser PUBLIC (não privado)

---

**Status**: ✅ Pronto para produção  
**Última atualização**: 2026-04-04  
**Versão**: 2.0 (Com tipos recomendados)
