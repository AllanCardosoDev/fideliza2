// src/pages/Funcionarios.jsx
import React, { useContext, useState, useCallback } from "react";
import { AppContext } from "../App";
import { fmt, fmtDate, maskPhone } from "../utils/helpers";

const today = () => new Date().toISOString().split("T")[0];

const EMPTY_EMPLOYEE = {
  name: "",
  role: "",
  department: "",
  phone: "",
  email: "",
  salary: "",
  admission: today(),
  status: "active",
  username: "",
  password: "",
  access_level: "employee",
};

const STATUS_OPTS = [
  { value: "active", label: "Ativo", cls: "status-active" },
  { value: "inactive", label: "Inativo", cls: "status-inactive" },
];

const ACCESS_OPTS = [
  { value: "employee", label: "Funcionário" },
  { value: "admin", label: "Administrador" },
];

function EmployeeForm({ initial = EMPTY_EMPLOYEE, onSave, onCancel, isSaving }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Nome é obrigatório.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "E-mail inválido.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        ...form,
        salary: form.salary !== "" ? parseFloat(String(form.salary).replace(",", ".")) : null,
      });
    }
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>Nome *</label>
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
          <label>Cargo</label>
          <input
            type="text"
            value={form.role}
            onChange={(e) => set("role", e.target.value)}
            placeholder="Ex: Vendedor"
          />
        </div>
        <div className="form-row">
          <label>Departamento</label>
          <input
            type="text"
            value={form.department}
            onChange={(e) => set("department", e.target.value)}
            placeholder="Ex: Comercial"
          />
        </div>
      </div>
      <div className="form-row-2">
        <div className="form-row">
          <label>Telefone</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => set("phone", maskPhone(e.target.value))}
            placeholder="(00) 00000-0000"
          />
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
      </div>
      <div className="form-row-2">
        <div className="form-row">
          <label>Salário (R$)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.salary}
            onChange={(e) => set("salary", e.target.value)}
            placeholder="0,00"
          />
        </div>
        <div className="form-row">
          <label>Data de Admissão</label>
          <input
            type="date"
            value={form.admission}
            onChange={(e) => set("admission", e.target.value)}
          />
        </div>
      </div>
      <div className="form-row-2">
        <div className="form-row">
          <label>Status</label>
          <select value={form.status} onChange={(e) => set("status", e.target.value)}>
            {STATUS_OPTS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>Nível de Acesso</label>
          <select value={form.access_level} onChange={(e) => set("access_level", e.target.value)}>
            {ACCESS_OPTS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 4 }}>
        <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginBottom: 8 }}>
          Credenciais de Login (opcional)
        </p>
        <div className="form-row-2">
          <div className="form-row">
            <label>Usuário (login)</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              placeholder="nome.sobrenome"
              autoComplete="off"
            />
          </div>
          <div className="form-row">
            <label>Senha</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Senha de acesso"
                autoComplete="new-password"
                style={{ paddingRight: 36 }}
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)",
                  fontSize: 14,
                }}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
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

