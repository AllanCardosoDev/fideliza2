// src/pages/Vendas.jsx
import React, { useContext, useState, useCallback } from "react";
import { AppContext } from "../App";
import { fmt, fmtDate } from "../utils/helpers";

const today = () => new Date().toISOString().split("T")[0];

const EMPTY_SALE = {
  description: "",
  client: "",
  value: "",
  status: "pending",
  date: today(),
};

const STATUS_OPTS = [
  { value: "pending", label: "Pendente", cls: "status-pending" },
  { value: "paid", label: "Pago", cls: "status-active" },
  { value: "delivered", label: "Entregue", cls: "status-completed" },
];

function SaleForm({ initial = EMPTY_SALE, clients = [], onSave, onCancel, isSaving }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.description.trim()) e.description = "Descrição é obrigatória.";
    if (!form.value || isNaN(Number(form.value)) || Number(form.value) <= 0)
      e.value = "Valor inválido.";
    if (!form.date) e.date = "Data é obrigatória.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate())
      onSave({ ...form, value: parseFloat(String(form.value).replace(",", ".")) });
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>Descrição *</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Produto ou serviço vendido"
          className={errors.description ? "input-error" : ""}
        />
        {errors.description && <span className="field-error">{errors.description}</span>}
      </div>
      <div className="form-row-2">
        <div className="form-row">
          <label>Cliente</label>
          {clients.length > 0 ? (
            <select value={form.client} onChange={(e) => set("client", e.target.value)}>
              <option value="">Selecione...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={form.client}
              onChange={(e) => set("client", e.target.value)}
              placeholder="Nome do cliente"
            />
          )}
        </div>
        <div className="form-row">
          <label>Status</label>
          <select value={form.status} onChange={(e) => set("status", e.target.value)}>
            {STATUS_OPTS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-row-2">
        <div className="form-row">
          <label>Valor (R$) *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.value}
            onChange={(e) => set("value", e.target.value)}
            placeholder="0,00"
            className={errors.value ? "input-error" : ""}
          />
          {errors.value && <span className="field-error">{errors.value}</span>}
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
      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-gold" disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

function Vendas() {
  const {
    sales, setSales, clients,
    openModal, closeModal, addToast,
    createSaleRecord, editSaleRecord, removeSaleRecord,
    authToken,
  } = useContext(AppContext);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleAddSale = useCallback(() => {
    openModal(
      "Nova Venda",
      <SaleForm
        clients={clients}
        onSave={async (data) => {
          setIsSaving(true);
          try {
            await createSaleRecord(data);
            closeModal();
          } finally {
            setIsSaving(false);
          }
        }}
        onCancel={closeModal}
        isSaving={isSaving}
      />,
    );
  }, [openModal, closeModal, clients, createSaleRecord, isSaving]);

  const handleEditSale = useCallback((sale) => {
    openModal(
      "Editar Venda",
      <SaleForm
        initial={{ ...sale, value: sale.value ?? "" }}
        clients={clients}
        onSave={async (data) => {
          setIsSaving(true);
          try {
            await editSaleRecord(sale.id, data);
            closeModal();
          } finally {
            setIsSaving(false);
          }
        }}
        onCancel={closeModal}
        isSaving={isSaving}
      />,
    );
  }, [openModal, closeModal, clients, editSaleRecord, isSaving]);

  const handleDeleteSale = useCallback((sale) => {
    openModal(
      "Excluir Venda",
      <div>
        <p style={{ color: "var(--text)", marginBottom: 16 }}>
          Tem certeza que deseja excluir a venda <strong>{sale.description}</strong>?
        </p>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={closeModal}>Cancelar</button>
          <button
            className="btn btn-danger"
            onClick={async () => {
              await removeSaleRecord(sale.id);
              closeModal();
            }}
          >
            Excluir
          </button>
        </div>
      </div>,
    );
  }, [openModal, closeModal, removeSaleRecord]);

  // Demo mode: add sale locally
  const handleAddSaleDemo = useCallback(() => {
    openModal(
      "Nova Venda",
      <SaleForm
        clients={clients}
        onSave={(data) => {
          const newSale = { ...data, id: Date.now() };
          setSales((prev) => [newSale, ...prev]);
          addToast("Venda adicionada!", "success");
          closeModal();
        }}
        onCancel={closeModal}
        isSaving={false}
      />,
    );
  }, [openModal, closeModal, clients, setSales, addToast]);

  const isOffline = authToken === "offline";

  const filtered = sales.filter((s) => {
    const matchSearch =
      !search ||
      (s.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.client || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalSalesValue = sales.reduce((sum, s) => sum + Number(s.value || 0), 0);
  const paidCount = sales.filter((s) => s.status === "paid").length;
  const averageTicket = sales.length > 0 ? totalSalesValue / sales.length : 0;

  const statusLabel = (s) =>
    STATUS_OPTS.find((o) => o.value === s)?.label || s;
  const statusCls = (s) =>
    STATUS_OPTS.find((o) => o.value === s)?.cls || "";

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Vendas</h2>
          <p className="page-desc">Registro e acompanhamento de vendas</p>
        </div>
        <div className="header-actions">
          <button
            onClick={isOffline ? handleAddSaleDemo : handleAddSale}
            className="btn btn-gold btn-sm"
          >
            + Nova Venda
          </button>
        </div>
      </div>

      <div className="kpi-grid kpi-grid-3">
        <div className="kpi-card kpi-revenue">
          <div className="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total de Vendas</span>
            <span className="kpi-value">{fmt(totalSalesValue)}</span>
          </div>
        </div>
        <div className="kpi-card kpi-profit">
          <div className="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Vendas Pagas</span>
            <span className="kpi-value">{paidCount}</span>
          </div>
        </div>
        <div className="kpi-card kpi-clients">
          <div className="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 20V10" />
              <path d="M12 20V4" />
              <path d="M6 20v-6" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Ticket Médio</span>
            <span className="kpi-value">{fmt(averageTicket)}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="🔍  Buscar venda..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Todos</option>
            {STATUS_OPTS.map((o) => (
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
                <th>Cliente</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((sale) => (
                  <tr key={sale.id}>
                    <td>{fmtDate(sale.date)}</td>
                    <td>{sale.description}</td>
                    <td>{sale.client || "—"}</td>
                    <td>{fmt(sale.value)}</td>
                    <td>
                      <span className={`status ${statusCls(sale.status)}`}>
                        {statusLabel(sale.status)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn-action"
                          onClick={() => handleEditSale(sale)}
                          disabled={isOffline}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-action"
                          onClick={() => handleDeleteSale(sale)}
                          disabled={isOffline}
                          title="Excluir"
                          style={{ color: "var(--danger, #e74c3c)" }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "var(--text-dim)" }}>
                    Nenhuma venda registrada.
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

export default Vendas;
