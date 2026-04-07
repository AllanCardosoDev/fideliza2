// src/pages/Dashboard.jsx
import React, { useContext, useMemo } from "react";
import { AppContext, ThemeContext } from "../App";
import { useNavigate } from "react-router-dom";
import { fmt, fmtDate, calcPMT, getClientName } from "../utils/helpers";
import * as XLSX from "xlsx";

import { calculateGlobalKPIs } from "../utils/finance";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

// ── Helper: Build monthly cash flow ────────────────────────────────────────
const buildMonthlyCashFlow = (loans, transactions, today) => {
  const months = {};

  // Initialize last 3 months
  for (let i = 0; i < 3; i++) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - i);
    const monthKey = d.toISOString().split("T")[0].slice(0, 7);
    months[monthKey] = {
      income: 0,
      expense: 0,
      label: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
    };
  }

  // Add transactions
  if (Array.isArray(transactions)) {
    transactions.forEach((t) => {
      const date = new Date(t.date);
      const monthKey = date.toISOString().split("T")[0].slice(0, 7);
      if (months[monthKey]) {
        const amount = Number(t.amount) || 0;
        if (t.type === "income") {
          months[monthKey].income += amount;
        } else {
          months[monthKey].expense += amount;
        }
      }
    });
  }

  // Add loans as expenses (disbursements)
  if (Array.isArray(loans)) {
    loans
      .filter(
        (l) =>
          l.status === "active" ||
          l.status === "overdue" ||
          l.status === "paid",
      )
      .forEach((l) => {
        const date = new Date(l.start_date + "T00:00:00");
        const monthKey = date.toISOString().split("T")[0].slice(0, 7);
        if (months[monthKey]) {
          months[monthKey].expense += Number(l.value) || 0;
        }
      });
  }

  // Return sorted by month ascending
  return Object.keys(months)
    .sort()
    .map((key) => ({
      month: months[key].label,
      monthKey: key,
      income: months[key].income,
      expense: months[key].expense,
      saldo: months[key].income - months[key].expense,
    }));
};