function Funcionarios() {
  const {
    employees, setEmployees,
    openModal, closeModal, addToast,
    createEmployeeRecord, editEmployeeRecord, removeEmployeeRecord,
    authToken,
  } = useContext(AppContext);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isOffline = authToken === "offline";

  const handleAddEmployee = useCallback(() => {
    openModal(
      "Novo Funcionário",
      <EmployeeForm
        onSave={async (data) => {
          setIsSaving(true);
          try {
            await createEmployeeRecord(data);
            closeModal();
          } finally {
            setIsSaving(false);
          }
        }}
        onCancel={closeModal}
        isSaving={isSaving}
      />,
    );
  }, [openModal, closeModal, createEmployeeRecord, isSaving]);

  const handleAddEmployeeDemo = useCallback(() => {
    openModal(
      "Novo Funcionário",
      <EmployeeForm
        onSave={(data) => {
          setEmployees((prev) => [{ ...data, id: Date.now() }, ...prev]);
          addToast("Funcionário adicionado!", "success");
          closeModal();
        }}
        onCancel={closeModal}
        isSaving={false}
      />,
    );
  }, [openModal, closeModal, setEmployees, addToast]);

  const handleEditEmployee = useCallback((emp) => {
    openModal(
      "Editar Funcionário",
      <EmployeeForm
        initial={{
          ...EMPTY_EMPLOYEE,
          ...emp,
          salary: emp.salary ?? "",
          department: emp.department ?? "",
          admission: emp.admission ?? today(),
          username: emp.username ?? "",
          password: emp.password ?? "",
          access_level: emp.access_level ?? "employee",
        }}
        onSave={async (data) => {
          setIsSaving(true);
          try {
            await editEmployeeRecord(emp.id, data);
            closeModal();
          } finally {
            setIsSaving(false);
          }
        }}
        onCancel={closeModal}
        isSaving={isSaving}
      />,
    );
  }, [openModal, closeModal, editEmployeeRecord, isSaving]);

  const handleDeleteEmployee = useCallback((emp) => {
    openModal(
      "Excluir Funcionário",
      <div>
        <p style={{ color: "var(--text)", marginBottom: 16 }}>
          Tem certeza que deseja excluir o funcionário <strong>{emp.name}</strong>?
        </p>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={closeModal}>Cancelar</button>
          <button
            className="btn btn-danger"
            onClick={async () => {
              await removeEmployeeRecord(emp.id);
              closeModal();
            }}
          >
            Excluir
          </button>
        </div>
      </div>,
    );
  }, [openModal, closeModal, removeEmployeeRecord]);

  const filtered = employees.filter((emp) => {
    const matchSearch =
      !search ||
      (emp.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (emp.role || "").toLowerCase().includes(search.toLowerCase()) ||
      (emp.department || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || emp.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalActive = employees.filter((e) => e.status === "active").length;
  const totalPayroll = employees.reduce((sum, e) => sum + Number(e.salary || 0), 0);
  const averageSalary = employees.length > 0 ? totalPayroll / employees.length : 0;

  const statusLabel = (s) => STATUS_OPTS.find((o) => o.value === s)?.label || s;
  const statusCls = (s) => STATUS_OPTS.find((o) => o.value === s)?.cls || "";

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Funcionários</h2>
          <p className="page-desc">Gestão de equipe</p>
        </div>
        <div className="header-actions">
          <button
            onClick={isOffline ? handleAddEmployeeDemo : handleAddEmployee}
            className="btn btn-gold btn-sm"
          >
            + Novo Funcionário
          </button>
        </div>
      </div>

      <div className="kpi-grid kpi-grid-3">
        <div className="kpi-card kpi-clients">
          <div className="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Ativos</span>
            <span className="kpi-value">{totalActive}</span>
          </div>
        </div>
        <div className="kpi-card kpi-expense">
          <div className="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Folha Mensal</span>
            <span className="kpi-value">{fmt(totalPayroll)}</span>
          </div>
        </div>
        <div className="kpi-card kpi-profit">
          <div className="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 20V10" />
              <path d="M12 20V4" />
              <path d="M6 20v-6" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Salário Médio</span>
            <span className="kpi-value">{fmt(averageSalary)}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="🔍  Buscar funcionário..."
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
                <th>Nome</th>
                <th>Cargo</th>
                <th>Departamento</th>
                <th>Telefone</th>
                <th>Salário</th>
                <th>Admissão</th>
                <th>Acesso</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.name}</td>
                    <td>{emp.role || "—"}</td>
                    <td>{emp.department || "—"}</td>
                    <td>{emp.phone || "—"}</td>
                    <td>{emp.salary != null && emp.salary !== "" ? fmt(emp.salary) : "—"}</td>
                    <td>{fmtDate(emp.admission)}</td>
                    <td>
                      <span className={`status ${emp.access_level === "admin" ? "status-active" : ""}`}>
                        {emp.access_level === "admin" ? "Admin" : "Funcionário"}
                      </span>
                    </td>
                    <td>
                      <span className={`status ${statusCls(emp.status)}`}>
                        {statusLabel(emp.status)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn-action"
                          onClick={() => handleEditEmployee(emp)}
                          disabled={isOffline}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-action"
                          onClick={() => handleDeleteEmployee(emp)}
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
                  <td colSpan="9" style={{ textAlign: "center", padding: "20px", color: "var(--text-dim)" }}>
                    Nenhum funcionário cadastrado.
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

export default Funcionarios;
