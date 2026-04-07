// src/pages/Cobrancas.jsx
import React, { useContext, useMemo, useState, useCallback } from "react";
import { AppContext } from "../App";
import { fmt, fmtDate, calcPMT, getClientName } from "../utils/helpers";
import { buildInstallments } from "../utils/finance";

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcLateFees(amount, dueDate, penaltyRate = 2, moraRate = 0.033) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  const daysLate = Math.max(
    0,
    Math.ceil((today - due) / (1000 * 60 * 60 * 24)),
  );
  if (daysLate === 0)
    return { daysLate: 0, penalty: 0, mora: 0, total: amount };
  const penalty = amount * (penaltyRate / 100);
  const mora = amount * (moraRate / 100) * daysLate;
  return { daysLate, penalty, mora, total: amount + penalty + mora };
}

// Using unified buildInstallments from finance.js

// ── Payment Form ──────────────────────────────────────────────────────────────

function PaymentForm({ installment, settings, onSave, onCancel }) {
  const { daysLate, penalty, mora, total } = calcLateFees(
    installment.amount,
    installment.dueDate,
    settings.defaultPenaltyRate ?? 2,
    settings.defaultMoraRate ?? 0.033,
  );

  const [paymentAmount, setPaymentAmount] = useState(
    total.toFixed(2).replace(".", ","),
  );
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const parsedAmount = parseFloat(
    String(paymentAmount).replace(/\./g, "").replace(",", ".") || "0",
  );

  const handleSave = () => {
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Informe um valor válido.");
      return;
    }
    if (!paymentDate) {
      setError("Informe a data do pagamento.");
      return;
    }
    onSave({
      installment,
      amountPaid: parsedAmount,
      paymentDate,
      notes,
      originalAmount: installment.amount,
      daysLate,
      penaltyAmount: penalty,
      moraAmount: mora,
      totalWithFees: total,
    });
  };

  return (
    <div className="modal-form">
      <div className="form-row-2">
        <div className="form-row">
          <label>Cliente</label>
          <input
            value={installment.client}
            readOnly
            style={{ background: "var(--bg-primary)" }}
          />
        </div>
        <div className="form-row">
          <label>Parcela</label>
          <input
            value={`${installment.installmentNo}/${installment.totalInstallments}`}
            readOnly
            style={{ background: "var(--bg-primary)" }}
          />
        </div>
      </div>

      <div className="form-row-2">
        <div className="form-row">
          <label>Vencimento</label>
          <input
            value={fmtDate(installment.dueDate)}
            readOnly
            style={{ background: "var(--bg-primary)" }}
          />
        </div>
        <div className="form-row">
          <label>Valor Original</label>
          <input
            value={fmt(installment.amount)}
            readOnly
            style={{ background: "var(--bg-primary)" }}
          />
        </div>
      </div>

      {daysLate > 0 && (
        <div
          className="alert-box"
          style={{
            background: "var(--red-dim)",
            border: "1px solid var(--red)",
            borderRadius: "var(--radius-sm)",
            padding: "12px",
            marginBottom: "12px",
          }}
        >
          <strong style={{ color: "var(--red)" }}>
            ⚠ Parcela em atraso: {daysLate} dia{daysLate !== 1 ? "s" : ""}
          </strong>
          <div
            style={{
              marginTop: 6,
              fontSize: "0.85rem",
              display: "grid",
              gap: 4,
            }}
          >
            <span>
              Multa ({settings.defaultPenaltyRate ?? 2}%):{" "}
              <strong>{fmt(penalty)}</strong>
            </span>
            <span>
              Mora ({settings.defaultMoraRate ?? 0.033}%/dia × {daysLate}d):{" "}
              <strong>{fmt(mora)}</strong>
            </span>
            <span
              style={{
                borderTop: "1px solid var(--red)",
                paddingTop: 4,
                marginTop: 2,
              }}
            >
              Total com encargos:{" "}
              <strong style={{ color: "var(--red)" }}>{fmt(total)}</strong>
            </span>
          </div>
        </div>
      )}

      <div className="form-row-2">
        <div className="form-row">
          <label>Valor Recebido *</label>
          <input
            value={paymentAmount}
            onChange={(e) => {
              setPaymentAmount(e.target.value);
              setError("");
            }}
            placeholder="0,00"
          />
        </div>
        <div className="form-row">
          <label>Data do Pagamento *</label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </div>
      </div>

      <div className="form-row">
        <label>Observações</label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observações opcionais"
        />
      </div>

      {error && (
        <p style={{ color: "var(--red)", fontSize: "0.85rem" }}>{error}</p>
      )}

      <div
        className="modal-footer"
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "flex-end",
          marginTop: 16,
        }}
      >
        <button className="btn btn-outline btn-sm" onClick={onCancel}>
          Cancelar
        </button>
        <button className="btn btn-gold btn-sm" onClick={handleSave}>
          ✓ Registrar Pagamento
        </button>
      </div>
    </div>
  );
}

const STATUS_OPTS = [
  { value: "", label: "Todos" },
  { value: "paid", label: "Pagas" },
  { value: "due", label: "A vencer" },
  { value: "overdue", label: "Vencidas" },
];

