// src/pages/Dashboard.jsx
import React, { useContext, useEffect, useRef } from "react";
import { AppContext, ThemeContext } from "../App"; // Importe ThemeContext
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

function Dashboard() {
  const { clients, transactions, loans, sales, notifications, addToast } =
    useContext(AppContext);
  const { theme } = useContext(ThemeContext); // Obtenha o tema atual
  const navigate = useNavigate();

  // Função para obter a cor de uma variável CSS
  const getCssVariable = (variable) =>
    getComputedStyle(document.documentElement)
      .getPropertyValue(variable)
      .trim();

  // Dados de exemplo para os KPIs
  const kpiData = {
    revenue: 103550.0,
    expense: 39850.0,
    profit: 63900.0,
    activeClients: clients.length,
    revenueChange: "+12.5%",
    expenseChange: "+8.2%",
    profitChange: "+18.7%",
    clientsChange: "+2 este mês",
  };

  // Dados de exemplo para o gráfico de Fluxo de Caixa
  const cashflowChartData = {
    labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul"],
    datasets: [
      {
        label: "Receitas",
        data: [10000, 25000, 35000, 40000, 55000, 60000, 70000],
        borderColor: getCssVariable("--green"),
        backgroundColor: getCssVariable("--green-dim"),
        tension: 0.4,
        fill: true,
      },
      {
        label: "Despesas",
        data: [5000, 10000, 15000, 20000, 22000, 28000, 30000],
        borderColor: getCssVariable("--red"),
        backgroundColor: getCssVariable("--red-dim"),
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Opções do gráfico de Fluxo de Caixa
  const cashflowChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: getCssVariable("--text"), // Cor da legenda
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: getCssVariable("--bg-secondary"),
        titleColor: getCssVariable("--text"),
        bodyColor: getCssVariable("--text-dim"),
        borderColor: getCssVariable("--border"),
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: getCssVariable("--text-dim"), // Cor dos rótulos do eixo X
        },
        grid: {
          color: getCssVariable("--border"), // Cor das linhas de grade do eixo X
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: getCssVariable("--text-dim"), // Cor dos rótulos do eixo Y
          callback: function (value) {
            return "R$ " + value.toLocaleString("pt-BR");
          },
        },
        grid: {
          color: getCssVariable("--border"), // Cor das linhas de grade do eixo Y
        },
      },
    },
  };

  // Dados de exemplo para Transações Recentes
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p className="page-desc">Visão geral do seu negócio</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div
          className="kpi-card kpi-revenue animate-in"
          style={{ "--delay": 1 }}
        >
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
            <span className="kpi-label">Receita Total</span>
            <span className="kpi-value">
              R${" "}
              {kpiData.revenue.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </span>
            <span className="kpi-change positive">{kpiData.revenueChange}</span>
          </div>
        </div>
        <div
          className="kpi-card kpi-expense animate-in"
          style={{ "--delay": 2 }}
        >
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
            <span className="kpi-label">Despesa Total</span>
            <span className="kpi-value">
              R${" "}
              {kpiData.expense.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </span>
            <span className="kpi-change negative">{kpiData.expenseChange}</span>
          </div>
        </div>
        <div
          className="kpi-card kpi-profit animate-in"
          style={{ "--delay": 3 }}
        >
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
            <span className="kpi-label">Lucro Líquido</span>
            <span className="kpi-value">
              R${" "}
              {kpiData.profit.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </span>
            <span className="kpi-change positive">{kpiData.profitChange}</span>
          </div>
        </div>
        <div
          className="kpi-card kpi-clients animate-in"
          style={{ "--delay": 4 }}
        >
          <div className="kpi-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Clientes Ativos</span>
            <span className="kpi-value">{kpiData.activeClients}</span>
            <span className="kpi-change positive">{kpiData.clientsChange}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card chart-card animate-in" style={{ "--delay": 5 }}>
          <div className="card-header">
            <h3>Fluxo de Caixa</h3>
            <button className="btn-link">Ver Detalhes</button>
          </div>
          <div className="chart-container">
            <Line data={cashflowChartData} options={cashflowChartOptions} />
          </div>
        </div>

        <div className="card animate-in" style={{ "--delay": 6 }}>
          <div className="card-header">
            <h3>Transações Recentes</h3>
            <button
              className="btn-link"
              onClick={() => navigate("/financeiro")}
            >
              Ver Todas
            </button>
          </div>
          <div className="transactions-list">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="transaction-row">
                  <div
                    className={`tx-icon ${tx.type === "income" ? "tx-income" : "tx-expense"}`}
                  >
                    {tx.type === "income" ? "↑" : "↓"}
                  </div>
                  <div className="tx-info">
                    <div className="tx-desc">{tx.description}</div>
                    <div className="tx-category">{tx.category}</div>
                  </div>
                  <div
                    className={`tx-amount ${tx.type === "income" ? "tx-income" : "tx-expense"}`}
                  >
                    {tx.type === "income" ? "+" : "-"} R${" "}
                    {Math.abs(tx.amount).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              ))
            ) : (
              <p
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "var(--text-dim)",
                }}
              >
                Nenhuma transação recente.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
