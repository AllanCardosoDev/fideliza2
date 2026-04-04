// src/pages/Financeiro.jsx
import React, { useContext, useState, useMemo, useEffect } from "react";
import { AppContext } from "../App";
import { fmt, fmtDate, calcPMT, getClientName } from "../utils/helpers";

const TYPE_OPTS = [
  { value: "", label: "Todos" },
  { value: "income", label: "Receitas" },
  { value: "expense", label: "Despesas" },
];

const CATEGORIES_INCOME = ["Empréstimo", "Parcela", "Juros", "Outros"];
const CATEGORIES_EXPENSE = [
  "Operacional",
  "Salário",
  "Aluguel",
  "Marketing",
  "Outros",
];

const EMPTY_TX = {
  description: "",
  category: "",
  type: "income",
  amount: "",
  date: new Date().toISOString().split("T")[0],
};

function TransactionForm({ initial, onSave, onCancel, isSaving }) {
  const [form, setForm] = useState(initial || EMPTY_TX);
  const [errors, setErrors] = useState({});

  const set = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const categories =
    form.type === "income" ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;

  const validate = () => {
    const e = {};
    if (!form.description.trim()) e.description = "Descrição é obrigatória.";
    if (!form.amount || parseFloat(String(form.amount).replace(",", ".")) <= 0)
      e.amount = "Valor deve ser maior que zero.";
    if (!form.date) e.date = "Data é obrigatória.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...form,
      amount: parseFloat(String(form.amount).replace(",", ".")) || 0,
    });
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>Descrição *</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Descrição da transação"
          className={errors.description ? "input-error" : ""}
        />
        {errors.description && (
          <span className="field-error">{errors.description}</span>
        )}
      </div>
      <div className="form-row-2">
        <div className="form-row">
          <label>Tipo</label>
          <select
            value={form.type}
            onChange={(e) => {
              set("type", e.target.value);
              set("category", "");
            }}
          >
            <option value="income">Receita</option>
            <option value="expense">Despesa</option>
          </select>
        </div>
        <div className="form-row">
          <label>Categoria</label>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          >
            <option value="">Selecione...</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-row-2">
        <div className="form-row">
          <label>Valor *</label>
          <input
            type="text"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            placeholder="0,00"
            className={errors.amount ? "input-error" : ""}
          />
          {errors.amount && (
            <span className="field-error">{errors.amount}</span>
          )}
        </div>
        <div className="form-row">
          <label>Data *</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            className={errors.date ? "input-error" : ""}
          />
          {errors.date && <span className="field-error">{errors.date}</span>}
        </div>
      </div>
      <div className="form-actions">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-gold btn-sm"
          disabled={isSaving}
        >
          {isSaving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

function Financeiro() {
  const {
    transactions,
    loans,
    clients,
    reloadLoans,
    openModal,
    closeModal,
    createTransactionRecord,
    removeTransactionRecord,
    caixa,
    saveCaixa,
    currentUser,
    userRole,
  } = useContext(AppContext);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Reload loans on mount to ensure fresh data
  useEffect(() => {
    if (reloadLoans) {
      reloadLoans();
    }
  }, [reloadLoans]);

  // Access Control: Employees see only their own loans
  const accessibleLoans = useMemo(() => {
    if (userRole === "employee" && currentUser?.id && clients) {
      const myClientIds = clients
        .filter(c => c.created_by === currentUser.id || c.owner_id === currentUser.id)
        .map(c => c.id);
      return loans.filter(l => myClientIds.includes(l.client_id));
    }
    return loans;
  }, [loans, clients, currentUser, userRole]);

  // Generate all installments (same logic as Cobranças)
  const allInstallments = useMemo(() => {
    const items = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    accessibleLoans.forEach((loan) => {
      if (!loan.start_date) return;
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
        } else if (due < today) {
          status = "overdue";
        } else {
          status = "due";
        }

        items.push({
          id: `${loan.id}-${i}`,
          loanId: loan.id,
          client: getClientName(loan.client),
          installmentNo: i,
          totalInstallments: n,
          dueDate,
          due,
          amount: pmt,
          status,
        });
      }
    });
    return items;
  }, [accessibleLoans]);

  // Get paid installments for display as income
  const paidInstallments = useMemo(() => {
    return allInstallments.filter((i) => i.status === "paid");
  }, [allInstallments]);

  // Combine all financial data: transactions + loans (as expenses) + payments (as income)
  const displayData = useMemo(() => {
    let combined = [];

    // 1. Add manual transactions
    combined = combined.concat(
      transactions.map((t) => ({
        ...t,
        source: "transaction",
      })),
    );

    // 2. Add loans as expenses (when approved)
    combined = combined.concat(
      accessibleLoans
        .filter(
          (l) =>
            l.status === "active" ||
            l.status === "overdue" ||
            l.status === "paid",
        )
        .map((l) => ({
          id: `loan-${l.id}`,
          date: l.start_date,
          description: `Empréstimo aprovado - ${getClientName(l.client)}`,
          category: "Empréstimo",
          type: "expense",
          amount: Number(l.value) || 0,
          source: "loan",
          loanId: l.id,
        })),
    );

    // 3. Add paid installments as income (from Cobranças logic)
    combined = combined.concat(
      paidInstallments.map((inst) => ({
        id: `installment-${inst.id}`,
        date: inst.dueDate,
        description: `Parcela ${inst.installmentNo}/${inst.totalInstallments} - ${inst.client}`,
        category: "Parcela",
        type: "income",
        amount: inst.amount,
        source: "installment",
        installmentId: inst.id,
      })),
    );

    console.log("[Financeiro displayData]", {
      paidInstallments_count: paidInstallments.length,
      transactions_count: transactions.length,
      loans_count: loans.filter(
        (l) =>
          l.status === "active" ||
          l.status === "overdue" ||
          l.status === "paid",
      ).length,
      combined_count: combined.length,
      paidInstallments_samples: paidInstallments.slice(0, 2),
    });

    // Sort by date descending
    return combined.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, accessibleLoans, paidInstallments]);

  // Filter display data
  const filteredDisplay = useMemo(() => {
    return displayData.filter((t) => {
      const matchSearch = [t.description, t.category, String(t.amount)]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchType = filterType ? t.type === filterType : true;
      return matchSearch && matchType;
    });
  }, [displayData, search, filterType]);

  // Recalculate totals from combined data
  const totalEntradas = useMemo(
    () =>
      displayData
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + (Number(t.amount) || 0), 0),
    [displayData],
  );
  const totalSaidas = useMemo(
    () =>
      displayData
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + (Number(t.amount) || 0), 0),
    [displayData],
  );
  const saldo = totalEntradas - totalSaidas;

  // Calculate CAIXA (Cash Flow) - Updated with combined data
  const caixaAmount = useMemo(() => {
    const initialCaixa = 1000000; // Starting balance
    // Now totalEntradas and totalSaidas already include loans and payments
    const calculated = initialCaixa + (totalEntradas - totalSaidas);
    console.log("[Financeiro] CAIXA ATUALIZADO:", {
      inicial: initialCaixa,
      entradas_total: totalEntradas,
      saidas_total: totalSaidas,
      saldo: totalEntradas - totalSaidas,
      caixaDisponivel: Math.max(0, calculated),
    });
    return Math.max(0, calculated);
  }, [totalEntradas, totalSaidas]);

  const handleAdd = () => {
    openModal(
      "Nova Transação",
      <TransactionForm
        onSave={async (form) => {
          setIsSaving(true);
          try {
            await createTransactionRecord(form);
            closeModal();
          } catch {
            /* handled */
          } finally {
            setIsSaving(false);
          }
        }}
        onCancel={closeModal}
        isSaving={isSaving}
      />,
    );
  };

  const handleDelete = (tx) => {
    openModal(
      "Confirmar Exclusão",
      <div className="modal-confirm">
        <p>
          Excluir transação <strong>&ldquo;{tx.description}&rdquo;</strong>?
        </p>
        <p className="text-dim">Esta ação não pode ser desfeita.</p>
        <div className="form-actions">
          <button className="btn btn-outline btn-sm" onClick={closeModal}>
            Cancelar
          </button>
          <button
            className="btn btn-danger btn-sm"
            disabled={deletingId === tx.id}
            onClick={async () => {
              setDeletingId(tx.id);
              try {
                await removeTransactionRecord(tx.id);
                closeModal();
              } catch {
                /* handled */
              } finally {
                setDeletingId(null);
              }
            }}
          >
            {deletingId === tx.id ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>,
    );
  };

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Financeiro</h2>
          <p className="page-desc">Controle de receitas, despesas e caixa</p>
        </div>
        <div className="header-actions">
          <button onClick={handleAdd} className="btn btn-gold btn-sm">
            + Nova Transação
          </button>
        </div>
      </div>

      {/* CAIXA DISPLAY */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
            padding: 24,
            borderRadius: "var(--radius)",
            color: "white",
            boxShadow: "0 8px 25px rgba(30, 60, 114, 0.35)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontSize: "0.9rem",
                opacity: 0.9,
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              💰 CAIXA DISPONÍVEL
            </p>
            <h1
              style={{
                fontSize: "2.8rem",
                fontWeight: "bold",
                margin: "8px 0",
                letterSpacing: "-1px",
              }}
            >
              {fmt(caixaAmount)}
            </h1>
            <p
              style={{
                fontSize: "0.85rem",
                opacity: 0.85,
                marginTop: 12,
                fontWeight: 500,
              }}
            >
              Capital disponível para operações
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 16,
                marginTop: 16,
                paddingTop: 16,
                borderTop: "1px solid rgba(255,255,255,0.2)",
                fontSize: "0.85rem",
              }}
            >
              <div>
                <span style={{ opacity: 0.85 }}>Inicial</span>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    marginTop: 4,
                  }}
                >
                  {fmt(1000000)}
                </div>
              </div>
              <div>
                <span style={{ opacity: 0.85 }}>Empréstimos</span>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    marginTop: 4,
                    color: "#ffb3ba",
                  }}
                >
                  −
                  {fmt(
                    displayData
                      .filter(
                        (t) => t.type === "expense" && t.source === "loan",
                      )
                      .reduce((s, t) => s + (Number(t.amount) || 0), 0),
                  )}
                </div>
              </div>
              <div>
                <span style={{ opacity: 0.85 }}>Recebido</span>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    marginTop: 4,
                    color: "#b3e5fc",
                  }}
                >
                  +
                  {fmt(
                    displayData
                      .filter(
                        (t) => t.type === "income" && t.source === "payment",
                      )
                      .reduce((s, t) => s + (Number(t.amount) || 0), 0),
                  )}
                </div>
              </div>
              <div>
                <span style={{ opacity: 0.85 }}>Saldo Tx</span>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    marginTop: 4,
                    color: "#b3e5fc",
                  }}
                >
                  +{fmt(saldo)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="kpi-grid kpi-grid-3">
        <div className="kpi-card kpi-revenue">
          <div className="kpi-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Entradas</span>
            <span className="kpi-value">{fmt(totalEntradas)}</span>
          </div>
        </div>
        <div className="kpi-card kpi-expense">
          <div className="kpi-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Saídas</span>
            <span className="kpi-value">{fmt(totalSaidas)}</span>
          </div>
        </div>
        <div
          className={`kpi-card ${saldo >= 0 ? "kpi-profit" : "kpi-expense"}`}
        >
          <div className="kpi-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Saldo</span>
            <span
              className="kpi-value"
              style={{ color: saldo >= 0 ? "var(--green)" : "var(--red)" }}
            >
              {fmt(saldo)}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="🔍  Buscar transação..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select-sm"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            {TYPE_OPTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredDisplay.length > 0 ? (
                filteredDisplay.map((tx) => (
                  <tr key={tx.id}>
                    <td>{fmtDate(tx.date)}</td>
                    <td>{tx.description}</td>
                    <td>{tx.category || "Geral"}</td>
                    <td>
                      <span
                        className={`status ${tx.type === "income" ? "status-active" : "status-inactive"}`}
                      >
                        {tx.type === "income" ? "Receita" : "Despesa"}
                      </span>
                    </td>
                    <td
                      className={
                        tx.type === "income" ? "tx-income" : "tx-expense"
                      }
                    >
                      {tx.type === "income" ? "+" : "−"}{" "}
                      {fmt(Math.abs(tx.amount))}
                    </td>
                    <td>
                      {/* Only allow deletion of manual transactions */}
                      {tx.source === "transaction" && (
                        <button
                          className="btn-icon"
                          title="Excluir"
                          onClick={() => handleDelete(tx)}
                        >
                          🗑️
                        </button>
                      )}
                      {tx.source !== "transaction" && (
                        <span title="Automático" style={{ opacity: 0.5 }}>
                          🔒
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "var(--text-dim)",
                    }}
                  >
                    {search || filterType
                      ? "Nenhuma transação encontrada."
                      : "Nenhuma transação registrada."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Financeiro;
