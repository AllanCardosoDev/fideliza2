// src/pages/Clientes.jsx
import React, { useContext, useState, useCallback } from "react";
import { AppContext } from "../App";
import { maskCpfCnpj, maskPhone, validateCpfCnpj, fmt } from "../utils/helpers";

const STATUS_OPTS = [
  { value: "active", label: "Ativo", cls: "status-active" },
  { value: "inactive", label: "Inativo", cls: "status-inactive" },
  { value: "overdue", label: "Inadimplente", cls: "status-overdue" },
];

const EMPTY_FORM = {
  name: "",
  cpf_cnpj: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
  status: "active",
};

function ClientForm({ initial = EMPTY_FORM, onSave, onCancel, isSaving }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Nome é obrigatório.";
    if (!form.cpf_cnpj.trim()) {
      e.cpf_cnpj = "CPF/CNPJ é obrigatório.";
    } else if (!validateCpfCnpj(form.cpf_cnpj)) {
      e.cpf_cnpj = "CPF/CNPJ inválido.";
    }
    if (!form.phone.trim()) e.phone = "Telefone é obrigatório.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "E-mail inválido.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSave(form);
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>Nome Completo *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Nome completo"
          className={errors.name ? "input-error" : ""}
        />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </div>
      <div className="form-row-2">
        <div className="form-row">
          <label>CPF / CNPJ *</label>
          <input
            type="text"
            value={form.cpf_cnpj}
            onChange={(e) => set("cpf_cnpj", maskCpfCnpj(e.target.value))}
            placeholder="000.000.000-00"
            className={errors.cpf_cnpj ? "input-error" : ""}
          />
          {errors.cpf_cnpj && <span className="field-error">{errors.cpf_cnpj}</span>}
        </div>
        <div className="form-row">
          <label>Telefone *</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => set("phone", maskPhone(e.target.value))}
            placeholder="(00) 00000-0000"
            className={errors.phone ? "input-error" : ""}
          />
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </div>
      </div>
      <div className="form-row">
        <label>E-mail</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="email@exemplo.com"
          className={errors.email ? "input-error" : ""}
        />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </div>
      <div className="form-row">
        <label>Endereço</label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
          placeholder="Rua, número, bairro, cidade"
        />
      </div>
      <div className="form-row">
        <label>Status</label>
        <select value={form.status} onChange={(e) => set("status", e.target.value)}>
          {STATUS_OPTS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>Observações</label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Observações sobre o cliente..."
          rows={3}
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

function Clientes() {
  const {
    clients,
    loans,
    openModal,
    closeModal,
    createClientRecord,
    editClientRecord,
    removeClientRecord,
  } = useContext(AppContext);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const filtered = clients.filter((c) => {
    const matchSearch = [c.name, c.email, c.phone, c.cpf_cnpj, c.address]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchStatus = filterStatus ? c.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  // Calculate outstanding balance per client from loans
  const clientBalance = useCallback(
    (clientId) => {
      return loans
        .filter((l) => l.client_id === clientId && l.status !== "paid" && l.status !== "cancelled")
        .reduce((sum, l) => sum + (Number(l.value) || 0), 0);
    },
    [loans]
  );

  const handleAdd = () => {
    openModal(
      "Novo Cliente",
      <ClientForm
        onSave={async (form) => {
          setIsSaving(true);
          try {
            await createClientRecord(form);
            closeModal();
          } catch {
            // error handled in context
          } finally {
            setIsSaving(false);
          }
        }}
        onCancel={closeModal}
        isSaving={isSaving}
      />
    );
  };

  const handleEdit = (client) => {
    openModal(
      "Editar Cliente",
      <ClientForm
        initial={{
          name: client.name || "",
          cpf_cnpj: client.cpf_cnpj || "",
          phone: client.phone || "",
          email: client.email || "",
          address: client.address || "",
          notes: client.notes || "",
          status: client.status || "active",
        }}
        onSave={async (form) => {
          setIsSaving(true);
          try {
            await editClientRecord(client.id, form);
            closeModal();
          } catch {
            // error handled in context
          } finally {
            setIsSaving(false);
          }
        }}
        onCancel={closeModal}
        isSaving={isSaving}
      />
    );
  };

  const handleDelete = (client) => {
    openModal(
      "Confirmar Exclusão",
      <div className="modal-confirm">
        <p>Tem certeza que deseja excluir <strong>{client.name}</strong>?</p>
        <p className="text-dim">Esta ação não pode ser desfeita.</p>
        <div className="form-actions">
          <button className="btn btn-outline btn-sm" onClick={closeModal}>
            Cancelar
          </button>
          <button
            className="btn btn-danger btn-sm"
            disabled={deletingId === client.id}
            onClick={async () => {
              setDeletingId(client.id);
              try {
                await removeClientRecord(client.id);
                closeModal();
              } catch {
                // error handled in context
              } finally {
                setDeletingId(null);
              }
            }}
          >
            {deletingId === client.id ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    );
  };

  const handleViewLoans = (client) => {
    const clientLoans = loans.filter(
      (l) => l.client_id === client.id || l.client === client.name
    );
    openModal(
      `Empréstimos — ${client.name}`,
      <div>
        {clientLoans.length === 0 ? (
          <p className="text-dim" style={{ padding: "20px", textAlign: "center" }}>
            Nenhum empréstimo para este cliente.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Valor</th>
                  <th>Parcelas</th>
                  <th>Pagas</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {clientLoans.map((l) => (
                  <tr key={l.id}>
                    <td>{fmt(l.value)}</td>
                    <td>{l.installments}</td>
                    <td>{l.paid}</td>
                    <td>
                      <span className={`status status-${l.status}`}>
                        {l.status === "active" ? "Ativo" : l.status === "paid" ? "Pago" : l.status === "overdue" ? "Atrasado" : l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ marginTop: 12, textAlign: "right" }}>
          <button className="btn btn-outline btn-sm" onClick={closeModal}>Fechar</button>
        </div>
      </div>
    );
  };

  const statusInfo = (status) =>
    STATUS_OPTS.find((o) => o.value === status) || { label: status, cls: "status-inactive" };

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Clientes</h2>
          <p className="page-desc">Gerencie sua carteira de clientes</p>
        </div>
        <div className="header-actions">
          <button onClick={handleAdd} className="btn btn-gold btn-sm">
            + Novo Cliente
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid kpi-grid-3" style={{ marginBottom: 20 }}>
        <div className="kpi-card kpi-clients">
          <div className="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total de Clientes</span>
            <span className="kpi-value">{clients.length}</span>
          </div>
        </div>
        <div className="kpi-card kpi-revenue">
          <div className="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Clientes Ativos</span>
            <span className="kpi-value">{clients.filter((c) => c.status === "active").length}</span>
          </div>
        </div>
        <div className="kpi-card kpi-expense">
          <div className="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Inadimplentes</span>
            <span className="kpi-value">{clients.filter((c) => c.status === "overdue").length}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="🔍  Buscar por nome, CPF, telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            {STATUS_OPTS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF / CNPJ</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Status</th>
                <th>Saldo Devedor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((c) => {
                  const si = statusInfo(c.status);
                  return (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.name}</strong>
                        {c.address && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{c.address}</div>
                        )}
                      </td>
                      <td>{c.cpf_cnpj || "—"}</td>
                      <td>{c.phone || "—"}</td>
                      <td>{c.email || "—"}</td>
                      <td><span className={`status ${si.cls}`}>{si.label}</span></td>
                      <td>{fmt(clientBalance(c.id))}</td>
                      <td>
                        <button
                          className="btn-icon"
                          title="Ver empréstimos"
                          onClick={() => handleViewLoans(c)}
                        >💳</button>
                        <button
                          className="btn-icon"
                          title="Editar"
                          onClick={() => handleEdit(c)}
                        >✏️</button>
                        <button
                          className="btn-icon"
                          title="Excluir"
                          onClick={() => handleDelete(c)}
                        >🗑️</button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "var(--text-dim)" }}>
                    {search || filterStatus ? "Nenhum cliente encontrado com os filtros aplicados." : "Nenhum cliente cadastrado. Clique em + Novo Cliente para começar."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div style={{ padding: "12px 16px", color: "var(--text-dim)", fontSize: "0.8rem" }}>
            Exibindo {filtered.length} de {clients.length} cliente{clients.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

export default Clientes;
