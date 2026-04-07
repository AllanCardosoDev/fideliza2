import { calcPMT, getClientName } from "./helpers";

// Unified Installments Builder
export function buildInstallments(loans, today = new Date()) {
  const items = [];
  const todayAtMidnight = new Date(today);
  todayAtMidnight.setHours(0, 0, 0, 0);

  loans.forEach((loan) => {
    if (
      !loan.start_date ||
      loan.status === "cancelled" ||
      loan.status === "pending"
    )
      return;
    const v = Number(loan.value) || 0;
    const rate = (Number(loan.interest_rate) || 0) / 100;
    const n = Number(loan.installments) || 0;
    const paid = Number(loan.paid) || 0;
    if (!v || !n) return;

    const pmt = calcPMT(v, rate, n);
    const start = new Date(loan.start_date + "T00:00:00");

    for (let i = 1; i <= n; i++) {
      const due = new Date(start);
      due.setMonth(due.getMonth() + (i - 1));
      const dueDate = due.toISOString().split("T")[0];

      let status;
      if (i <= paid) {
        status = "paid";
      } else if (due < todayAtMidnight) {
        status = "overdue";
      } else {
        status = "due";
      }

      items.push({
        id: `${loan.id}-${i}`,
        loanId: loan.id,
        clientId: loan.client_id,
        client: getClientName(loan.client),
        loanStatus: loan.status,
        installmentNo: i,
        totalInstallments: n,
        dueDate,
        due,
        amount: pmt,
        status,
        loanPaid: paid,
      });
    }
  });
  return items.sort((a, b) => a.due - b.due);
}

