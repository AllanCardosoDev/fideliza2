// src/pages/Clientes.jsx
import React, { useContext } from "react";
import { AppContext } from "../App";
// import '../styles/Clients.css'; // REMOVA esta linha

function Clientes() {
  const { clients, addToast, openModal } = useContext(AppContext);

  const handleAddClient = () => {
    openModal(
      "Novo Cliente",
      <div>
        <p style={{ color: "var(--text)" }}>
          Formulário para adicionar cliente...
        </p>
        <button
          className="btn btn-gold btn-sm"
          onClick={() => {
            addToast("Cliente adicionado!", "success");
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
      {" "}
      {/* Adiciona a classe 'active' para ser exibida */}
      <div className="page-header">
        <div>
          <h2>Clientes</h2>
          <p className="page-desc">Gerencie sua carteira de clientes</p>
        </div>
        <div className="header-actions">
          <button onClick={handleAddClient} className="btn btn-gold btn-sm">
            + Novo Cliente
          </button>
        </div>
      </div>
      <div className="card">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="🔍  Buscar cliente..."
          />
          <select className="select-sm">
            <option value="">Todos</option>
            <option value="active">Ativos</option>
            <option value="pending">Pendentes</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>Status</th>
                <th>Saldo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clients.length > 0 ? (
                clients.map((client) => (
                  <tr key={client.id}>
                    <td>{client.name}</td>
                    <td>{client.email}</td>
                    <td>{client.phone}</td>
                    <td>
                      <span className={`status ${"status-" + client.status}`}>
                        {client.status === "active"
                          ? "Ativo"
                          : client.status === "pending"
                            ? "Pendente"
                            : "Inativo"}
                      </span>
                    </td>
                    <td>
                      R${" "}
                      {client.balance.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      <button className="btn-icon">✏️</button>
                      <button className="btn-icon">🗑️</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "var(--text-dim)",
                    }}
                  >
                    Nenhum cliente cadastrado.
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

export default Clientes;
