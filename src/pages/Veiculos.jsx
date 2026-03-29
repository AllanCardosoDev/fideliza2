// src/pages/Veiculos.jsx
import React, { useContext } from "react";
import { AppContext } from "../App";
// import '../styles/Veiculos.css'; // REMOVA esta linha

function Veiculos() {
  const { vehicles, openModal, addToast } = useContext(AppContext);

  const handleAddVehicle = () => {
    openModal(
      "Novo Veículo",
      <div>
        <p style={{ color: "var(--text)" }}>
          Formulário para adicionar veículo...
        </p>
        <button
          className="btn btn-gold btn-sm"
          onClick={() => {
            addToast("Veículo adicionado!", "success");
            openModal(false);
          }}
        >
          Salvar
        </button>
      </div>,
    );
  };

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Veículos</h2>
          <p className="page-desc">Estoque de veículos disponíveis</p>
        </div>
        <div className="header-actions">
          <button onClick={handleAddVehicle} className="btn btn-gold btn-sm">
            + Novo Veículo
          </button>
        </div>
      </div>

      <div id="vehicles-grid" className="vehicles-grid">
        {vehicles.length > 0 ? (
          vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="vehicle-card animate-in"
              style={{ "--delay": vehicle.id }}
            >
              <div className="vehicle-img">
                🚗 {/* Ícone simples, pode ser substituído por imagem */}
              </div>
              <div className="vehicle-body">
                <div className="vehicle-title">
                  {vehicle.model} ({vehicle.year})
                </div>
                <div className="vehicle-meta">
                  Status:{" "}
                  <span
                    className={`status ${vehicle.status === "available" ? "status-active" : "status-inactive"}`}
                  >
                    {vehicle.status === "available" ? "Disponível" : "Vendido"}
                  </span>
                </div>
                <div className="vehicle-price">
                  R${" "}
                  {vehicle.price.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <div className="vehicle-tags">
                  {vehicle.tags.map((tag, index) => (
                    <span key={index} className="vehicle-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: "15px", display: "flex", gap: "8px" }}>
                  <button className="btn-action">Editar</button>
                  <button className="btn-action">Vender</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p
            style={{
              padding: "20px",
              textAlign: "center",
              color: "var(--text-dim)",
              gridColumn: "1 / -1",
            }}
          >
            Nenhum veículo cadastrado.
          </p>
        )}
      </div>
    </div>
  );
}

export default Veiculos;
