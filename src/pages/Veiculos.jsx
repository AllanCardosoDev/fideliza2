// src/pages/Veiculos.jsx
import React, { useContext, useState, useCallback } from "react";
import { AppContext } from "../App";
import { fmt } from "../utils/helpers";

const EMPTY_VEHICLE = {
  model: "",
  plate: "",
  year: new Date().getFullYear(),
  color: "",
  status: "available",
  price: "",
  km: "",
  notes: "",
};

const STATUS_OPTS = [
  { value: "available", label: "Disponível", cls: "status-active" },
  { value: "sold", label: "Vendido", cls: "status-inactive" },
  { value: "maintenance", label: "Manutenção", cls: "status-pending" },
];

function VehicleForm({ initial = EMPTY_VEHICLE, onSave, onCancel, isSaving }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.model.trim()) e.model = "Modelo é obrigatório.";
    if (!form.plate.trim()) e.plate = "Placa é obrigatória.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        ...form,
        price: form.price !== "" ? parseFloat(String(form.price).replace(",", ".")) : null,
        km: form.km !== "" ? parseInt(form.km, 10) : null,
        year: form.year ? parseInt(form.year, 10) : null,
      });
    }
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>Modelo *</label>
        <input
          type="text"
          value={form.model}
          onChange={(e) => set("model", e.target.value)}
          placeholder="Ex: Fiat Uno 1.0"
          className={errors.model ? "input-error" : ""}
        />
        {errors.model && <span className="field-error">{errors.model}</span>}
      </div>
      <div className="form-row-2">
        <div className="form-row">
          <label>Placa *</label>
          <input
            type="text"
            value={form.plate}
            onChange={(e) => set("plate", e.target.value.toUpperCase())}
            placeholder="ABC-1234"
            className={errors.plate ? "input-error" : ""}
          />
          {errors.plate && <span className="field-error">{errors.plate}</span>}
        </div>
        <div className="form-row">
          <label>Ano</label>
          <input
            type="number"
            min="1900"
            max={new Date().getFullYear() + 1}
            value={form.year}
            onChange={(e) => set("year", e.target.value)}
            placeholder="2024"
          />
        </div>
      </div>
      <div className="form-row-2">
        <div className="form-row">
          <label>Cor</label>
          <input
            type="text"
            value={form.color}
            onChange={(e) => set("color", e.target.value)}
            placeholder="Ex: Prata"
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
      </div>
      <div className="form-row-2">
        <div className="form-row">
          <label>Preço (R$)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            placeholder="0,00"
          />
        </div>
        <div className="form-row">
          <label>KM</label>
          <input
            type="number"
            min="0"
            value={form.km}
            onChange={(e) => set("km", e.target.value)}
            placeholder="0"
          />
        </div>
      </div>
      <div className="form-row">
        <label>Observações</label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Informações adicionais..."
          rows={3}
        />
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

