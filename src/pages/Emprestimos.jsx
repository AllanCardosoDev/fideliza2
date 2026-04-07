// src/pages/Emprestimos.jsx
import React, { useContext, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../App";
import {
  fmt,
  fmtDate,
  calcPMT,
  buildAmortizationTable,
  getClientName,
} from "../utils/helpers";
import { buildInstallments } from "../utils/finance";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Using unified buildInstallments from finance.js

const STATUS_OPTS = [
  { value: "", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "pending", label: "Pendentes" },
  { value: "overdue", label: "Atrasados" },
  { value: "paid", label: "Pagos" },
  { value: "renegotiated", label: "Renegociados" },
  { value: "cancelled", label: "Cancelados" },
  { value: "rejected", label: "Rejeitados" },
];

const STATUS_MAP = {
  active: { label: "Ativo", cls: "status-active" },
  overdue: { label: "Atrasado", cls: "status-overdue" },
  paid: { label: "Pago", cls: "status-paid" },
  renegotiated: { label: "Renegociado", cls: "status-pending" },
  cancelled: { label: "Cancelado", cls: "status-inactive" },
  pending: { label: "Pendente", cls: "status-pending" },
  rejected: { label: "Rejeitado", cls: "status-inactive" },
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

function LoanForm({
  initial,
  clients,
  settings,
  onSave,
  onCancel,
  isSaving,
  userRole,
}) {
  const [form, setForm] = useState(
    initial || {
      ...EMPTY_LOAN,
      interest_rate: settings?.defaultInterestRate || 5,
    },
  );
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
    return (v * (1 + r * n)) / n;
  }, [form.value, form.interest_rate, form.installments, form.interest_type]);

  const totalAmount = useMemo(() => {
    return pmt * (parseInt(form.installments) || 0);
  }, [pmt, form.installments]);

  const validate = () => {
    const e = {};
    if (!form.client && !form.client_id)
      e.client = "Selecione ou informe o cliente.";
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
      client_id: clientObj ? clientObj.id : form.client_id || null,
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
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
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
          {errors.start_date && (
            <span className="field-error">{errors.start_date}</span>
          )}
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
          {errors.interest_rate && (
            <span className="field-error">{errors.interest_rate}</span>
          )}
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
          {errors.installments && (
            <span className="field-error">{errors.installments}</span>
          )}
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
              {fmt(
                totalAmount -
                  (parseFloat(String(form.value).replace(",", ".")) || 0),
              )}
            </strong>
          </div>
        </div>
      )}

      {/* Status field: Only visible for admin/supervisor */}
      {userRole !== "employee" && (
        <div className="form-row">
          <label>Status</label>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          >
            {STATUS_OPTS.filter((o) => o.value !== "").map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}

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
        const due = loan.start_date
          ? new Date(loan.start_date + "T00:00:00")
          : new Date();
        due.setMonth(due.getMonth() + (i - 1));
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
      <div
        style={{
          marginBottom: 12,
          color: "var(--text-dim)",
          fontSize: "0.85rem",
        }}
      >
        <strong>{getClientName(loan.client)}</strong> — {fmt(loan.value)} a{" "}
        {loan.interest_rate}% a.m. (
        {loan.interest_type === "compound"
          ? "Juros Compostos"
          : "Juros Simples"}
        )
      </div>
      <div
        className="table-wrapper"
        style={{ maxHeight: 400, overflowY: "auto" }}
      >
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
              <tr
                key={row.installment}
                className={
                  row.installment <= (loan.paid || 0) ? "row-paid" : ""
                }
              >
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
        <button className="btn btn-outline btn-sm" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
}

function RejectForm({ loan, onConfirm, onCancel }) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onConfirm(reason);
    setIsSubmitting(false);
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      <div
        style={{
          marginBottom: 16,
          padding: "12px",
          background: "rgba(255, 60, 60, 0.05)",
          borderLeft: "4px solid var(--red)",
          borderRadius: 4,
        }}
      >
        <p style={{ margin: 0, color: "var(--text-dim)" }}>
          Você está prestes a <strong>cancelar</strong> a solicitação de:
        </p>
        <strong style={{ fontSize: "1.1rem", display: "block", marginTop: 4 }}>
          {getClientName(loan.client)}
        </strong>
        <span style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
          Valor solicitado: {fmt(loan.value)}
        </span>
      </div>
      <div className="form-row">
        <label>Motivo da Rejeição</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explique por que o empréstimo foi negado para informar o funcionário..."
          rows={3}
          style={{ width: "100%", borderColor: "var(--border)" }}
          required
        />
      </div>
      <div className="form-actions" style={{ marginTop: 24 }}>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-danger btn-sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Cancelando..." : "✗ Rejeitar Empréstimo"}
        </button>
      </div>
    </form>
  );
}

