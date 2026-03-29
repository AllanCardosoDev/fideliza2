// src/pages/Vendas.jsx
import React, { useContext } from "react";
import { AppContext } from "../App";
// import '../styles/Vendas.css'; // REMOVA esta linha

function Vendas() {
  const { sales, openModal, addToast } = useContext(AppContext);

  const handleAddSale = () => {
    openModal(
      "Nova Venda",
      <div>
        <p style={{ color: "var(--text)" }}>
          Formulário para adicionar venda...
        </p>
        <button
          className="btn btn-gold btn-sm"
          onClick={() => {
            addToast("Venda adicionada!", "success");
            openModal(false);
          }}
        >
          Salvar
        </button>
      </div>,
    );
  };

  // KPIs de Vendas
  const totalSalesValue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalItemsSold = sales.reduce((sum, sale) => sum + sale.qty, 0);
  const averageTicket = sales.length > 0 ? totalSalesValue / sales.length : 0;

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Vendas</h2>
          <p className="page-desc">Registro e acompanhamento de vendas</p>
        </div>
        <div className="header-actions">
          <button onClick={handleAddSale} className="btn btn-gold btn-sm">
            + Nova Venda
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
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total de Vendas</span>
            <span className="kpi-value">
              R${" "}
              {totalSalesValue.toLocaleString("pt-BR", {
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
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Itens Vendidos</span>
            <span className="kpi-value">{totalItemsSold}</span>
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
              <path d="M18 20V10" />
              <path d="M12 20V4" />
              <path d="M6 20v-6" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Ticket Médio</span>
            <span className="kpi-value">
              R${" "}
              {averageTicket.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="🔍  Buscar venda..."
          />
          <select className="select-sm">
            <option value="">Todos</option>
            <option value="paid">Pagos</option>
            <option value="pending">Pendentes</option>
            <option value="delivered">Entregues</option>
          </select>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Produto</th>
                <th>Qtd</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.length > 0 ? (
                sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.date}</td>
                    <td>{sale.client}</td>
                    <td>{sale.product}</td>
                    <td>{sale.qty}</td>
                    <td>
                      R${" "}
                      {sale.total.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      <span className={`status ${"status-" + sale.status}`}>
                        {sale.status === "paid"
                          ? "Pago"
                          : sale.status === "pending"
                            ? "Pendente"
                            : "Entregue"}
                      </span>
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
