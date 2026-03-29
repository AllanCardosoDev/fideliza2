// src/utils/helpers.js

export const fmt = (v) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("pt-BR");
};

export const statusLabel = (s) => {
  return (
    {
      active: "Ativo",
      pending: "Pendente",
      inactive: "Inativo",
      overdue: "Inadimplente",
      paid: "Pago",
      late: "Atrasado",
      completed: "Concluída",
      available: "Disponível",
      reserved: "Reservado",
      sold: "Vendido",
      vacation: "Férias",
      renegotiated: "Renegociado",
      cancelled: "Cancelado",
    }[s] || s
  );
};

// ── CPF / CNPJ helpers ────────────────────────────────────────────────────────

export const maskCPF = (v) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

export const maskCNPJ = (v) => {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
};

export const maskCpfCnpj = (v) => {
  const digits = v.replace(/\D/g, "");
  if (digits.length <= 11) return maskCPF(v);
  return maskCNPJ(v);
};

export const maskPhone = (v) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  }
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
};

export const validateCPF = (cpf) => {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(d[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(d[10]);
};

export const validateCNPJ = (cnpj) => {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calcDigit = (base) => {
    let n = base.length + 1;
    let sum = 0;
    let pos = n - 7;
    for (let i = base.length; i >= 1; i--) {
      sum += parseInt(base[base.length - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    return sum % 11 < 2 ? 0 : 11 - (sum % 11);
  };
  return (
    calcDigit(d.slice(0, 12)) === parseInt(d[12]) &&
    calcDigit(d.slice(0, 13)) === parseInt(d[13])
  );
};

export const validateCpfCnpj = (v) => {
  const d = v.replace(/\D/g, "");
  if (d.length === 11) return validateCPF(v);
  if (d.length === 14) return validateCNPJ(v);
  return false;
};

// ── Interest / loan calculation helpers ──────────────────────────────────────

/**
 * Returns the monthly payment amount (PMT) using Price table (compound interest).
 * @param {number} principal  - loan amount
 * @param {number} rate       - monthly interest rate (e.g. 0.05 = 5%)
 * @param {number} n          - number of installments
 */
export const calcPMT = (principal, rate, n) => {
  if (!principal || !n) return 0;
  if (rate === 0) return principal / n;
  return (principal * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
};

/**
 * Builds a Price amortization table.
 * Returns array of { installment, dueDate, payment, interest, amortization, balance }
 */
export const buildAmortizationTable = (principal, rate, n, startDate) => {
  const pmt = calcPMT(principal, rate, n);
  let balance = principal;
  const rows = [];
  const start = startDate ? new Date(startDate + "T00:00:00") : new Date();

  for (let i = 1; i <= n; i++) {
    const interest = balance * rate;
    const amort = pmt - interest;
    balance -= amort;

    const due = new Date(start);
    due.setMonth(due.getMonth() + i);

    rows.push({
      installment: i,
      dueDate: due.toISOString().split("T")[0],
      payment: pmt,
      interest,
      amortization: amort,
      balance: Math.max(balance, 0),
    });
  }
  return rows;
};
