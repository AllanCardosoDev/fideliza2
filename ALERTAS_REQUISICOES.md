# Instruções para Sistema de Alertas de Requisições

## O que foi implementado

### 1. **Nova funcionalidade na Agenda.jsx**
- Adicionados 3 novos tipos de eventos de requisição:
  - **⏳ Requisições Pendentes** (loan_alert): Aparecem para Admin/Supervisor quando uma requisição é criada
  - **✅ Empréstimos Aprovados** (loan_approved): Aparecem para o funcionário que criou a requisição, quando for aprovada
  - **❌ Requisições Canceladas** (loan_rejected): Aparecem para o funcionário que criou a requisição, quando for rejeitada

### 2. **Modificações no App.jsx**
- `createLoan()`: Agora armazena `created_by` e `created_by_name` quando funcionário cria requisição
- `approveLoan()`: Agora registra `approved_at` (data/hora) e `approved_by` (ID do admin)
- `rejectLoan()`: Agora registra `rejected_at` (data/hora) e `rejected_by` (ID do admin)

### 3. **Nova Migration**
Arquivo: `migrations/2026-04-04_add_loan_approval_tracking.sql`

## Próximos passos

### 1. Executar a Migration no Supabase
1. Acesse o Supabase Console
2. Vá para SQL Editor
3. Copie e execute o conteúdo de `migrations/2026-04-04_add_loan_approval_tracking.sql`

Campos adicionados:
- `approved_at` (TIMESTAMP NULL)
- `approved_by` (UUID NULL)
- `rejected_at` (TIMESTAMP NULL)
- `rejected_by` (UUID NULL)
- `created_at` (TIMESTAMP DEFAULT NOW())

### 2. Testar o workflow

**Cenário 1: Admin vê alerta de requisição**
1. Login como funcionário
2. Criar requisição de empréstimo (status fica "pending")
3. Logout
4. Login como admin
5. Ir para Agenda
6. Filtro "Req. Pend." deve mostrar a requisição com ícone ⏳

**Cenário 2: Funcionário recebe notificação de aprovação**
1. Admin aprova a requisição em Emprestimos.jsx
2. Funcionário acessa Agenda
3. Filtro "Aprovados" deve mostrar a aprovação com ícone ✅
4. Data deve ser a data de aprovação (hoje)

**Cenário 3: Funcionário recebe notificação de rejeição**
1. Admin rejeita a requisição em Emprestimos.jsx
2. Funcionário acessa Agenda
3. Filtro "Cancelados" deve mostrar a rejeição com ícone ❌
4. Descrição mostra o motivo da rejeição

## Visualização

Todos os eventos aparecem na Agenda com:
- Data do evento (criação, aprovação ou rejeição)
- Ícone representativo (⏳ ✅ ❌)
- Nome do cliente
- Valor da requisição
- Motivo (para rejeitados)
- Link para ir direto a Emprestimos

Os eventos podem ser filtrados usando os botões na Agenda:
- "Req. Pend." - Requisições aguardando aprovação
- "Aprovados" - Requisições aprovadas (apenas para criador e admins)
- "Cancelados" - Requisições rejeitadas (apenas para criador e admins)