function Emprestimos() {
  const navigate = useNavigate();
  const {
    loans,
    clients,
    employees,
    settings,
    openModal,
    closeModal,
    addToast,
    createLoan,
    editLoan,
    removeLoan,
    approveLoan,
    rejectLoan,
    currentUser,
    userRole,
  } = useContext(AppContext);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // ── Today (fixed reference) ────────────────────────────────────────────────
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // ── Access Control: Employees see only their own clients that are approved ──────────
  const accessibleClients = useMemo(() => {
    if (userRole === "employee" && currentUser?.id) {
      // Employees see ONLY their own clients (that they created)
      return clients.filter(
        (c) => c.created_by === currentUser.id || c.owner_id === currentUser.id,
      );
    }
    return clients; // Admin/guest see all
  }, [clients, currentUser, userRole]);

  // ── Access Control: Employees see only their own loans ──────────────────
  const accessibleLoans = useMemo(() => {
    if (userRole === "employee" && currentUser?.id && clients) {
      // Get client IDs created by this employee
      const myClientIds = clients
        .filter(
          (c) =>
            c.created_by === currentUser.id || c.owner_id === currentUser.id,
        )
        .map((c) => c.id);
      // Filter loans to only those for accessible clients
      return loans.filter((l) => myClientIds.includes(l.client_id));
    }
    return loans; // Admin/guest see all
  }, [loans, clients, currentUser, userRole]);

  // ── Generate all installments (same logic as Cobrancas/Dashboard) ──────────
  const allInstallments = useMemo(
    () => buildInstallments(accessibleLoans, today),
    [accessibleLoans, today],
  );

  // KPI calculations
  const activeLoans = accessibleLoans.filter(
    (l) => l.status === "active" || l.status === "overdue",
  );
  const totalLent = activeLoans.reduce((s, l) => s + (Number(l.value) || 0), 0);
  const totalPaidInstallments = accessibleLoans.reduce((s, l) => {
    const pmt = calcPMT(
      Number(l.value) || 0,
      (Number(l.interest_rate) || 0) / 100,
      Number(l.installments) || 1,
    );
    return s + pmt * (Number(l.paid) || 0);
  }, 0);
  const overdueCount = allInstallments.filter(
    (i) => i.status === "overdue",
  ).length;

  // Filter pending requisitions (for admins/supervisors only)
  const pendingRequisitions = useMemo(() => {
    return loans.filter((l) => l.status === "pending");
  }, [loans]);

  const filtered = useMemo(() => {
    return accessibleLoans.filter((l) => {
      const matchSearch = [l.client, l.status, String(l.value)]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchStatus = filterStatus ? l.status === filterStatus : true;
      return matchSearch && matchStatus;
    });
  }, [accessibleLoans, search, filterStatus]);

  const handleAdd = () => {
    openModal(
      "Novo Empréstimo",
      <LoanForm
        userRole={userRole}
        clients={userRole === "employee" ? accessibleClients : clients}
        settings={settings}
        onSave={async (form) => {
          setIsSaving(true);
          try {
            await createLoan(form);
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

  const handleEdit = (loan) => {
    // Impedir que funcionários editem empréstimos
    if (userRole === "employee") {
      addToast(
        "Funcionários não podem editar empréstimos. Solicite ao administrador.",
        "error",
      );
      return;
    }

    openModal(
      "Editar Empréstimo",
      <LoanForm
        userRole={userRole}
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
        clients={userRole === "employee" ? accessibleClients : clients}
        settings={settings}
        onSave={async (form) => {
          setIsSaving(true);
          try {
            await editLoan(loan.id, form);
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

  const handleDelete = (loan) => {
    openModal(
      "Confirmar Exclusão",
      <div className="modal-confirm">
        <p>
          Excluir empréstimo de <strong>{loan.client}</strong> no valor de{" "}
          <strong>{fmt(loan.value)}</strong>?
        </p>
        <p className="text-dim">Esta ação não pode ser desfeita.</p>
        <div className="form-actions">
          <button className="btn btn-outline btn-sm" onClick={closeModal}>
            Cancelar
          </button>
          <button
            className="btn btn-danger btn-sm"
            disabled={deletingId === loan.id}
            onClick={async () => {
              setDeletingId(loan.id);
              try {
                await removeLoan(loan.id);
                closeModal();
              } catch {
                /* handled */
              } finally {
                setDeletingId(null);
              }
            }}
          >
            {deletingId === loan.id ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>,
    );
  };

  const handleViewAmortization = (loan) => {
    openModal(
      `Tabela de Amortização — ${getClientName(loan.client)}`,
      <AmortizationModal loan={loan} onClose={closeModal} />,
    );
  };

  const handleRegisterPayment = (loan) => {
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

    const pmt = calcPMT(
      Number(loan.value) || 0,
      (Number(loan.interest_rate) || 0) / 100,
      Number(loan.installments) || 1,
    );
    const remaining =
      (Number(loan.installments) || 0) - (Number(loan.paid) || 0);

    openModal(
      `Registrar Pagamento — ${getClientName(loan.client)}`,
      <div className="modal-form">
        <div
          style={{
            marginBottom: 16,
            padding: "12px",
            background: "var(--bg-primary)",
            borderRadius: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <span className="text-dim">Valor da parcela:</span>
            <strong>{fmt(pmt)}</strong>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
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
          <button className="btn btn-outline btn-sm" onClick={closeModal}>
            Cancelar
          </button>
          {remaining > 0 && (
            <button
              className="btn btn-gold btn-sm"
              onClick={async () => {
                const newPaid = Number(loan.paid) + 1;
                const newStatus =
                  newPaid >= Number(loan.installments) ? "paid" : loan.status;
                try {
                  await editLoan(loan.id, { paid: newPaid, status: newStatus });
                  addToast(
                    `Parcela ${newPaid}/${loan.installments} registrada!`,
                    "success",
                  );
                  closeModal();
                } catch {
                  /* handled */
                }
              }}
            >
              Confirmar Pagamento
            </button>
          )}
        </div>
      </div>,
    );
  };

  const handleViewProtocol = (loan) => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const code = "01"; // Código para empréstimo
    const sequence = String(loan.id).padStart(4, "0");
    const year = now.getFullYear();
    const protocolId = `${day}.${code}/${sequence}/${year}`;
    openModal(
      "Protocolo do Empréstimo",
      <div
        className="modal-form"
        style={{ textAlign: "center", padding: "24px", position: "relative" }}
      >
        {/* Logo no canto superior esquerdo */}
        <div
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            width: "60px",
            height: "60px",
            overflow: "hidden",
            borderRadius: "4px",
            background: "var(--bg-alt)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src="/logo.jpeg"
            alt="Logo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              fontSize: "0.9rem",
              color: "var(--text-dim)",
              marginBottom: "12px",
            }}
          >
            Protocolo de Emissão
          </div>
          <div
            style={{
              fontSize: "1.8rem",
              fontWeight: 900,
              color: "var(--gold)",
              fontFamily: "monospace",
              padding: "16px",
              background: "var(--bg-alt)",
              borderRadius: "8px",
              border: "2px solid var(--border)",
              marginBottom: "16px",
            }}
          >
            {protocolId}
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
            <div style={{ marginBottom: "8px" }}>
              <strong>Cliente:</strong> {getClientName(loan.client)}
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>Valor:</strong> {fmt(loan.value)}
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>Parcelas:</strong> {loan.installments}
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>Data do Empréstimo:</strong> {fmtDate(loan.start_date)}
            </div>
            <div>
              <strong>Emitido em:</strong> {new Date().toLocaleString("pt-BR")}
            </div>
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-outline btn-sm" onClick={closeModal}>
            Fechar
          </button>
          <button
            className="btn btn-gold btn-sm"
            onClick={() => {
              const text = `PROTOCOLO DE EMPRÉSTIMO\n\n${protocolId}\n\nCliente: ${getClientName(loan.client)}\nValor: ${fmt(loan.value)}\nParcelas: ${loan.installments}\nData: ${fmtDate(loan.start_date)}\n\nEmitido em: ${new Date().toLocaleString("pt-BR")}`;
              navigator.clipboard.writeText(text);
              addToast(
                "Protocolo copiado para a área de transferência!",
                "success",
              );
            }}
          >
            📋 Copiar Protocolo
          </button>
        </div>
      </div>,
    );
  };

  const handleExportContract = (loan) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Logo no canto superior esquerdo com fundo
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 20, "F");

    // Tentar adicionar a logo
    try {
      doc.addImage("/logo.jpeg", "JPEG", 5, 3, 14, 14);
    } catch {
      // Se a logo não carregar, usar um placeholder com iniciais
      doc.setTextColor(240, 200, 80);
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("FC", 8, 14);
    }

    // Título ao lado da logo
    doc.setTextColor(240, 200, 80);
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("CONTRATO DE EMPRÉSTIMO", 22, 13);

    // Informações principais
    let yPos = 30;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");

    // Protocolo em destaque se existir
    if (loan.protocol) {
      doc.setFillColor(255, 243, 205); // Fundo amarelo claro
      doc.rect(10, yPos - 2, 190, 7, "F");
      doc.setFont(undefined, "bold");
      doc.setTextColor(240, 200, 80);
      doc.text(`Protocolo: ${loan.protocol}`, 12, yPos + 2);
      doc.setFont(undefined, "normal");
      doc.setTextColor(0, 0, 0);
      yPos += 10;
    }

    doc.text(`Contratante: ${getClientName(loan.client)}`, 10, yPos);
    yPos += 6;
    doc.text(`Valor do Empréstimo: ${fmt(loan.value)}`, 10, yPos);
    yPos += 6;
    doc.text(`Taxa de Juros: ${loan.interest_rate}% a.m.`, 10, yPos);
    yPos += 6;
    doc.text(`Número de Parcelas: ${loan.installments}`, 10, yPos);
    yPos += 6;
    doc.text(`Data de Contratação: ${fmtDate(loan.start_date)}`, 10, yPos);
    yPos += 12;

    // Título da tabela
    doc.setFont(undefined, "bold");
    doc.text("CRONOGRAMA DE PARCELAS", 10, yPos);
    yPos += 8;
    doc.setFont(undefined, "normal");

    // Calcular dados da amortização
    const v = Number(loan.value) || 0;
    const r = (Number(loan.interest_rate) || 0) / 100;
    const n = Number(loan.installments) || 0;
    const pmt = calcPMT(v, r, n);

    // Gerar tabela de parcelas usando autoTable
    const tableData = [];
    let balance = v;

    for (let i = 1; i <= n; i++) {
      const interest = balance * r;
      const amort = pmt - interest;
      balance -= amort;

      const due = new Date(loan.start_date + "T00:00:00");
      due.setMonth(due.getMonth() + (i - 1));
      const dueDate = due.toISOString().split("T")[0];

      tableData.push([
        i,
        dueDate,
        fmt(pmt),
        fmt(interest),
        fmt(amort),
        fmt(Math.max(balance, 0)),
      ]);
    }

    autoTable(doc, {
      head: [
        [
          "Parc.",
          "Vencimento",
          "Valor Parcela",
          "Juros",
          "Amortização",
          "Saldo Devedor",
        ],
      ],
      body: tableData,
      startY: yPos,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [240, 200, 80],
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    // Rodapé
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Documento gerado em ${new Date().toLocaleString("pt-BR")}`,
      10,
      pageHeight - 10,
    );

    doc.save(
      `contrato-${loan.id}-${getClientName(loan.client).replace(/\s+/g, "-")}.pdf`,
    );
  };

  const statusInfo = (s) =>
    STATUS_MAP[s] || { label: s, cls: "status-inactive" };

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Empréstimos</h2>
          <p className="page-desc">Gerencie os empréstimos concedidos</p>
        </div>
        <div className="header-actions">
          <button
            onClick={() => {
              localStorage.setItem("filterClientsInactive", "true");
              navigate("/clientes");
            }}
            className="btn btn-outline btn-sm"
            style={{
              marginRight: 8,
              borderColor: "var(--blue)",
              color: "var(--blue)",
            }}
          >
            📋 Inativos
          </button>
          <button onClick={handleAdd} className="btn btn-gold btn-sm">
            + Novo Empréstimo
          </button>
        </div>
      </div>

      {/* Pending Requisitions Section (Admin/Supervisor only) */}
      {(userRole === "admin" || userRole === "supervisor") &&
        pendingRequisitions.length > 0 && (
          <div
            className="card"
            style={{
              marginBottom: 20,
              borderColor: "var(--orange)",
              borderLeft: "4px solid var(--orange)",
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ color: "var(--orange)", marginBottom: 4 }}>
                ⏳ Requisições Pendentes de Aprovação (
                {pendingRequisitions.length})
              </h3>
              <p className="text-dim" style={{ fontSize: "0.85rem" }}>
                Clientes e empregados aguardam aprovação para ativar empréstimos
              </p>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Solicitante</th>
                    <th>Valor</th>
                    <th>Juros</th>
                    <th>Parcelas</th>
                    <th>Início</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequisitions.map((loan) => {
                    const pmt = calcPMT(
                      Number(loan.value) || 0,
                      (Number(loan.interest_rate) || 0) / 100,
                      Number(loan.installments) || 1,
                    );

                    return (
                      <tr key={loan.id}>
                        <td>
                          <strong>{getClientName(loan.client)}</strong>
                        </td>
                        <td>
                          <span
                            className="text-dim"
                            style={{ fontSize: "0.85rem" }}
                          >
                            {loan.created_by_name || "—"}
                          </span>
                        </td>
                        <td>
                          {fmt(loan.value)}
                          {pmt > 0 && (
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--text-dim)",
                              }}
                            >
                              {fmt(pmt)}/mês
                            </div>
                          )}
                        </td>
                        <td>
                          {loan.interest_rate
                            ? `${loan.interest_rate}% a.m.`
                            : "—"}
                        </td>
                        <td>{loan.installments}</td>
                        <td>{fmtDate(loan.start_date)}</td>
                        <td>
                          <button
                            className="btn-icon"
                            title="Aprovar"
                            style={{ color: "var(--green)" }}
                            onClick={() => {
                              openModal(
                                `Aprovar Requisição`,
                                <div className="modal-form">
                                  <div
                                    style={{
                                      marginBottom: 16,
                                      padding: "16px",
                                      background: "var(--bg-primary)",
                                      border: "1px solid var(--green)",
                                      borderRadius: 8,
                                      boxShadow:
                                        "0 4px 12px rgba(40,167,69,0.05)",
                                    }}
                                  >
                                    <h4
                                      style={{
                                        color: "var(--green)",
                                        marginBottom: 12,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                      }}
                                    >
                                      <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                      >
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                      </svg>
                                      Resumo da Aprovação
                                    </h4>
                                    <div
                                      style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: 12,
                                      }}
                                    >
                                      <div>
                                        <span
                                          className="text-dim"
                                          style={{
                                            fontSize: "0.8rem",
                                            textTransform: "uppercase",
                                            letterSpacing: 1,
                                          }}
                                        >
                                          Cliente
                                        </span>
                                        <strong
                                          style={{
                                            display: "block",
                                            fontSize: "1.05rem",
                                          }}
                                        >
                                          {getClientName(loan.client)}
                                        </strong>
                                      </div>
                                      <div>
                                        <span
                                          className="text-dim"
                                          style={{
                                            fontSize: "0.8rem",
                                            textTransform: "uppercase",
                                            letterSpacing: 1,
                                          }}
                                        >
                                          Valor
                                        </span>
                                        <strong
                                          style={{
                                            display: "block",
                                            fontSize: "1.05rem",
                                            color: "var(--gold)",
                                          }}
                                        >
                                          {fmt(loan.value)}
                                        </strong>
                                      </div>
                                      <div
                                        style={{
                                          gridColumn: "1 / -1",
                                          borderTop: "1px dashed var(--border)",
                                          paddingTop: 12,
                                          marginTop: 4,
                                        }}
                                      >
                                        <span
                                          className="text-dim"
                                          style={{
                                            fontSize: "0.8rem",
                                            textTransform: "uppercase",
                                            letterSpacing: 1,
                                          }}
                                        >
                                          Condições
                                        </span>
                                        <strong style={{ display: "block" }}>
                                          {loan.installments} parcelas de{" "}
                                          {fmt(pmt)} ao mês
                                        </strong>
                                      </div>
                                    </div>
                                  </div>
                                  <p
                                    style={{
                                      color: "var(--text-color)",
                                      marginBottom: 16,
                                      fontSize: "0.95rem",
                                      textAlign: "center",
                                    }}
                                  >
                                    Ao aprovar, o valor de{" "}
                                    <strong>{fmt(loan.value)}</strong> será
                                    imediatamente descontado do seu caixa.
                                  </p>
                                  <div className="form-actions">
                                    <button
                                      className="btn btn-outline btn-sm"
                                      onClick={closeModal}
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      className="btn btn-gold btn-sm"
                                      style={{
                                        background: "var(--green)",
                                        borderColor: "var(--green)",
                                        color: "white",
                                      }}
                                      onClick={async () => {
                                        try {
                                          await approveLoan(loan.id);
                                          closeModal();
                                        } catch {
                                          /* handled */
                                        }
                                      }}
                                    >
                                      ✓ Confirmar Aprovação
                                    </button>
                                  </div>
                                </div>,
                              );
                            }}
                          >
                            ✓
                          </button>
                          <button
                            className="btn-icon"
                            title="Rejeitar"
                            style={{ color: "var(--red)" }}
                            onClick={() => {
                              openModal(
                                `Rejeição de Crédito`,
                                <RejectForm
                                  loan={loan}
                                  onCancel={closeModal}
                                  onConfirm={async (reason) => {
                                    try {
                                      await rejectLoan(loan.id, reason);
                                      closeModal();
                                    } catch {
                                      /* handled */
                                    }
                                  }}
                                />,
                              );
                            }}
                          >
                            ✗
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
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
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total Emprestado (Ativo)</span>
            <span className="kpi-value">{fmt(totalLent)}</span>
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
            <svg
              width="22"
              height="22"
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
            <span className="kpi-label">Empréstimos Ativos</span>
            <span className="kpi-value">{activeLoans.length}</span>
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
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
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
                    Number(loan.installments) || 1,
                  );

                  // Calcular parcelas vencidas não pagas
                  let overdueInstallments = 0;
                  if (loan.start_date) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const start = new Date(loan.start_date + "T00:00:00");
                    const paid = Number(loan.paid) || 0;

                    for (
                      let i = 1;
                      i <= (Number(loan.installments) || 0);
                      i++
                    ) {
                      if (i <= paid) continue; // Já paga
                      const due = new Date(start);
                      due.setMonth(due.getMonth() + (i - 1));
                      if (due < today) {
                        overdueInstallments++;
                      }
                    }
                  }

                  return (
                    <tr
                      key={loan.id}
                      className={loan.status === "overdue" ? "row-overdue" : ""}
                    >
                      <td>
                        <strong>{getClientName(loan.client)}</strong>
                        {overdueInstallments > 0 && (
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--red)",
                              fontWeight: 600,
                              marginTop: 2,
                            }}
                          >
                            ⚠️ {overdueInstallments} parcela
                            {overdueInstallments !== 1 ? "s" : ""} em atraso
                          </div>
                        )}
                      </td>
                      <td>
                        {fmt(loan.value)}
                        {pmt > 0 && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-dim)",
                            }}
                          >
                            {fmt(pmt)}/mês
                          </div>
                        )}
                      </td>
                      <td>
                        {loan.interest_rate
                          ? `${loan.interest_rate}% a.m.`
                          : "—"}
                      </td>
                      <td>{loan.installments}</td>
                      <td>
                        <span
                          style={{
                            color:
                              loan.paid >= loan.installments
                                ? "var(--green)"
                                : "var(--text)",
                          }}
                        >
                          {loan.paid}
                        </span>
                        /{loan.installments}
                      </td>
                      <td>{fmtDate(loan.start_date)}</td>
                      <td>
                        <span className={`status ${si.cls}`}>{si.label}</span>
                      </td>
                      <td>
                        <button
                          className="btn-icon"
                          title="Tabela de Amortização"
                          onClick={() => handleViewAmortization(loan)}
                        >
                          📊
                        </button>
                        <button
                          className="btn-icon"
                          title="Protokolo"
                          onClick={() => handleViewProtocol(loan)}
                        >
                          📋
                        </button>
                        <button
                          className="btn-icon"
                          title="Baixar Contrato (PDF)"
                          onClick={() => handleExportContract(loan)}
                        >
                          📄
                        </button>
                        {(userRole === "admin" ||
                          employees?.find((e) => e.id === currentUser?.id)
                            ?.permissions?.can_register_payment) && (
                          <button
                            className="btn-icon"
                            title="Registrar Pagamento"
                            onClick={() => handleRegisterPayment(loan)}
                          >
                            💰
                          </button>
                        )}
                        {userRole === "admin" && (
                          <button
                            className="btn-icon"
                            title="Editar"
                            onClick={() => handleEdit(loan)}
                          >
                            ✏️
                          </button>
                        )}
                        {userRole === "admin" && (
                          <button
                            className="btn-icon"
                            title="Excluir"
                            onClick={() => handleDelete(loan)}
                          >
                            🗑️
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
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
                    {search || filterStatus
                      ? "Nenhum empréstimo encontrado."
                      : "Nenhum empréstimo cadastrado. Clique em + Novo Empréstimo para começar."}
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
