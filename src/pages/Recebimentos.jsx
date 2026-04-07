// src/pages/Recebimentos.jsx
import React, { useContext, useState, useMemo, useCallback } from "react";
import { AppContext } from "../App";
import { fmt, fmtDate, calcPMT, getClientName } from "../utils/helpers";
import { buildInstallments } from "../utils/finance";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

// ── Receipt Modal ─────────────────────────────────────────────────────────────

function ReceiptModal({ payment, settings, onClose }) {
  const handlePrint = () => {
    const doc = new jsPDF({ unit: "mm", format: "a5" });
    const w = doc.internal.pageSize.getWidth();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(settings.companyName || "Fideliza Cred", w / 2, 18, {
      align: "center",
    });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    if (settings.companyAddress)
      doc.text(settings.companyAddress, w / 2, 24, { align: "center" });
    if (settings.companyPhone)
      doc.text(`Tel: ${settings.companyPhone}`, w / 2, 29, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("RECIBO DE PAGAMENTO", w / 2, 40, { align: "center" });
    doc.setLineWidth(0.3);
    doc.line(10, 43, w - 10, 43);

    autoTable(doc, {
      startY: 47,
      theme: "plain",
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 45 } },
      body: [
        ["Cliente:", payment.client],
        ["Parcela:", `${payment.installmentNo}/${payment.totalInstallments}`],
        ["Vencimento:", fmtDate(payment.dueDate)],
        ["Data Pagamento:", fmtDate(payment.paymentDate)],
        ["Valor Original:", fmt(payment.originalAmount)],
        ...(payment.daysLate > 0
          ? [
              [
                "Dias em atraso:",
                `${payment.daysLate} dia${payment.daysLate !== 1 ? "s" : ""}`,
              ],
              ["Multa:", fmt(payment.penaltyAmount)],
              ["Juros de mora:", fmt(payment.moraAmount)],
              ["Total com encargos:", fmt(payment.totalWithFees)],
            ]
          : []),
        ["Valor Recebido:", fmt(payment.amountPaid)],
        ...(payment.notes ? [["Observações:", payment.notes]] : []),
      ],
    });

    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setLineWidth(0.3);
    doc.line(20, finalY, w - 20, finalY);
    doc.setFontSize(8);
    doc.text("Assinatura do Credor", w / 2, finalY + 5, { align: "center" });

    doc.setFontSize(7);
    doc.text(
      `Emitido em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
      w / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" },
    );

    doc.save(
      `recibo-${payment.client.replace(/\s+/g, "-")}-parcela${payment.installmentNo}-${payment.paymentDate}.pdf`,
    );
  };

  return (
    <div style={{ fontFamily: "monospace", lineHeight: 1.7 }}>
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          padding: "16px",
          background: "var(--bg-primary)",
          marginBottom: 16,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <strong style={{ fontSize: "1.1rem" }}>
            {settings.companyName || "Fideliza Cred"}
          </strong>
          <br />
          <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
            RECIBO DE PAGAMENTO
          </span>
        </div>
        {[
          ["Cliente", payment.client],
          ["Parcela", `${payment.installmentNo}/${payment.totalInstallments}`],
          ["Vencimento", fmtDate(payment.dueDate)],
          ["Data Pagamento", fmtDate(payment.paymentDate)],
          ["Valor Original", fmt(payment.originalAmount)],
          ...(payment.daysLate > 0
            ? [
                ["Dias em Atraso", `${payment.daysLate}d`],
                ["Multa", fmt(payment.penaltyAmount)],
                ["Juros de Mora", fmt(payment.moraAmount)],
                ["Total c/ Encargos", fmt(payment.totalWithFees)],
              ]
            : []),
          ["Valor Recebido", fmt(payment.amountPaid)],
          ...(payment.notes ? [["Observações", payment.notes]] : []),
        ].map(([k, v]) => (
          <div
            key={k}
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderBottom: "1px dashed var(--border)",
              padding: "4px 0",
              fontSize: "0.85rem",
            }}
          >
            <span style={{ color: "var(--text-dim)" }}>{k}:</span>
            <strong>{v}</strong>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-outline btn-sm" onClick={onClose}>
          Fechar
        </button>
        <button className="btn btn-gold btn-sm" onClick={handlePrint}>
          🖨 Imprimir / PDF
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const FILTER_STATUS = [
  { value: "", label: "Todos" },
  { value: "overdue", label: "Vencidas" },
  { value: "due", label: "A vencer" },
  { value: "paid", label: "Pagas" },
];

function Recebimentos() {
  const {
    loans,
    clients,
    editLoan,
    addToast,
    openModal,
    closeModal,
    settings,
    currentUser,
    userRole,
    reloadLoans,
  } = useContext(AppContext);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  // Local payment history (stored in localStorage for persistence)
  const [payments, setPayments] = useState(() => {
    try {
      const saved = localStorage.getItem("fc_payments");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeTab, setActiveTab] = useState("installments");

  // Access Control: Employees see only their own loans
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

  const allInstallments = useMemo(
    () => buildInstallments(accessibleLoans, today),
    [accessibleLoans, today],
  );

  const filtered = useMemo(() => {
    return allInstallments.filter((inst) => {
      const matchSearch = [inst.client, inst.dueDate]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchStatus = filterStatus ? inst.status === filterStatus : true;
      const matchFrom = filterDateFrom ? inst.dueDate >= filterDateFrom : true;
      const matchTo = filterDateTo ? inst.dueDate <= filterDateTo : true;
      return matchSearch && matchStatus && matchFrom && matchTo;
    });
  }, [allInstallments, search, filterStatus, filterDateFrom, filterDateTo]);

  const kpis = useMemo(() => {
    const overdue = allInstallments.filter((i) => i.status === "overdue");
    const due = allInstallments.filter((i) => i.status === "due");
    const paid = allInstallments.filter((i) => i.status === "paid");
    return {
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((s, i) => s + i.amount, 0),
      dueCount: due.length,
      dueAmount: due.reduce((s, i) => s + i.amount, 0),
      totalReceived: paid.reduce((s, i) => s + i.amount, 0),
      paidCount: paid.length,
      paymentsCount: payments.length,
    };
  }, [allInstallments, payments]);

  const savePayments = useCallback((updated) => {
    setPayments(updated);
    localStorage.setItem("fc_payments", JSON.stringify(updated));
  }, []);

  const handleRegisterPayment = useCallback(
    (inst) => {
      openModal(
        `Registrar Pagamento — ${inst.client}`,
        <PaymentForm
          installment={inst}
          settings={settings}
          onSave={async (data) => {
            try {
              // Mark installment as paid in loan
              const loan = loans.find((l) => l.id === inst.loanId);
              if (!loan) throw new Error("Empréstimo não encontrado.");
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

              // Dispatch event to notify Financeiro
              window.dispatchEvent(
                new CustomEvent("paymentsUpdated", { detail: updated }),
              );

              closeModal();
              addToast(
                `Pagamento registrado! Parcela ${inst.installmentNo} de ${inst.client} marcada como paga.`,
                "success",
              );

              // Reload loans to update alerts
              if (reloadLoans) {
                await reloadLoans();
              }

              // Show receipt option
              setTimeout(() => {
                openModal(
                  "Recibo de Pagamento",
                  <ReceiptModal
                    payment={paymentRecord}
                    settings={settings}
                    onClose={closeModal}
                  />,
                );
              }, 300);
            } catch (err) {
              addToast(
                "Erro ao registrar pagamento: " + (err.message || ""),
                "error",
              );
            }
          }}
          onCancel={closeModal}
        />,
      );
    },
    [
      loans,
      editLoan,
      payments,
      savePayments,
      openModal,
      closeModal,
      addToast,
      settings,
    ],
  );

  const handleReversePayment = useCallback(
    (payment) => {
      openModal(
        "Estornar Pagamento",
        <div className="modal-confirm">
          <p>
            Deseja estornar o pagamento da{" "}
            <strong>Parcela {payment.installmentNo}</strong> de{" "}
            <strong>{payment.client}</strong> no valor de{" "}
            <strong>{fmt(payment.amountPaid)}</strong> em{" "}
            {fmtDate(payment.paymentDate)}?
          </p>
          <p style={{ color: "var(--red)", fontSize: "0.85rem", marginTop: 8 }}>
            ⚠ Esta ação reverterá o pagamento e marcará a parcela como não paga.
          </p>
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              marginTop: 16,
            }}
          >
            <button className="btn btn-outline btn-sm" onClick={closeModal}>
              Cancelar
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={async () => {
                try {
                  const loan = loans.find((l) => l.id === payment.loanId);
                  if (loan) {
                    const newPaid = Math.max(0, (Number(loan.paid) || 0) - 1);
                    await editLoan(loan.id, {
                      paid: newPaid,
                      status:
                        newPaid < Number(loan.installments)
                          ? "active"
                          : loan.status,
                    });
                  }
                  const updated = payments.filter((p) => p.id !== payment.id);
                  savePayments(updated);

                  // Dispatch event to notify Financeiro
                  window.dispatchEvent(
                    new CustomEvent("paymentsUpdated", { detail: updated }),
                  );

                  closeModal();
                  addToast("Pagamento estornado com sucesso.", "success");

                  // Reload loans to update alerts
                  if (reloadLoans) {
                    await reloadLoans();
                  }
                } catch (err) {
                  addToast("Erro ao estornar: " + (err.message || ""), "error");
                }
              }}
            >
              Confirmar Estorno
            </button>
          </div>
        </div>,
      );
    },
    [
      loans,
      editLoan,
      payments,
      savePayments,
      openModal,
      closeModal,
      addToast,
      reloadLoans,
      settings,
    ],
  );

  const handleViewReceipt = useCallback(
    (payment) => {
      openModal(
        "Recibo de Pagamento",
        <ReceiptModal
          payment={payment}
          settings={settings}
          onClose={closeModal}
        />,
      );
    },
    [openModal, closeModal, settings],
  );

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch = [p.client, p.paymentDate, p.dueDate]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchFrom = filterDateFrom ? p.paymentDate >= filterDateFrom : true;
      const matchTo = filterDateTo ? p.paymentDate <= filterDateTo : true;
      return matchSearch && matchFrom && matchTo;
    });
  }, [payments, search, filterDateFrom, filterDateTo]);

  // ── Sync missing paid installments ───────────────────────────────────────
  React.useEffect(() => {
    const paidInstallments = allInstallments.filter((i) => i.status === "paid");

    if (paidInstallments.length === 0) return;

    // Check which paid installments don't have payment records
    const missingPayments = paidInstallments.filter((inst) => {
      return !payments.some(
        (p) =>
          p.loanId === inst.loanId && p.installmentNo === inst.installmentNo,
      );
    });

    if (missingPayments.length === 0) return;

    // Create payment records for missing paid installments
    const newPayments = missingPayments.map((inst) => ({
      id: `sync-${inst.loanId}-${inst.installmentNo}-${Date.now()}`,
      loanId: inst.loanId,
      clientId: inst.clientId,
      client: inst.client,
      installmentNo: inst.installmentNo,
      totalInstallments: inst.totalInstallments,
      dueDate: inst.dueDate,
      paymentDate: inst.dueDate, // Use due date as payment date (default assumption)
      originalAmount: inst.amount,
      amountPaid: inst.amount,
      daysLate: 0,
      penaltyAmount: 0,
      moraAmount: 0,
      totalWithFees: inst.amount,
      notes: "[Sincronizado automaticamente]",
    }));

    const updated = [...payments, ...newPayments];
    savePayments(updated);

    // Dispatch event to notify Financeiro
    window.dispatchEvent(
      new CustomEvent("paymentsUpdated", { detail: updated }),
    );

    addToast(
      `✅ ${newPayments.length} parcela(s) sincronizada(s) como pagamentos.`,
      "success",
    );
  }, [allInstallments, payments, savePayments, addToast]);

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Recebimentos</h2>
          <p className="page-desc">Gestão de pagamentos e cobranças</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div
          className="kpi-card kpi-expense animate-in"
          style={{ "--delay": 1 }}
        >
          <div className="kpi-icon">
            <svg
              width="20"
              height="20"
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
            <span className="kpi-label">Em Atraso</span>
            <span className="kpi-value">{fmt(kpis.overdueAmount)}</span>
            <span className="kpi-change negative">
              {kpis.overdueCount} parcela{kpis.overdueCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div
          className="kpi-card kpi-profit animate-in"
          style={{ "--delay": 2 }}
        >
          <div className="kpi-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
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

        <div
          className="kpi-card kpi-revenue animate-in"
          style={{ "--delay": 3 }}
        >
          <div className="kpi-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total Recebido</span>
            <span className="kpi-value">{fmt(kpis.totalReceived)}</span>
            <span className="kpi-change positive">
              {kpis.paidCount} parcela{kpis.paidCount !== 1 ? "s" : ""} quitada
              {kpis.paidCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { key: "installments", label: "📋 Parcelas" },
          { key: "history", label: "🕐 Histórico de Pagamentos" },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`btn btn-sm ${activeTab === key ? "btn-gold" : "btn-outline"}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: "16px", marginBottom: 16 }}>
        <div
          className="filter-bar"
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <div style={{ flex: "1 1 200px" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.78rem",
                color: "var(--text-dim)",
                marginBottom: 4,
              }}
            >
              Buscar
            </label>
            <input
              placeholder="Cliente, data..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
          {activeTab === "installments" && (
            <div style={{ flex: "0 0 140px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.78rem",
                  color: "var(--text-dim)",
                  marginBottom: 4,
                }}
              >
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ width: "100%" }}
              >
                {FILTER_STATUS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div style={{ flex: "0 0 140px" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.78rem",
                color: "var(--text-dim)",
                marginBottom: 4,
              }}
            >
              De
            </label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
            />
          </div>
          <div style={{ flex: "0 0 140px" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.78rem",
                color: "var(--text-dim)",
                marginBottom: 4,
              }}
            >
              Até
            </label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
            />
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              setSearch("");
              setFilterStatus("");
              setFilterDateFrom("");
              setFilterDateTo("");
            }}
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Installments Tab */}
      {activeTab === "installments" && (
        <div className="card animate-in" style={{ "--delay": 1 }}>
          <div className="card-header">
            <h3>
              Parcelas{" "}
              {filterStatus === "overdue"
                ? "Vencidas"
                : filterStatus === "due"
                  ? "A Vencer"
                  : filterStatus === "paid"
                    ? "Pagas"
                    : ""}
              <span
                style={{
                  marginLeft: 8,
                  fontSize: "0.8rem",
                  color: "var(--text-dim)",
                  fontWeight: 400,
                }}
              >
                ({filtered.length} parcela{filtered.length !== 1 ? "s" : ""})
              </span>
            </h3>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Parcela</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((inst) => {
                    const today0 = new Date();
                    today0.setHours(0, 0, 0, 0);
                    const diff = Math.ceil(
                      (inst.due - today0) / (1000 * 60 * 60 * 24),
                    );
                    return (
                      <tr
                        key={inst.id}
                        className={
                          inst.status === "overdue"
                            ? "row-overdue"
                            : inst.status === "paid"
                              ? "row-paid"
                              : ""
                        }
                      >
                        <td>
                          <strong>{inst.client}</strong>
                        </td>
                        <td>
                          {inst.installmentNo}/{inst.totalInstallments}
                        </td>
                        <td>
                          <div>{fmtDate(inst.dueDate)}</div>
                          {inst.status === "overdue" && (
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--red)",
                              }}
                            >
                              {Math.abs(diff)}d atraso
                            </div>
                          )}
                          {inst.status === "due" && diff <= 7 && (
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--orange)",
                              }}
                            >
                              em {diff}d
                            </div>
                          )}
                          {inst.status === "paid" && (
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--green)",
                              }}
                            >
                              Pago em {fmtDate(inst.dueDate)}
                            </div>
                          )}
                        </td>
                        <td>{fmt(inst.amount)}</td>
                        <td>
                          <span
                            className={`status ${
                              inst.status === "overdue"
                                ? "status-overdue"
                                : inst.status === "paid"
                                  ? "status-active"
                                  : "status-pending"
                            }`}
                          >
                            {inst.status === "overdue"
                              ? "Vencida"
                              : inst.status === "paid"
                                ? "Paga"
                                : "A vencer"}
                          </span>
                        </td>
                        <td>
                          {inst.status !== "paid" && (
                            <button
                              className="btn btn-gold btn-sm"
                              onClick={() => handleRegisterPayment(inst)}
                            >
                              Registrar Pag.
                            </button>
                          )}
                          {inst.status === "paid" && (
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "var(--green)",
                              }}
                            >
                              ✓ Paga
                            </span>
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
                      <div style={{ fontSize: "2rem", marginBottom: 8 }}>
                        📭
                      </div>
                      Nenhuma parcela encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan="3">
                      <strong>Total</strong>
                    </td>
                    <td>
                      <strong>
                        {fmt(filtered.reduce((s, i) => s + i.amount, 0))}
                      </strong>
                    </td>
                    <td colSpan="2" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="card animate-in" style={{ "--delay": 1 }}>
          <div className="card-header">
            <h3>
              Histórico de Pagamentos
              <span
                style={{
                  marginLeft: 8,
                  fontSize: "0.8rem",
                  color: "var(--text-dim)",
                  fontWeight: 400,
                }}
              >
                ({filteredPayments.length} registro
                {filteredPayments.length !== 1 ? "s" : ""})
              </span>
            </h3>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Parcela</th>
                  <th>Vencimento</th>
                  <th>Pago em</th>
                  <th>Valor Original</th>
                  <th>Valor Recebido</th>
                  <th>Atraso</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.client}</strong>
                      </td>
                      <td>
                        {p.installmentNo}/{p.totalInstallments}
                      </td>
                      <td>{fmtDate(p.dueDate)}</td>
                      <td>{fmtDate(p.paymentDate)}</td>
                      <td>{fmt(p.originalAmount)}</td>
                      <td className="tx-income">
                        <strong>{fmt(p.amountPaid)}</strong>
                      </td>
                      <td>
                        {p.daysLate > 0 ? (
                          <span
                            style={{ color: "var(--red)", fontSize: "0.82rem" }}
                          >
                            {p.daysLate}d (+
                            {fmt(p.penaltyAmount + p.moraAmount)})
                          </span>
                        ) : (
                          <span
                            style={{
                              color: "var(--green)",
                              fontSize: "0.82rem",
                            }}
                          >
                            Em dia
                          </span>
                        )}
                      </td>
                      <td style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleViewReceipt(p)}
                          title="Ver recibo"
                        >
                          🧾
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleReversePayment(p)}
                          title="Estornar"
                        >
                          ↩
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      style={{
                        textAlign: "center",
                        padding: "40px",
                        color: "var(--text-dim)",
                      }}
                    >
                      <div style={{ fontSize: "2rem", marginBottom: 8 }}>
                        📭
                      </div>
                      Nenhum pagamento registrado.
                    </td>
                  </tr>
                )}
              </tbody>
              {filteredPayments.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan="5">
                      <strong>Total Recebido</strong>
                    </td>
                    <td className="tx-income">
                      <strong>
                        {fmt(
                          filteredPayments.reduce(
                            (s, p) => s + (p.amountPaid || 0),
                            0,
                          ),
                        )}
                      </strong>
                    </td>
                    <td colSpan="2" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Recebimentos;
