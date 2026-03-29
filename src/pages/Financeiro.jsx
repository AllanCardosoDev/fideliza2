// src/pages/Financeiro.jsx
import React, { useContext, useState, useMemo } from "react";
import { AppContext } from "../App";
import { fmt, fmtDate } from "../utils/helpers";

const TYPE_OPTS = [
  { value: "", label: "Todos" },
  { value: "income", label: "Receitas" },
  { value: "expense", label: "Despesas" },
];

const CATEGORIES_INCOME = ["Empréstimo", "Parcela", "Juros", "Outros"];
const CATEGORIES_EXPENSE = ["Operacional", "Salário", "Aluguel", "Marketing", "Outros"];

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

  const categories = form.type === "income" ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;

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
        {errors.description && <span className="field-error">{errors.description}</span>}
      </div>
      <div className="form-row-2">
        <div className="form-row">
          <label>Tipo</label>
          <select value={form.type} onChange={(e) => { set("type", e.target.value); set("category", ""); }}>
            <option value="income">Receita</option>
            <option value="expense">Despesa</option>
          </select>
        </div>
        <div className="form-row">
          <label>Categoria</label>
          <select value={form.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">Selecione...</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
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
          {errors.amount && <span className="field-error">{errors.amount}</span>}
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
        <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-gold btn-sm" disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

function Financeiro() {
  const {
    transactions, openModal, closeModal,
    createTransactionRecord, removeTransactionRecord,
  } = useContext(AppContext);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch = [t.description, t.category, String(t.amount)]
        .join(" ").toLowerCase().includes(search.toLowerCase());
      const matchType = filterType ? t.type === filterType : true;
      return matchSearch && matchType;
    });
  }, [transactions, search, filterType]);

  const totalEntradas = useMemo(
    () => transactions.filter((t) => t.type === "income").reduce((s, t) => s + (Number(t.amount) || 0), 0),
    [transactions]
  );
  const totalSaidas = useMemo(
    () => transactions.filter((t) => t.type === "expense").reduce((s, t) => s + (Number(t.amount) || 0), 0),
    [transactions]
  );
  const saldo = totalEntradas - totalSaidas;

  const handleAdd = () => {
    openModal(
      "Nova Transação",
      <TransactionForm
        onSave={async (form) => {
          setIsSaving(true);
          try {
            await createTransactionRecord(form);
            closeModal();
          } catch { /* handled */ } finally {
            setIsSaving(false);
          }
        }}
        onCancel={closeModal}
        isSaving={isSaving}
      />
    );
  };

  const handleDelete = (tx) => {
    openModal(
      "Confirmar Exclusão",
      <div className="modal-confirm">
        <p>Excluir transação <strong>&ldquo;{tx.description}&rdquo;</strong>?</p>
        <p className="text-dim">Esta ação não pode ser desfeita.</p>
        <div className="form-actions">
          <button className="btn btn-outline btn-sm" onClick={closeModal}>Cancelar</button>
          <button
            className="btn btn-danger btn-sm"
            disabled={deletingId === tx.id}
            onClick={async () => {
              setDeletingId(tx.id);
              try {
                await removeTransactionRecord(tx.id);
                closeModal();
              } catch { /* handled */ } finally {
                setDeletingId(null);
              }
            }}
          >
            {deletingId === tx.id ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Financeiro</h2>
          <p className="page-desc">Controle de receitas e despesas</p>
        </div>
        <div className="header-actions">
          <button onClick={handleAdd} className="btn btn-gold btn-sm">
            + Nova Transação
          </button>
        </div>
      </div>

      <div className="kpi-grid kpi-grid-3">
        <div className="kpi-card kpi-revenue">
          <div className="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Saídas</span>
            <span className="kpi-value">{fmt(totalSaidas)}</span>
          </div>
        </div>
        <div className={`kpi-card ${saldo >= 0 ? "kpi-profit" : "kpi-expense"}`}>
          <div className="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Saldo</span>
            <span className="kpi-value" style={{ color: saldo >= 0 ? "var(--green)" : "var(--red)" }}>
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
              <option key={o.value} value={o.value}>{o.label}</option>
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
              {filtered.length > 0 ? (
                filtered.map((tx) => (
                  <tr key={tx.id}>
                    <td>{fmtDate(tx.date)}</td>
                    <td>{tx.description}</td>
                    <td>{tx.category || "Geral"}</td>
                    <td>
                      <span className={`status ${tx.type === "income" ? "status-active" : "status-inactive"}`}>
                        {tx.type === "income" ? "Receita" : "Despesa"}
                      </span>
                    </td>
                    <td className={tx.type === "income" ? "tx-income" : "tx-expense"}>
                      {tx.type === "income" ? "+" : "−"} {fmt(Math.abs(tx.amount))}
                    </td>
                    <td>
                      <button
                        className="btn-icon"
                        title="Excluir"
                        onClick={() => handleDelete(tx)}
                      >🗑️</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "var(--text-dim)" }}>
                    {search || filterType ? "Nenhuma transação encontrada." : "Nenhuma transação registrada."}
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
