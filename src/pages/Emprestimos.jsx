// src/pages/Emprestimos.jsx
import React, { useContext, useState, useMemo } from "react";
import { AppContext } from "../App";
import { fmt, fmtDate, calcPMT, buildAmortizationTable } from "../utils/helpers";

const STATUS_OPTS = [
  { value: "", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "overdue", label: "Atrasados" },
  { value: "paid", label: "Pagos" },
  { value: "renegotiated", label: "Renegociados" },
  { value: "cancelled", label: "Cancelados" },
];

const STATUS_MAP = {
  active: { label: "Ativo", cls: "status-active" },
  overdue: { label: "Atrasado", cls: "status-overdue" },
  paid: { label: "Pago", cls: "status-paid" },
  renegotiated: { label: "Renegociado", cls: "status-pending" },
  cancelled: { label: "Cancelado", cls: "status-inactive" },
  pending: { label: "Pendente", cls: "status-pending" },
};

const EMPTY_LOAN = {
  client_id: "",
  client: "",
  value: "",
  interest_rate: "",
  interest_type: "compound",
  installments: "",
  paid: "0",
  start_date: "",
  status: "active",
  notes: "",
};

function LoanForm({ initial, clients, settings, onSave, onCancel, isSaving }) {
  const [form, setForm] = useState(initial || { ...EMPTY_LOAN, interest_rate: settings?.defaultInterestRate || 5 });
  const [errors, setErrors] = useState({});

  const set = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const pmt = useMemo(() => {
    const v = parseFloat(String(form.value).replace(",", ".")) || 0;
    const r = (parseFloat(form.interest_rate) || 0) / 100;
    const n = parseInt(form.installments) || 0;
    if (!v || !n) return 0;
    if (form.interest_type === "compound") return calcPMT(v, r, n);
    return v * (1 + r * n) / n;
  }, [form.value, form.interest_rate, form.installments, form.interest_type]);

  const totalAmount = useMemo(() => {
    return pmt * (parseInt(form.installments) || 0);
  }, [pmt, form.installments]);

  const validate = () => {
    const e = {};
    if (!form.client && !form.client_id) e.client = "Selecione ou informe o cliente.";
    if (!form.value || parseFloat(String(form.value).replace(",", ".")) <= 0)
      e.value = "Valor deve ser maior que zero.";
    if (!form.interest_rate && form.interest_rate !== 0)
      e.interest_rate = "Informe a taxa de juros.";
    if (!form.installments || parseInt(form.installments) < 1)
      e.installments = "Informe o número de parcelas.";
    if (!form.start_date) e.start_date = "Informe a data de início.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const clientObj = clients.find((c) => c.id === parseInt(form.client_id));
    onSave({
      ...form,
      client: clientObj ? clientObj.name : form.client,
      client_id: clientObj ? clientObj.id : (form.client_id || null),
      value: parseFloat(String(form.value).replace(",", ".")) || 0,
      interest_rate: parseFloat(form.interest_rate) || 0,
      installments: parseInt(form.installments) || 0,
      paid: parseInt(form.paid) || 0,
    });
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>Cliente *</label>
        {clients.length > 0 ? (
          <select
            value={form.client_id || ""}
            onChange={(e) => {
              const id = e.target.value;
              const c = clients.find((cl) => cl.id === parseInt(id));
              set("client_id", id);
              if (c) set("client", c.name);
            }}
            className={errors.client ? "input-error" : ""}
          >
            <option value="">Selecione um cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={form.client}
            onChange={(e) => set("client", e.target.value)}
            placeholder="Nome do cliente"
            className={errors.client ? "input-error" : ""}
          />
        )}
        {errors.client && <span className="field-error">{errors.client}</span>}
      </div>

      <div className="form-row-2">
        <div className="form-row">
          <label>Valor Principal *</label>
          <input
            type="text"
            value={form.value}
            onChange={(e) => set("value", e.target.value)}
            placeholder="0,00"
            className={errors.value ? "input-error" : ""}
          />
          {errors.value && <span className="field-error">{errors.value}</span>}
        </div>
        <div className="form-row">
          <label>Data de Início *</label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => set("start_date", e.target.value)}
            className={errors.start_date ? "input-error" : ""}
          />
          {errors.start_date && <span className="field-error">{errors.start_date}</span>}
        </div>
      </div>

      <div className="form-row-2">
        <div className="form-row">
          <label>Taxa de Juros (% a.m.) *</label>
          <input
            type="number"
            value={form.interest_rate}
            onChange={(e) => set("interest_rate", e.target.value)}
            placeholder="5.0"
            min="0"
            step="0.01"
            className={errors.interest_rate ? "input-error" : ""}
          />
          {errors.interest_rate && <span className="field-error">{errors.interest_rate}</span>}
        </div>
        <div className="form-row">
          <label>Tipo de Juros</label>
          <select
            value={form.interest_type}
            onChange={(e) => set("interest_type", e.target.value)}
          >
            <option value="compound">Composto (Tabela Price)</option>
            <option value="simple">Simples</option>
          </select>
        </div>
      </div>

      <div className="form-row-2">
        <div className="form-row">
          <label>Número de Parcelas *</label>
          <input
            type="number"
            value={form.installments}
            onChange={(e) => set("installments", e.target.value)}
            placeholder="12"
            min="1"
            className={errors.installments ? "input-error" : ""}
          />
          {errors.installments && <span className="field-error">{errors.installments}</span>}
        </div>
        <div className="form-row">
          <label>Parcelas Pagas</label>
          <input
            type="number"
            value={form.paid}
            onChange={(e) => set("paid", e.target.value)}
            min="0"
          />
        </div>
      </div>

      {pmt > 0 && (
        <div className="loan-summary">
          <div className="loan-summary-item">
            <span>Valor da Parcela:</span>
            <strong>{fmt(pmt)}</strong>
          </div>
          <div className="loan-summary-item">
            <span>Total a Pagar:</span>
            <strong>{fmt(totalAmount)}</strong>
          </div>
          <div className="loan-summary-item">
            <span>Total de Juros:</span>
            <strong className="text-warning">
              {fmt(totalAmount - (parseFloat(String(form.value).replace(",", ".")) || 0))}
            </strong>
          </div>
        </div>
      )}

      <div className="form-row">
        <label>Status</label>
        <select value={form.status} onChange={(e) => set("status", e.target.value)}>
          {STATUS_OPTS.filter((o) => o.value !== "").map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label>Observações</label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Observações sobre o empréstimo..."
          rows={2}
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-gold btn-sm" disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

function AmortizationModal({ loan, onClose }) {
  const table = useMemo(() => {
    const v = Number(loan.value) || 0;
    const r = (Number(loan.interest_rate) || 0) / 100;
    const n = Number(loan.installments) || 0;
    if (!v || !n) return [];
    if (loan.interest_type === "simple") {
      const totalInterest = v * r * n;
      const totalAmount = v + totalInterest;
      const pmt = totalAmount / n;
      const rows = [];
      for (let i = 1; i <= n; i++) {
        const due = loan.start_date ? new Date(loan.start_date + "T00:00:00") : new Date();
        due.setMonth(due.getMonth() + i);
        rows.push({
          installment: i,
          dueDate: due.toISOString().split("T")[0],
          payment: pmt,
          interest: v * r,
          amortization: v / n,
          balance: Math.max(v - (v / n) * i, 0),
        });
      }
      return rows;
    }
    return buildAmortizationTable(v, r, n, loan.start_date);
  }, [loan]);

  return (
    <div>
      <div style={{ marginBottom: 12, color: "var(--text-dim)", fontSize: "0.85rem" }}>
        <strong>{loan.client}</strong> — {fmt(loan.value)} a {loan.interest_rate}% a.m. ({loan.interest_type === "compound" ? "Juros Compostos" : "Juros Simples"})
      </div>
      <div className="table-wrapper" style={{ maxHeight: 400, overflowY: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Vencimento</th>
              <th>Prestação</th>
              <th>Juros</th>
              <th>Amortização</th>
              <th>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {table.map((row) => (
              <tr key={row.installment} className={row.installment <= (loan.paid || 0) ? "row-paid" : ""}>
                <td>{row.installment}</td>
                <td>{fmtDate(row.dueDate)}</td>
                <td>{fmt(row.payment)}</td>
                <td>{fmt(row.interest)}</td>
                <td>{fmt(row.amortization)}</td>
                <td>{fmt(row.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, textAlign: "right" }}>
        <button className="btn btn-outline btn-sm" onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}

function Emprestimos() {
  const {
    loans, clients, settings,
    openModal, closeModal, addToast,
    createLoan, editLoan, removeLoan,
  } = useContext(AppContext);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // KPI calculations
  const activeLoans = loans.filter((l) => l.status === "active" || l.status === "overdue");
  const totalLent = activeLoans.reduce((s, l) => s + (Number(l.value) || 0), 0);
  const totalPaidInstallments = loans.reduce((s, l) => {
    const pmt = calcPMT(
      Number(l.value) || 0,
      (Number(l.interest_rate) || 0) / 100,
      Number(l.installments) || 1
    );
    return s + pmt * (Number(l.paid) || 0);
  }, 0);
  const overdueCount = loans.filter((l) => l.status === "overdue").length;

  const filtered = useMemo(() => {
    return loans.filter((l) => {
      const matchSearch = [l.client, l.status, String(l.value)]
        .join(" ").toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus ? l.status === filterStatus : true;
      return matchSearch && matchStatus;
    });
  }, [loans, search, filterStatus]);

  const handleAdd = () => {
    openModal(
      "Novo Empréstimo",
      <LoanForm
        clients={clients}
        settings={settings}
        onSave={async (form) => {
          setIsSaving(true);
          try {
            await createLoan(form);
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

  const handleEdit = (loan) => {
    openModal(
      "Editar Empréstimo",
      <LoanForm
        initial={{
          client_id: loan.client_id ? String(loan.client_id) : "",
          client: loan.client || "",
          value: String(loan.value || ""),
          interest_rate: String(loan.interest_rate || ""),
          interest_type: loan.interest_type || "compound",
          installments: String(loan.installments || ""),
          paid: String(loan.paid || "0"),
          start_date: loan.start_date || "",
          status: loan.status || "active",
          notes: loan.notes || "",
        }}
        clients={clients}
        settings={settings}
        onSave={async (form) => {
          setIsSaving(true);
          try {
            await editLoan(loan.id, form);
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

  const handleDelete = (loan) => {
    openModal(
      "Confirmar Exclusão",
      <div className="modal-confirm">
        <p>Excluir empréstimo de <strong>{loan.client}</strong> no valor de <strong>{fmt(loan.value)}</strong>?</p>
        <p className="text-dim">Esta ação não pode ser desfeita.</p>
        <div className="form-actions">
          <button className="btn btn-outline btn-sm" onClick={closeModal}>Cancelar</button>
          <button
            className="btn btn-danger btn-sm"
            disabled={deletingId === loan.id}
            onClick={async () => {
              setDeletingId(loan.id);
              try {
                await removeLoan(loan.id);
                closeModal();
              } catch { /* handled */ } finally {
                setDeletingId(null);
              }
            }}
          >
            {deletingId === loan.id ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    );
  };

  const handleViewAmortization = (loan) => {
    openModal(
      `Tabela de Amortização — ${loan.client}`,
      <AmortizationModal loan={loan} onClose={closeModal} />
    );
  };

  const handleRegisterPayment = (loan) => {
    const pmt = calcPMT(
      Number(loan.value) || 0,
      (Number(loan.interest_rate) || 0) / 100,
      Number(loan.installments) || 1
    );
    const remaining = (Number(loan.installments) || 0) - (Number(loan.paid) || 0);

    openModal(
      `Registrar Pagamento — ${loan.client}`,
      <div className="modal-form">
        <div style={{ marginBottom: 16, padding: "12px", background: "var(--bg-primary)", borderRadius: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span className="text-dim">Valor da parcela:</span>
            <strong>{fmt(pmt)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span className="text-dim">Parcelas restantes:</span>
            <strong>{remaining}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="text-dim">Parcelas pagas:</span>
            <strong>{loan.paid}</strong>
          </div>
        </div>
        <p style={{ color: "var(--text-dim)", marginBottom: 12 }}>
          {remaining <= 0
            ? "Todas as parcelas já foram pagas."
            : `Confirmar pagamento da parcela ${Number(loan.paid) + 1} de ${loan.installments}?`}
        </p>
        <div className="form-actions">
          <button className="btn btn-outline btn-sm" onClick={closeModal}>Cancelar</button>
          {remaining > 0 && (
            <button
              className="btn btn-gold btn-sm"
              onClick={async () => {
                const newPaid = Number(loan.paid) + 1;
                const newStatus = newPaid >= Number(loan.installments) ? "paid" : loan.status;
                try {
                  await editLoan(loan.id, { paid: newPaid, status: newStatus });
                  addToast(`Parcela ${newPaid}/${loan.installments} registrada!`, "success");
                  closeModal();
                } catch { /* handled */ }
              }}
            >
              Confirmar Pagamento
            </button>
          )}
        </div>
      </div>
    );
  };

  const statusInfo = (s) => STATUS_MAP[s] || { label: s, cls: "status-inactive" };

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Empréstimos</h2>
          <p className="page-desc">Gerencie os empréstimos concedidos</p>
        </div>
        <div className="header-actions">
          <button onClick={handleAdd} className="btn btn-gold btn-sm">+ Novo Empréstimo</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card kpi-revenue">
          <div className="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total Emprestado (Ativo)</span>
            <span className="kpi-value">{fmt(totalLent)}</span>
          </div>
        </div>
        <div className="kpi-card kpi-profit">
          <div className="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total Recebido</span>
            <span className="kpi-value">{fmt(totalPaidInstallments)}</span>
          </div>
        </div>
        <div className="kpi-card kpi-clients">
          <div className="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Empréstimos Ativos</span>
            <span className="kpi-value">{activeLoans.length}</span>
          </div>
        </div>
        <div className="kpi-card kpi-expense">
          <div className="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Em Atraso</span>
            <span className="kpi-value">{overdueCount}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="🔍  Buscar cliente ou valor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {STATUS_OPTS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Juros</th>
                <th>Parcelas</th>
                <th>Pagas</th>
                <th>Início</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((loan) => {
                  const si = statusInfo(loan.status);
                  const pmt = calcPMT(
                    Number(loan.value) || 0,
                    (Number(loan.interest_rate) || 0) / 100,
                    Number(loan.installments) || 1
                  );
                  return (
                    <tr key={loan.id} className={loan.status === "overdue" ? "row-overdue" : ""}>
                      <td><strong>{loan.client}</strong></td>
                      <td>
                        {fmt(loan.value)}
                        {pmt > 0 && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                            {fmt(pmt)}/mês
                          </div>
                        )}
                      </td>
                      <td>{loan.interest_rate ? `${loan.interest_rate}% a.m.` : "—"}</td>
                      <td>{loan.installments}</td>
                      <td>
                        <span style={{ color: loan.paid >= loan.installments ? "var(--green)" : "var(--text)" }}>
                          {loan.paid}
                        </span>
                        /{loan.installments}
                      </td>
                      <td>{fmtDate(loan.start_date)}</td>
                      <td><span className={`status ${si.cls}`}>{si.label}</span></td>
                      <td>
                        <button className="btn-icon" title="Tabela de Amortização" onClick={() => handleViewAmortization(loan)}>📊</button>
                        <button className="btn-icon" title="Registrar Pagamento" onClick={() => handleRegisterPayment(loan)}>💰</button>
                        <button className="btn-icon" title="Editar" onClick={() => handleEdit(loan)}>✏️</button>
                        <button className="btn-icon" title="Excluir" onClick={() => handleDelete(loan)}>🗑️</button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--text-dim)" }}>
                    {search || filterStatus ? "Nenhum empréstimo encontrado." : "Nenhum empréstimo cadastrado. Clique em + Novo Empréstimo para começar."}
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

export default Emprestimos;