function Cobrancas() {
  const {
    loans,
    clients,
    employees,
    editLoan,
    openModal,
    closeModal,
    addToast,
    settings,
    currentUser,
    userRole,
    notifications,
    markNotificationAsRead,
  } = useContext(AppContext);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // ── Load and save payment history (localStorage persistence) ──────────────────────
  const [payments, setPayments] = useState(() => {
    const saved = localStorage.getItem("fc_payments");
    return saved ? JSON.parse(saved) : [];
  });

  const savePayments = useCallback((updated) => {
    setPayments(updated);
    localStorage.setItem("fc_payments", JSON.stringify(updated));
  }, []);

  // Accessible data for employees
  const accessibleClients = useMemo(() => {
    if (userRole === "employee" && currentUser?.id) {
      return clients.filter(
        (c) => c.created_by === currentUser.id || c.owner_id === currentUser.id,
      );
    }
    return clients;
  }, [clients, currentUser, userRole]);

  const accessibleLoans = useMemo(() => {
    if (userRole === "employee" && currentUser?.id && clients) {
      const myClientIds = clients
        .filter(
          (c) =>
            c.created_by === currentUser.id || c.owner_id === currentUser.id,
        )
        .map((c) => c.id);
      return loans.filter((l) => myClientIds.includes(l.client_id));
    }
    return loans;
  }, [loans, clients, currentUser, userRole]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Generate all installments from loans
  const allInstallments = useMemo(() => {
    const items = [];
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
  }, [accessibleLoans, today]);

  const filtered = useMemo(() => {
    return allInstallments.filter((inst) => {
      const matchSearch = [inst.client, inst.dueDate]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchStatus = filterStatus ? inst.status === filterStatus : true;
      return matchSearch && matchStatus;
    });
  }, [allInstallments, search, filterStatus]);

  // KPIs
  const kpis = useMemo(() => {
    const overdue = allInstallments.filter((i) => i.status === "overdue");
    const due = allInstallments.filter((i) => i.status === "due");
    const paid = allInstallments.filter((i) => i.status === "paid");
    return {
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((s, i) => s + i.amount, 0),
      dueCount: due.length,
      dueAmount: due.reduce((s, i) => s + i.amount, 0),
      paidCount: paid.length,
      paidAmount: paid.reduce((s, i) => s + i.amount, 0),
    };
  }, [allInstallments]);

  const handleRegisterPayment = (inst) => {
    // Verificar permissão para funcionários
    if (userRole === "employee") {
      const currentEmp = employees?.find((e) => e.id === currentUser?.id);
      if (!currentEmp?.permissions?.can_register_payment) {
        addToast(
          "Você não tem permissão para registrar pagamentos. Solicite ao administrador.",
          "error",
        );
        return;
      }
    }

    const loan = loans.find((l) => l.id === inst.loanId);
    if (!loan) return;

    openModal(
      `Registrar Pagamento — ${inst.client}`,
      <PaymentForm
        installment={inst}
        settings={settings || { defaultPenaltyRate: 2, defaultMoraRate: 0.033 }}
        onSave={async (data) => {
          try {
            // Mark installment as paid in loan
            if (inst.installmentNo === loan.paid + 1) {
              const newPaid = Math.max(
                Number(loan.paid) || 0,
                inst.installmentNo,
              );
              const allPaid = newPaid >= Number(loan.installments);
              await editLoan(loan.id, {
                paid: newPaid,
                status: allPaid
                  ? "paid"
                  : loan.status === "overdue" && !allPaid
                    ? "active"
                    : loan.status,
              });

              // Save payment record
              const paymentRecord = {
                id: Date.now(),
                loanId: inst.loanId,
                clientId: inst.clientId,
                client: inst.client,
                installmentNo: inst.installmentNo,
                totalInstallments: inst.totalInstallments,
                dueDate: inst.dueDate,
                paymentDate: data.paymentDate,
                originalAmount: data.originalAmount,
                amountPaid: data.amountPaid,
                daysLate: data.daysLate,
                penaltyAmount: data.penaltyAmount,
                moraAmount: data.moraAmount,
                totalWithFees: data.totalWithFees,
                notes: data.notes,
              };
              const updated = [paymentRecord, ...payments];
              savePayments(updated);

              // Auto-dismiss related past notifications about this installment
              const notifsToClear = notifications.filter(
                (n) =>
                  !n.read &&
                  n.text &&
                  n.text.includes(inst.client) &&
                  (n.text.includes(`Parcela ${inst.installmentNo}`) ||
                    n.text.includes("atrasad") ||
                    n.text.includes("vencid")),
              );
              notifsToClear.forEach((n) => {
                if (n.id) markNotificationAsRead(n.id);
              });

              // Dispatch event to notify other pages
              window.dispatchEvent(
                new CustomEvent("paymentsUpdated", { detail: updated }),
              );

              closeModal();
              addToast(
                `Pagamento registrado! Parcela ${inst.installmentNo} de ${inst.client} marcada como paga.`,
                "success",
              );
            }
          } catch (err) {
            addToast("Erro ao registrar pagamento.", "error");
            console.error(err);
          }
        }}
        onCancel={closeModal}
      />,
    );
  };

  const statusInfo = (status) => {
    if (status === "paid")
      return { label: "Paga", cls: "status-paid", rowCls: "row-paid" };
    if (status === "overdue")
      return { label: "Vencida", cls: "status-overdue", rowCls: "row-overdue" };
    return { label: "A Vencer", cls: "status-active", rowCls: "" };
  };

  // Next 7 days filter
  const nextWeek = useMemo(() => {
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() + 7);
    return allInstallments.filter((i) => i.status === "due" && i.due <= cutoff);
  }, [allInstallments, today]);

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Cobranças</h2>
          <p className="page-desc">Controle de parcelas e vencimentos</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
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
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Vencidas</span>
            <span className="kpi-value">{fmt(kpis.overdueAmount)}</span>
            <span className="kpi-change negative">
              {kpis.overdueCount} parcela{kpis.overdueCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="kpi-card kpi-clients">
          <div className="kpi-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">A Vencer</span>
            <span className="kpi-value">{fmt(kpis.dueAmount)}</span>
            <span className="kpi-change neutral">
              {kpis.dueCount} parcela{kpis.dueCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="kpi-card kpi-profit">
          <div className="kpi-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Pagas</span>
            <span className="kpi-value">{fmt(kpis.paidAmount)}</span>
            <span className="kpi-change positive">
              {kpis.paidCount} parcela{kpis.paidCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="kpi-card kpi-revenue">
          <div className="kpi-info">
            <span className="kpi-label">Total de Parcelas</span>
            <span className="kpi-value">{allInstallments.length}</span>
            <span className="kpi-change neutral">
              em {loans.length} empréstimo{loans.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Next 7 days alert */}
      {nextWeek.length > 0 && (
        <div
          className="card"
          style={{ borderLeft: "3px solid var(--orange)", marginBottom: 16 }}
        >
          <div className="card-header">
            <h3>⚠️ Vencendo nos Próximos 7 Dias</h3>
            <span className="kpi-change negative">
              {nextWeek.length} parcela{nextWeek.length !== 1 ? "s" : ""} —{" "}
              {fmt(nextWeek.reduce((s, i) => s + i.amount, 0))}
            </span>
          </div>
          <div className="transactions-list">
            {nextWeek.slice(0, 5).map((inst) => {
              const diff = Math.ceil(
                (inst.due - today) / (1000 * 60 * 60 * 24),
              );
              return (
                <div key={inst.id} className="transaction-row">
                  <div
                    className="tx-icon"
                    style={{
                      background: "var(--orange-dim)",
                      color: "var(--orange)",
                    }}
                  >
                    📅
                  </div>
                  <div className="tx-info">
                    <div className="tx-desc">{inst.client}</div>
                    <div className="tx-category">
                      Parcela {inst.installmentNo}/{inst.totalInstallments}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div>{fmt(inst.amount)}</div>
                    <div
                      style={{ fontSize: "0.75rem", color: "var(--orange)" }}
                    >
                      {diff === 0
                        ? "Hoje"
                        : `em ${diff} dia${diff !== 1 ? "s" : ""} — ${fmtDate(inst.dueDate)}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main table */}
      <div className="card">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="🔍  Buscar cliente ou data..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {STATUS_OPTS.map((o) => (
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
                <th>Cliente</th>
                <th>#</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((inst) => {
                  const si = statusInfo(inst.status);
                  const daysOverdue =
                    inst.status === "overdue"
                      ? Math.floor((today - inst.due) / (1000 * 60 * 60 * 24))
                      : 0;
                  return (
                    <tr key={inst.id} className={si.rowCls}>
                      <td>
                        <strong>{inst.client}</strong>
                      </td>
                      <td>
                        {inst.installmentNo}/{inst.totalInstallments}
                      </td>
                      <td>
                        {fmtDate(inst.dueDate)}
                        {daysOverdue > 0 && (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--red)",
                              marginLeft: 4,
                            }}
                          >
                            ({daysOverdue}d atraso)
                          </span>
                        )}
                      </td>
                      <td>{fmt(inst.amount)}</td>
                      <td>
                        <span className={`status ${si.cls}`}>{si.label}</span>
                      </td>
                      <td>
                        {inst.status !== "paid" &&
                          inst.installmentNo === inst.loanPaid + 1 &&
                          (userRole === "admin" ||
                            employees?.find((e) => e.id === currentUser?.id)
                              ?.permissions?.can_register_payment) && (
                            <button
                              className="btn-icon"
                              title="Registrar Pagamento"
                              onClick={() => handleRegisterPayment(inst)}
                            >
                              💰
                            </button>
                          )}
                      </td>
                    </tr>
                  );
                })
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
                    {search || filterStatus
                      ? "Nenhuma parcela encontrada."
                      : "Nenhuma parcela calculada. Adicione empréstimos com data de início."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div
            style={{
              padding: "12px 16px",
              color: "var(--text-dim)",
              fontSize: "0.8rem",
            }}
          >
            Exibindo {filtered.length} de {allInstallments.length} parcela
            {allInstallments.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

export default Cobrancas;
