// src/pages/Relatorios.jsx
import React, { useContext } from "react";
import { ThemeContext } from "../App";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
);

function Relatorios() {
  const { theme } = useContext(ThemeContext);

  // Função para obter a cor de uma variável CSS
  const getCssVariable = (variable) =>
    getComputedStyle(document.documentElement)
      .getPropertyValue(variable)
      .trim();

  // Definir cores baseadas no tema para os elementos do gráfico
  const textColor =
    theme === "dark" ? getCssVariable("--text") : getCssVariable("--text"); // Cor do texto principal
  const textDimColor =
    theme === "dark"
      ? getCssVariable("--text-dim")
      : getCssVariable("--text-dim"); // Cor do texto dim
  const borderColor =
    theme === "dark" ? getCssVariable("--border") : getCssVariable("--border"); // Cor da borda
  const bgSecondaryColor =
    theme === "dark"
      ? getCssVariable("--bg-secondary")
      : getCssVariable("--bg-secondary"); // Fundo secundário

  // Dados de exemplo para Receitas vs Despesas (Bar Chart)
  const revenueExpenseData = {
    labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
    datasets: [
      {
        label: "Receitas",
        data: [12000, 19000, 15000, 22000, 28000, 35000],
        backgroundColor: getCssVariable("--green"),
        borderColor: getCssVariable("--green"),
        borderWidth: 1,
      },
      {
        label: "Despesas",
        data: [8000, 10000, 9000, 14000, 18000, 20000],
        backgroundColor: getCssVariable("--red"),
        borderColor: getCssVariable("--red"),
        borderWidth: 1,
      },
    ],
  };

  const revenueExpenseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: textColor, // Usa a cor do texto principal
        },
      },
      tooltip: {
        backgroundColor: bgSecondaryColor,
        titleColor: textColor,
        bodyColor: textDimColor,
        borderColor: borderColor,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: textDimColor },
        grid: { color: borderColor },
      },
      y: {
        ticks: {
          color: textDimColor,
          callback: function (value) {
            return "R$ " + value.toLocaleString("pt-BR");
          },
        },
        grid: { color: borderColor },
      },
    },
  };

  // Dados de exemplo para Despesas por Categoria (Pie Chart)
  const categoryExpenseData = {
    labels: ["Marketing", "Folha de Pagamento", "Operacional", "Outros"],
    datasets: [
      {
        data: [2500, 12000, 4000, 1500],
        backgroundColor: [
          getCssVariable("--blue"),
          getCssVariable("--purple"),
          getCssVariable("--orange"),
          getCssVariable("--text-dim"),
        ],
        borderColor: getCssVariable("--bg-card"),
        borderWidth: 2,
      },
    ],
  };

  const categoryExpenseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          // AQUI ESTÁ A MUDANÇA PRINCIPAL:
          // No modo claro, usamos uma cor escura para a legenda.
          // No modo escuro, usamos a cor do texto principal (que é clara).
          color: theme === "light" ? "#333333" : textColor, // Cor escura fixa para light mode, ou textColor para dark mode
        },
      },
      tooltip: {
        backgroundColor: bgSecondaryColor,
        titleColor: textColor,
        bodyColor: textDimColor,
        borderColor: borderColor,
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            let label = context.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed !== null) {
              label +=
                "R$ " +
                context.parsed.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                });
            }
            return label;
          },
        },
      },
    },
  };

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Relatórios</h2>
          <p className="page-desc">Análise detalhada do negócio</p>
        </div>
        <div className="header-actions">
          <button id="btn-export-pdf" className="btn btn-outline btn-sm">
            📄 Exportar PDF
          </button>
          <button id="btn-export-report" className="btn btn-gold btn-sm">
            📊 Exportar Excel
          </button>
        </div>
      </div>
      <div className="dashboard-grid">
        <div className="card chart-card animate-in" style={{ "--delay": 1 }}>
          <div className="card-header">
            <h3>Receitas vs Despesas</h3>
          </div>
          <div className="chart-container">
            <Bar data={revenueExpenseData} options={revenueExpenseOptions} />
          </div>
        </div>
        <div className="card chart-card animate-in" style={{ "--delay": 2 }}>
          <div className="card-header">
            <h3>Despesas por Categoria</h3>
          </div>
          <div className="chart-container">
            <Pie data={categoryExpenseData} options={categoryExpenseOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Relatorios;
