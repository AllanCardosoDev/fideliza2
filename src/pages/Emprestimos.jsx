// src/pages/Emprestimos.jsx
import React, { useContext } from "react";
import { AppContext } from "../App";
// import '../styles/Emprestimos.css'; // REMOVA esta linha

function Emprestimos() {
  const { loans, openModal, addToast } = useContext(AppContext);

  const handleAddLoan = () => {
    openModal(
      "Novo Empréstimo",
      <div>
        <p style={{ color: "var(--text)" }}>
          Formulário para adicionar empréstimo...
        </p>
        <button
          className="btn btn-gold btn-sm"
          onClick={() => {
            addToast("Empréstimo adicionado!", "success");
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
          <h2>Empréstimos</h2>
          <p className="page-desc">Gerencie os empréstimos concedidos</p>
        </div>
        <div className="header-actions">
          <button onClick={handleAddLoan} className="btn btn-gold btn-sm">
            + Novo Empréstimo
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="🔍  Buscar empréstimo..."
          />
          <select className="select-sm">
            <option value="">Todos</option>
            <option value="active">Ativos</option>
            <option value="pending">Pendentes</option>
            <option value="overdue">Atrasados</option>
          </select>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Parcelas</th>
                <th>Pagos</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loans.length > 0 ? (
                loans.map((loan) => (
                  <tr key={loan.id}>
                    <td>{loan.client}</td>
                    <td>
                      R${" "}
                      {loan.value.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td>{loan.installments}</td>
                    <td>{loan.paid}</td>
                    <td>
                      <span className={`status ${"status-" + loan.status}`}>
                        {loan.status === "active"
                          ? "Ativo"
                          : loan.status === "pending"
                            ? "Pendente"
                            : "Atrasado"}
                      </span>
                    </td>
                    <td>
                      <button className="btn-icon">📄</button> {/* Detalhes */}
                      <button className="btn-icon">💰</button>{" "}
                      {/* Registrar Pagamento */}
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
                    Nenhum empréstimo registrado.
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