export function calculateGlobalKPIs(
  loans,
  transactions,
  caixaInicial = 0,
  today = new Date(),
) {
  // Validação defensiva
  if (!Array.isArray(loans)) {
    console.warn("[calculateGlobalKPIs] loans is not an array:", loans);
    loans = [];
  }
  if (!Array.isArray(transactions)) {
    console.warn(
      "[calculateGlobalKPIs] transactions is not an array:",
      transactions,
    );
    transactions = [];
  }

  // Apenas empréstimos validados (ativos, inadimplentes, pagos)
  const validLoans = loans.filter(
    (l) =>
      l.status === "active" || l.status === "overdue" || l.status === "paid",
  );

  const allInstallments = buildInstallments(validLoans, today);

  const txIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const txExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);

  const paidInstallments = allInstallments.filter((i) => i.status === "paid");
  const installmentIncome = paidInstallments.reduce(
    (sum, i) => sum + i.amount,
    0,
  );

  // Total Emprestado (Capital Liberado): soma dos valores dos empréstimos validados
  const totalEmprestado = validLoans.reduce(
    (sum, loan) => sum + (Number(loan.value) || 0),
    0,
  );

  // Total Recebido: parcelas pagas + transações de receita (manual)
  const totalRecebido = installmentIncome + txIncome;

  // Caixa Disponível: Inicial + Entradas - Saídas
  const totalSaidas = totalEmprestado + txExpense;
  const caixaDisponivel = Math.max(
    0,
    caixaInicial + totalRecebido - totalSaidas,
  );

  // A Vencer
  const dueInstallments = allInstallments.filter((i) => i.status === "due");
  const dueAmount = dueInstallments.reduce((sum, i) => sum + i.amount, 0);

  // Em Atraso
  const overdueInstallments = allInstallments.filter(
    (i) => i.status === "overdue",
  );
  const overdueAmount = overdueInstallments.reduce(
    (sum, i) => sum + i.amount,
    0,
  );

  // Total A Receber: Tudo que ainda será pago (vencido + a vencer)
  const totalAReceber = dueAmount + overdueAmount;

  // === NOVOS KPIs ===

  // NOVO: Calcular juros recebidos por empréstimo
  const interestAnalysis = validLoans.map((loan) => {
    const rate = (Number(loan.interest_rate) || 0) / 100;
    const n = Number(loan.installments) || 0;
    const paid = Number(loan.paid) || 0;
    const principal = Number(loan.value) || 0;

    if (n === 0 || principal === 0)
      return { principal: 0, interestReceived: 0 };

    const pmt = calcPMT(principal, rate, n);
    const principalPerInstallment = principal / n;
    const totalPaymentReceived = pmt * paid;
    const principalReceived = principalPerInstallment * paid;
    const interestReceived = Math.max(
      0,
      totalPaymentReceived - principalReceived,
    );

    return { principal, interestReceived, paid };
  });

  const totalInterestReceived = interestAnalysis.reduce(
    (sum, item) => sum + item.interestReceived,
    0,
  );
  const totalPrincipalReceived = interestAnalysis.reduce(
    (sum, item) =>
      sum +
      ((item.principal * item.paid) /
        validLoans.find((l) => l.value === item.principal)?.installments || 1),
    0,
  );

  // Taxa de Recebimento: % de parcelas pagas
  const allInstallmentsCount = allInstallments.length;
  const paidCount = paidInstallments.length;
  const recoveryRate =
    allInstallmentsCount > 0 ? (paidCount / allInstallmentsCount) * 100 : 0;

  // Lucratividade REALISTA: (Juros Recebidos) - (Despesas Operacionais)
  // Não deduz Principal porque é a volta do capital (não é custo)
  const realGrossProfit = totalInterestReceived - txExpense;
  const realProfitMargin =
    totalEmprestado > 0 ? (realGrossProfit / totalEmprestado) * 100 : 0;

  // Concentração de Carteira: % do Top 3 clientes no Total Emprestado
  const loansByClient = {};
  validLoans.forEach((loan) => {
    const clientName = loan.client?.name || "Desconhecido";
    loansByClient[clientName] =
      (loansByClient[clientName] || 0) + (Number(loan.value) || 0);
  });
  const topClients = Object.values(loansByClient)
    .sort((a, b) => b - a)
    .slice(0, 3);
  const concentrationTop3 = topClients.reduce((s, v) => s + v, 0);
  const carrickConcentration =
    totalEmprestado > 0 ? (concentrationTop3 / totalEmprestado) * 100 : 0;

  // ========== SCORE DE SAÚDE FINANCEIRA ==========
  // Fórmula ponderada combinando 4 indicadores principais
  // Escala: 0-100, onde 75+ = Excelente, 50-74 = Normal, 25-49 = Atenção, <25 = Crítico

  // 1. Taxa de Recebimento (40%) - Normal: 70-85%
  const recoveryScore = Math.min(100, (recoveryRate / 85) * 100);

  // 2. Diversificação (30%) - Saudável: <50%, menos de 50% em top 3
  const diversificationScore = Math.max(0, 100 - carrickConcentration);

  // 3. Margem de Lucro (20%) - Saudável: 10-20%
  const profitScore = Math.min(100, (Math.abs(realProfitMargin) / 20) * 100);

  // 4. Saúde de Caixa (10%) - Ter saldo > 10% do emprestado
  const cashHealthRatio =
    totalEmprestado > 0 ? (caixaDisponivel / totalEmprestado) * 100 : 0;
  const cashScore = Math.min(100, Math.max(0, (cashHealthRatio / 20) * 100));

  // Score agregado (ponderado)
  const healthScore = Math.round(
    recoveryScore * 0.4 +
      diversificationScore * 0.3 +
      profitScore * 0.2 +
      cashScore * 0.1,
  );

  // Status do Score
  let healthStatus = "crítico";
  let healthColor = "#d32f2f"; // vermelho
  if (healthScore >= 75) {
    healthStatus = "excelente";
    healthColor = "#388e3c"; // verde
  } else if (healthScore >= 50) {
    healthStatus = "normal";
    healthColor = "#f57c00"; // laranja
  } else if (healthScore >= 25) {
    healthStatus = "atenção";
    healthColor = "#f9a825"; // amarelo
  }

  return {
    totalEmprestado,
    totalRecebido, // Parcelas + Receita Manual
    recebidoEmprestimos: installmentIncome, // Só de Empréstimos
    totalInterestReceived, // 🆕 Juros puros recebidos
    totalPrincipalReceived, // 🆕 Principal devolvido
    caixaDisponivel,
    totalAReceber,
    totalEmAtraso: overdueAmount,
    aVencerAmount: dueAmount,
    activeLoansCount: validLoans.filter(
      (l) => l.status === "active" || l.status === "overdue",
    ).length,
    overdueCount: overdueInstallments.length,
    dueCount: dueInstallments.length,
    paidCount: paidInstallments.length,
    totalSaidas, // Empréstimos + Despesa Manual
    allInstallments,
    // KPIs Tradicionais
    recoveryRate, // Taxa de Recebimento (%)
    grossProfit: realGrossProfit, // 🆕 Lucro real = Juros - Despesas
    profitMargin: realProfitMargin, // 🆕 Margem realista (Juros/Capital)
    carrickConcentration, // Concentração Top 3 (%)
    txIncome, // Total de receita manual
    txExpense, // Total de despesa manual
    // 🆕 SCORE DE SAÚDE
    healthScore,
    healthStatus,
    healthColor,
    recoveryScore,
    diversificationScore,
    profitScore,
    cashScore,
  };
}