function Veiculos() {
  const {
    vehicles, setVehicles,
    openModal, closeModal, addToast,
    createVehicleRecord, editVehicleRecord, removeVehicleRecord,
    authToken,
  } = useContext(AppContext);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isOffline = authToken === "offline";

  const handleAddVehicle = useCallback(() => {
    openModal(
      "Novo Veículo",
      <VehicleForm
        onSave={async (data) => {
          setIsSaving(true);
          try {
            await createVehicleRecord(data);
            closeModal();
          } finally {
            setIsSaving(false);
          }
        }}
        onCancel={closeModal}
        isSaving={isSaving}
      />,
    );
  }, [openModal, closeModal, createVehicleRecord, isSaving]);

  const handleAddVehicleDemo = useCallback(() => {
    openModal(
      "Novo Veículo",
      <VehicleForm
        onSave={(data) => {
          setVehicles((prev) => [{ ...data, id: Date.now() }, ...prev]);
          addToast("Veículo adicionado!", "success");
          closeModal();
        }}
        onCancel={closeModal}
        isSaving={false}
      />,
    );
  }, [openModal, closeModal, setVehicles, addToast]);

  const handleEditVehicle = useCallback((vehicle) => {
    openModal(
      "Editar Veículo",
      <VehicleForm
        initial={{ ...EMPTY_VEHICLE, ...vehicle, price: vehicle.price ?? "", km: vehicle.km ?? "", notes: vehicle.notes ?? "" }}
        onSave={async (data) => {
          setIsSaving(true);
          try {
            await editVehicleRecord(vehicle.id, data);
            closeModal();
          } finally {
            setIsSaving(false);
          }
        }}
        onCancel={closeModal}
        isSaving={isSaving}
      />,
    );
  }, [openModal, closeModal, editVehicleRecord, isSaving]);

  const handleDeleteVehicle = useCallback((vehicle) => {
    openModal(
      "Excluir Veículo",
      <div>
        <p style={{ color: "var(--text)", marginBottom: 16 }}>
          Tem certeza que deseja excluir o veículo <strong>{vehicle.model}</strong>?
        </p>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={closeModal}>Cancelar</button>
          <button
            className="btn btn-danger"
            onClick={async () => {
              await removeVehicleRecord(vehicle.id);
              closeModal();
            }}
          >
            Excluir
          </button>
        </div>
      </div>,
    );
  }, [openModal, closeModal, removeVehicleRecord]);

  const filtered = vehicles.filter((v) => {
    const matchSearch =
      !search ||
      (v.model || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.plate || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.color || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || v.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const availableCount = vehicles.filter((v) => v.status === "available").length;
  const soldCount = vehicles.filter((v) => v.status === "sold").length;
  const totalValue = vehicles
    .filter((v) => v.status === "available")
    .reduce((sum, v) => sum + Number(v.price || 0), 0);

  const statusLabel = (s) => STATUS_OPTS.find((o) => o.value === s)?.label || s;
  const statusCls = (s) => STATUS_OPTS.find((o) => o.value === s)?.cls || "";

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Veículos</h2>
          <p className="page-desc">Estoque de veículos</p>
        </div>
        <div className="header-actions">
          <button
            onClick={isOffline ? handleAddVehicleDemo : handleAddVehicle}
            className="btn btn-gold btn-sm"
          >
            + Novo Veículo
          </button>
        </div>
      </div>

      <div className="kpi-grid kpi-grid-3">
        <div className="kpi-card kpi-clients">
          <div className="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 17h14" />
              <path d="M6 17l-1-5h14l-1 5" />
              <path d="M8 12l1-4h6l1 4" />
              <circle cx="7.5" cy="17" r="1.5" />
              <circle cx="16.5" cy="17" r="1.5" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Disponíveis</span>
            <span className="kpi-value">{availableCount}</span>
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
            <span className="kpi-label">Vendidos</span>
            <span className="kpi-value">{soldCount}</span>
          </div>
        </div>
        <div className="kpi-card kpi-revenue">
          <div className="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Valor em Estoque</span>
            <span className="kpi-value">{fmt(totalValue)}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="🔍  Buscar veículo..."
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
                <th>Modelo</th>
                <th>Placa</th>
                <th>Ano</th>
                <th>Cor</th>
                <th>Preço</th>
                <th>KM</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>{vehicle.model}</td>
                    <td>{vehicle.plate || "—"}</td>
                    <td>{vehicle.year || "—"}</td>
                    <td>{vehicle.color || "—"}</td>
                    <td>{vehicle.price != null ? fmt(vehicle.price) : "—"}</td>
                    <td>{vehicle.km != null ? Number(vehicle.km).toLocaleString("pt-BR") + " km" : "—"}</td>
                    <td>
                      <span className={`status ${statusCls(vehicle.status)}`}>
                        {statusLabel(vehicle.status)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn-action"
                          onClick={() => handleEditVehicle(vehicle)}
                          disabled={isOffline}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-action"
                          onClick={() => handleDeleteVehicle(vehicle)}
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
                  <td colSpan="8" style={{ textAlign: "center", padding: "20px", color: "var(--text-dim)" }}>
                    Nenhum veículo cadastrado.
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

export default Veiculos;