function Dashboard() {
  const { clients, transactions, loans, currentUser, userRole, caixa } =
    useContext(AppContext);
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const getCss = (v) =>
    getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  // ── Today (fixed reference) ────────────────────────────────────────────────
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Access Control: Employees see only their own clients and loans
  const accessibleClients = useMemo(() => {
    if (userRole === "employee" && currentUser?.id) {
      return clients.filter(
        (c) => c.created_by === currentUser.id || c.owner_id === currentUser.id,
      );
    }
    return clients;
  }, [clients, currentUser, userRole]);

  const accessibleLoans = useMemo(() => {
    if (userRole === "employee" && currentUser?.id && clients) {
      const myClientIds = clients
        .filter(
          (c) =>
            c.created_by === currentUser.id || c.owner_id === currentUser.id,
        )
        .map((c) => c.id);
      return loans.filter((l) => myClientIds.includes(l.client_id));
    }
    return loans;
  }, [loans, clients, currentUser, userRole]);

  // ── KPIs calculated uniformly ──────────────────────────────────────────────
  const kpis = useMemo(() => {
    const metrics = calculateGlobalKPIs(
      accessibleLoans,
      transactions,
      Number(caixa) || 0,
      today,
    );

    const activeClients = accessibleClients.filter(
      (c) => c.status === "active" || c.status === "overdue",
    ).length;

    return {
      ...metrics,
      activeClients,
    };
  }, [accessibleLoans, accessibleClients, transactions, caixa, today]);

  // ── Top debtors ───────────────────────────────────────────────────────────
  const topDebtors = useMemo(() => {
    const byClient = {};
    accessibleLoans.forEach((l) => {
      if (l.status === "paid" || l.status === "cancelled") return;
      const key = getClientName(l.client);
      const pmt = calcPMT(
        Number(l.value) || 0,
        (Number(l.interest_rate) || 0) / 100,
        Number(l.installments) || 1,
      );
      const remaining =
        ((Number(l.installments) || 0) - (Number(l.paid) || 0)) * pmt;
      byClient[key] = (byClient[key] || 0) + remaining;
    });
    return Object.entries(byClient)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [accessibleLoans]);

  // ── Upcoming due installments ─────────────────────────────────────────────
  const upcomingDues = useMemo(() => {
    const items = [];
    const today = new Date();
    accessibleLoans.forEach((l) => {
      if (l.status === "paid" || l.status === "cancelled") return;
      if (!l.start_date) return;
      const nextInstallment = (Number(l.paid) || 0) + 1;
      if (nextInstallment > Number(l.installments)) return;
      const due = new Date(l.start_date + "T00:00:00");
      due.setMonth(due.getMonth() + (nextInstallment - 1));
      const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      const pmt = calcPMT(
        Number(l.value) || 0,
        (Number(l.interest_rate) || 0) / 100,
        Number(l.installments) || 1,
      );
      items.push({ loan: l, due, diff, pmt, installmentNo: nextInstallment });
    });
    return items.sort((a, b) => a.due - b.due).slice(0, 8);
  }, [accessibleLoans]);

  // ── Monthly Cash Flow (Last 3 months) ──────────────────────────────────────
  const monthlyCashFlow = useMemo(() => {
    return buildMonthlyCashFlow(accessibleLoans, transactions, today);
  }, [accessibleLoans, transactions, today]);

  // ── Chart Data for Cash Flow ──────────────────────────────────────────────
  const cashFlowChartData = useMemo(() => {
    return {
      labels: monthlyCashFlow.map((m) => m.month),
      datasets: [
        {
          label: "Entradas",
          data: monthlyCashFlow.map((m) => m.income),
          backgroundColor: "rgba(56, 142, 60, 0.8)",
          borderColor: "rgb(56, 142, 60)",
          borderWidth: 2,
          borderRadius: 4,
          type: "bar",
          yAxisID: "y",
        },
        {
          label: "Saídas",
          data: monthlyCashFlow.map((m) => m.expense),
          backgroundColor: "rgba(211, 47, 47, 0.8)",
          borderColor: "rgb(211, 47, 47)",
          borderWidth: 2,
          borderRadius: 4,
          type: "bar",
          yAxisID: "y",
        },
        {
          label: "Saldo",
          data: monthlyCashFlow.map((m) => m.saldo),
          borderColor: "rgba(33, 150, 243, 1)",
          backgroundColor: "rgba(33, 150, 243, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          type: "line",
          yAxisID: "y1",
          pointRadius: 6,
          pointBackgroundColor: monthlyCashFlow.map((m) =>
            m.saldo >= 0 ? "rgb(56, 142, 60)" : "rgb(211, 47, 47)",
          ),
          pointBorderWidth: 2,
          pointBorderColor: "white",
        },
      ],
    };
  }, [monthlyCashFlow]);

  // ── Overdue Installments by Category ──────────────────────────────────────
  const overdueByCategory = useMemo(() => {
    const categories = {
      light: {
        label: "1-7 dias",
        days: [1, 7],
        items: [],
        amount: 0,
        color: "#ff9800",
      }, // Amarelo
      moderate: {
        label: "8-14 dias",
        days: [8, 14],
        items: [],
        amount: 0,
        color: "#ff6f00",
      }, // Laranja
      severe: {
        label: "15-30 dias",
        days: [15, 30],
        items: [],
        amount: 0,
        color: "#e65100",
      }, // Laranja escuro
      critical: {
        label: "30+ dias",
        days: [31, 999999],
        items: [],
        amount: 0,
        color: "#d32f2f",
      }, // Vermelho
    };

    // Get all overdue installments from KPIs
    const allInstallments = kpis.allInstallments || [];
    const overdueInstallments = allInstallments.filter(
      (i) => i.status === "overdue",
    );

    // Categorize each overdue installment by days overdue
    overdueInstallments.forEach((inst) => {
      const daysOverdue = Math.ceil(
        (today - new Date(inst.dueDate)) / (1000 * 60 * 60 * 24),
      );

      let category = null;
      if (daysOverdue >= 1 && daysOverdue <= 7) {
        category = "light";
      } else if (daysOverdue >= 8 && daysOverdue <= 14) {
        category = "moderate";
      } else if (daysOverdue >= 15 && daysOverdue <= 30) {
        category = "severe";
      } else if (daysOverdue > 30) {
        category = "critical";
      }

      if (category) {
        categories[category].items.push({
          client: inst.client,
          amount: inst.amount,
          daysOverdue,
          dueDate: inst.dueDate,
        });
        categories[category].amount += inst.amount;
      }
    });

    return categories;
  }, [kpis, today]);

  const handleExportFinanceiro = () => {
    const dataToExport = accessibleLoans.map((l) => ({
      Cliente: getClientName(l.client),
      "Valor (R$)": Number(l.value),
      Status:
        l.status === "active"
          ? "Ativo"
          : l.status === "overdue"
            ? "Atrasado"
            : l.status === "paid"
              ? "Pago"
              : "Pendente/Cancelado",
      Taxa: Number(l.interest_rate) + "%",
      Parcelas: `${l.installments}x`,
      Pagas: l.paid,
      "Data Emissão": l.start_date ? fmtDate(l.start_date) : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Emprestimos");

    const installmentsData = allInstallments.map((i) => ({
      Cliente: i.client,
      Parcela: `${i.installmentNo}/${i.totalInstallments}`,
      "Valor (R$)": i.amount,
      Vencimento: fmtDate(i.dueDate),
      Status:
        i.status === "paid"
          ? "Pago"
          : i.status === "overdue"
            ? "Atrasado"
            : "Pendente",
    }));

    if (installmentsData.length > 0) {
      const worksheet2 = XLSX.utils.json_to_sheet(installmentsData);
      XLSX.utils.book_append_sheet(workbook, worksheet2, "Parcelas");
    }

    XLSX.writeFile(
      workbook,
      `Relatorio_Financeiro_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p className="page-desc">Visão geral do seu negócio</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-outline btn-sm"
            style={{
              marginRight: 8,
              borderColor: "var(--green)",
              color: "var(--green)",
            }}
            onClick={handleExportFinanceiro}
          >
            Baixar Relatório
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => navigate("/emprestimos")}
          >
            + Novo Empréstimo
          </button>
        </div>
      </div>

      {/* CASH FLOW CHART - 3 Months */}
      {/* Moved to end - after KPI cards */}

      {/* KPI Cards */}
      <div className="kpi-grid">
        {/* SALDO CAIXA - Apenas Admin */}
        {(userRole === "admin" || currentUser?.access_level === "admin") && (
          <div
            className="kpi-card animate-in"
            style={{
              "--delay": 1,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              className="kpi-icon"
              style={{ background: "var(--blue)", color: "white" }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
              </svg>
            </div>
            <div className="kpi-info">
              <span
                className="kpi-label"
                style={{ fontSize: "0.75rem", fontWeight: 600, color: "#888" }}
              >
                Caixa Disponível
              </span>
              <span
                className="kpi-value"
                style={{ color: "#111", fontSize: "1.6rem" }}
              >
                {fmt(kpis.caixaDisponivel)}
              </span>
              <span
                className="kpi-change positive"
                style={{ fontSize: "0.8rem", color: "#888" }}
              >
                Saldo operacional
              </span>
            </div>
          </div>
        )}

        <div
          className="kpi-card animate-in"
          style={{
            "--delay": 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div className="kpi-icon" style={{ background: "var(--orange)" }}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div className="kpi-info">
            <span
              className="kpi-label"
              style={{ fontSize: "0.75rem", fontWeight: 600, color: "#888" }}
            >
              Contratos Ativos
            </span>
            <span
              className="kpi-value"
              style={{ color: "#111", fontSize: "1.6rem" }}
            >
              {kpis.activeLoansCount}
            </span>
            <span
              className="kpi-change positive"
              style={{ fontSize: "0.8rem", color: "#888" }}
            >
              Em andamento
            </span>
          </div>
        </div>

        <div
          className="kpi-card animate-in"
          style={{
            "--delay": 3,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div className="kpi-icon" style={{ background: "var(--green)" }}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div className="kpi-info">
            <span
              className="kpi-label"
              style={{ fontSize: "0.75rem", fontWeight: 600, color: "#888" }}
            >
              Total Emprestado
            </span>
            <span
              className="kpi-value"
              style={{ color: "#111", fontSize: "1.6rem" }}
            >
              {fmt(kpis.totalEmprestado)}
            </span>
            <span
              className="kpi-change positive"
              style={{ fontSize: "0.8rem", color: "#888" }}
            >
              Capital liberado
            </span>
          </div>
        </div>

        <div
          className="kpi-card animate-in"
          style={{
            "--delay": 4,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div className="kpi-icon" style={{ background: "var(--purple)" }}>
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
            <span
              className="kpi-label"
              style={{ fontSize: "0.75rem", fontWeight: 600, color: "#888" }}
            >
              Total a Receber
            </span>
            <span
              className="kpi-value"
              style={{ color: "#111", fontSize: "1.6rem" }}
            >
              {fmt(kpis.totalAReceber)}
            </span>
            <span
              className="kpi-change neutral"
              style={{ fontSize: "0.8rem", color: "#888" }}
            >
              Saldo em aberto
            </span>
          </div>
        </div>

        <div
          className="kpi-card animate-in"
          style={{
            "--delay": 5,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div className="kpi-icon" style={{ background: "#888" }}>
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
            <span
              className="kpi-label"
              style={{ fontSize: "0.75rem", fontWeight: 600, color: "#888" }}
            >
              Total Recebido
            </span>
            <span
              className="kpi-value"
              style={{ color: "#111", fontSize: "1.6rem" }}
            >
              {fmt(kpis.totalRecebido)}
            </span>
            <span
              className="kpi-change positive"
              style={{ fontSize: "0.8rem", color: "#888" }}
            >
              Parcelas quitadas
            </span>
          </div>
        </div>

        <div
          className="kpi-card animate-in"
          style={{
            "--delay": 6,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div className="kpi-icon" style={{ background: "var(--red)" }}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="kpi-info">
            <span
              className="kpi-label"
              style={{ fontSize: "0.75rem", fontWeight: 600, color: "#888" }}
            >
              Em Atraso
            </span>
            <span
              className="kpi-value"
              style={{ color: "#111", fontSize: "1.6rem" }}
            >
              {fmt(kpis.totalEmAtraso)}
            </span>
            <span
              className="kpi-change negative"
              style={{ fontSize: "0.8rem", color: "#888" }}
            >
              {kpis.overdueCount} empréstimo{kpis.overdueCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* CASH FLOW CHART - 3 Months */}
      <div
        style={{
          marginBottom: 24,
          padding: "24px",
          background: "white",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
        className="animate-in"
      >
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 4 }}>📊 Fluxo de Caixa (3 Meses)</h3>
          <p style={{ fontSize: "0.9rem", color: "#666" }}>
            Tendência de entradas, saídas e saldo nos últimos 3 meses
          </p>
        </div>

        <div style={{ position: "relative", height: 320 }}>
          <Bar
            data={cashFlowChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                mode: "index",
                intersect: false,
              },
              plugins: {
                legend: {
                  display: true,
                  position: "top",
                  labels: {
                    font: { size: 12, weight: 500 },
                    padding: 16,
                    usePointStyle: true,
                    pointStyle: "circle",
                  },
                },
                tooltip: {
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  padding: 12,
                  titleFont: { size: 13, weight: "bold" },
                  bodyFont: { size: 12 },
                  callbacks: {
                    label: function (context) {
                      return `${context.dataset.label}: ${fmt(context.parsed.y)}`;
                    },
                  },
                },
              },
              scales: {
                y: {
                  type: "linear",
                  display: true,
                  position: "left",
                  title: {
                    display: true,
                    text: "Valor (R$)",
                    font: { size: 11, weight: 500 },
                  },
                  ticks: {
                    callback: function (value) {
                      return "R$ " + (value / 1000).toFixed(0) + "K";
                    },
                  },
                },
                y1: {
                  type: "linear",
                  display: true,
                  position: "right",
                  title: {
                    display: true,
                    text: "Saldo (R$)",
                    font: { size: 11, weight: 500 },
                  },
                  grid: {
                    drawOnChartArea: false,
                  },
                  ticks: {
                    callback: function (value) {
                      return "R$ " + (value / 1000).toFixed(0) + "K";
                    },
                  },
                },
              },
            }}
          />
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Maiores Devedores */}
        <div className="card animate-in" style={{ "--delay": 7 }}>
          <div className="card-header">
            <h3>Maiores Devedores</h3>
            <button className="btn-link" onClick={() => navigate("/cobrancas")}>
              Ver Cobranças
            </button>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>A Receber</th>
                </tr>
              </thead>
              <tbody>
                {topDebtors.length > 0 ? (
                  topDebtors.map(([name, value], i) => (
                    <tr key={name}>
                      <td>{i + 1}</td>
                      <td>{name}</td>
                      <td style={{ fontWeight: "bold" }}>{fmt(value)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="3"
                      style={{
                        textAlign: "center",
                        padding: "20px",
                        color: "var(--text-dim)",
                      }}
                    >
                      Nenhum devedor ativo
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Próximos Vencimentos */}
        <div className="card animate-in" style={{ "--delay": 8 }}>
          <div className="card-header">
            <h3>Próximos Vencimentos</h3>
            <button
              className="btn-link"
              onClick={() => navigate("/emprestimos")}
            >
              Ver Todos
            </button>
          </div>
          <div className="transactions-list">
            {upcomingDues.length > 0 ? (
              upcomingDues.map(({ loan, due, diff, pmt, installmentNo }) => (
                <div
                  key={`${loan.id}-${installmentNo}`}
                  className="transaction-row"
                >
                  <div
                    className={`tx-icon ${diff < 0 ? "tx-expense" : diff <= 3 ? "tx-warning" : "tx-income"}`}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </div>
                  <div className="tx-info">
                    <div className="tx-desc">{getClientName(loan.client)}</div>
                    <div className="tx-category">
                      Parcela {installmentNo}/{loan.installments}
                    </div>
                  </div>
                  <div className="tx-amount" style={{ textAlign: "right" }}>
                    <div>{fmt(pmt)}</div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color:
                          diff < 0
                            ? "var(--red)"
                            : diff <= 3
                              ? "var(--orange)"
                              : "var(--text-dim)",
                      }}
                    >
                      {diff < 0
                        ? `${Math.abs(diff)}d atrasado`
                        : diff === 0
                          ? "Hoje"
                          : `em ${diff}d`}
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
                }}
              >
                Nenhum vencimento próximo
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
