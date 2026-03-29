// src/pages/Financeiro.jsx
import React, { useContext } from "react";
import { AppContext } from "../App";
// import '../styles/Financeiro.css'; // REMOVA esta linha

function Financeiro() {
  const { transactions, openModal, addToast } = useContext(AppContext);

  const handleAddTransaction = () => {
    openModal(
      "Nova Transação",
      <div>
        <p style={{ color: "var(--text)" }}>
          Formulário para adicionar transação...
        </p>
        <button
          className="btn btn-gold btn-sm"
          onClick={() => {
            addToast("Transação adicionada!", "success");
            openModal(false);
          }}
        >
          Salvar
        </button>
      </div>,
    );
  };

  // Dados de exemplo para KPIs financeiros
  const totalEntradas = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalSaidas = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const saldoAtual = totalEntradas - totalSaidas;

  return (
    <div className="page active">
      {" "}
      {/* Adiciona a classe 'active' para ser exibida */}
      <div className="page-header">
        <div>
          <h2>Financeiro</h2>
          <p className="page-desc">Controle de receitas e despesas</p>
        </div>
        <div className="header-actions">
          <button
            onClick={handleAddTransaction}
            className="btn btn-gold btn-sm"
          >
            + Nova Transação
          </button>
        </div>
      </div>
      <div className="kpi-grid kpi-grid-3">
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
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Entradas</span>
            <span className="kpi-value">
              R${" "}
              {totalEntradas.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </span>
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
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Saídas</span>
            <span className="kpi-value">
              R${" "}
              {totalSaidas.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
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
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Saldo</span>
            <span className="kpi-value">
              R${" "}
              {saldoAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="🔍  Buscar transação..."
          />
          <select className="select-sm">
            <option value="">Todas</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Tipo</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{transaction.date || "N/A"}</td>
                    <td>{transaction.description}</td>
                    <td>{transaction.category || "Geral"}</td>
                    <td>
                      <span
                        className={`status ${transaction.type === "income" ? "status-active" : "status-inactive"}`}
                      >
                        {transaction.type === "income" ? "Entrada" : "Saída"}
                      </span>
                    </td>
                    <td
                      className={
                        transaction.type === "income"
                          ? "tx-income"
                          : "tx-expense"
                      }
                    >
                      {transaction.type === "income" ? "+" : "-"} R${" "}
                      {Math.abs(transaction.amount).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "var(--text-dim)",
                    }}
                  >
                    Nenhuma transação registrada.
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

export default Financeiro;
