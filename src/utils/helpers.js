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

export const getClientName = (clientName) => {
  return (clientName && clientName.trim()) || "Cliente sem nome";
};

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
  // Apenas verifica se tem 14 dígitos e não é sequência repetida
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  return true; // Aceita se tem 14 dígitos válidos
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
  return (
    (principal * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1)
  );
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
    due.setMonth(due.getMonth() + (i - 1));

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

// ── CNPJ / CEP Data Lookup ─────────────────────────────────────────────────────

/**
 * Busca dados do CNPJ via ReceitaAPI
 * Retorna: { name, cnpj, address_parts: { street, number, complement, neighborhood, city, state, cep } }
 */
export const fetchCNPJData = async (cnpjDigits) => {
  try {
    const digits = cnpjDigits.replace(/\D/g, "");
    if (digits.length !== 14) return null;

    const response = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${digits}`
    );
    if (!response.ok) return null;

    const data = await response.json();

    let phone = data.ddd_telefone_1 || data.ddd_telefone_2 || "";
    phone = phone.replace(/\D/g, "");

    // Optionally combine street prefix if logradouro doesn't have it
    const streetPrefix = data.descricao_tipo_de_logradouro ? data.descricao_tipo_de_logradouro + " " : "";
    let street = data.logradouro || "";
    // Avoid "RUA RUA X"
    if (streetPrefix && street && !street.toUpperCase().startsWith(streetPrefix.trim().toUpperCase())) {
      street = streetPrefix + street;
    }

    return {
      name: data.razao_social || data.nome_fantasia || "",
      cnpj: maskCNPJ(data.cnpj || digits),
      address_parts: {
        street: street,
        number: data.numero || "",
        complement: data.complemento || "",
        neighborhood: data.bairro || "",
        city: data.municipio || "",
        state: data.uf || "",
        cep: data.cep ? data.cep.replace(/\D/g, "") : "",
      },
      phone: phone,
    };
  } catch (err) {
    console.error("Erro ao buscar CNPJ:", err);
    return null;
  }
};

/**
 * Busca dados do CEP via ViaCEP
 * Retorna: { street, number, complement, neighborhood, city, state }
 */
export const fetchCEPData = async (cepDigits) => {
  try {
    const digits = cepDigits.replace(/\D/g, "");
    if (digits.length !== 8) return null;

    const response = await fetch(
      `https://viacep.com.br/ws/${digits}/json/`
    );
    if (!response.ok) return null;

    const data = await response.json();
    if (data.erro) return null;

    return {
      street: data.logradouro || "",
      neighborhood: data.bairro || "",
      city: data.localidade || "",
      state: data.uf || "",
      complement: data.complemento || "",
    };
  } catch (err) {
    console.error("Erro ao buscar CEP:", err);
    return null;
  }
};
