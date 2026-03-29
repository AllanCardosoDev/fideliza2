// src/pages/Dashboard.jsx
import React, { useContext, useMemo } from "react";
import { AppContext, ThemeContext } from "../App";
import { useNavigate } from "react-router-dom";
import { fmt, fmtDate, calcPMT } from "../utils/helpers";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend
);

function Dashboard() {
  const { clients, transactions, loans } = useContext(AppContext);
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const getCss = (v) =>
    getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  // ── KPIs calculated from real data ───────────────────────────────────────
  const kpis = useMemo(() => {
    const activeLoans = loans.filter((l) => l.status === "active" || l.status === "overdue");
    const totalEmprestado = activeLoans.reduce((s, l) => s + (Number(l.value) || 0), 0);

    const totalRecebido = loans.reduce((s, l) => {
      const pmt = calcPMT(Number(l.value) || 0, (Number(l.interest_rate) || 0) / 100, Number(l.installments) || 1);
      return s + pmt * (Number(l.paid) || 0);
    }, 0);

    const totalAReceber = loans.reduce((s, l) => {
      if (l.status === "paid" || l.status === "cancelled") return s;
      const pmt = calcPMT(Number(l.value) || 0, (Number(l.interest_rate) || 0) / 100, Number(l.installments) || 1);
      const remaining = (Number(l.installments) || 0) - (Number(l.paid) || 0);
      return s + pmt * Math.max(remaining, 0);
    }, 0);

    const overdueLoans = loans.filter((l) => l.status === "overdue");
    const totalEmAtraso = overdueLoans.reduce((s, l) => s + (Number(l.value) || 0), 0);

    const activeClients = clients.filter((c) => c.status === "active" || c.status === "overdue").length;

    return {
      totalEmprestado,
      totalRecebido,
      totalAReceber,
      totalEmAtraso,
      activeClients,
      activeLoansCount: activeLoans.length,
      overdueCount: overdueLoans.length,
    };
  }, [loans, clients]);

  // ── Top debtors ───────────────────────────────────────────────────────────
  const topDebtors = useMemo(() => {
    const byClient = {};
    loans.forEach((l) => {
      if (l.status === "paid" || l.status === "cancelled") return;
      const key = l.client;
      const pmt = calcPMT(Number(l.value) || 0, (Number(l.interest_rate) || 0) / 100, Number(l.installments) || 1);
      const remaining = ((Number(l.installments) || 0) - (Number(l.paid) || 0)) * pmt;
      byClient[key] = (byClient[key] || 0) + remaining;
    });
    return Object.entries(byClient)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [loans]);

  // ── Upcoming due installments ─────────────────────────────────────────────
  const upcomingDues = useMemo(() => {
    const items = [];
    const today = new Date();
    loans.forEach((l) => {
      if (l.status === "paid" || l.status === "cancelled") return;
      if (!l.start_date) return;
      const nextInstallment = (Number(l.paid) || 0) + 1;
      if (nextInstallment > Number(l.installments)) return;
      const due = new Date(l.start_date + "T00:00:00");
      due.setMonth(due.getMonth() + nextInstallment);
      const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      const pmt = calcPMT(Number(l.value) || 0, (Number(l.interest_rate) || 0) / 100, Number(l.installments) || 1);
      items.push({ loan: l, due, diff, pmt, installmentNo: nextInstallment });
    });
    return items.sort((a, b) => a.due - b.due).slice(0, 8);
  }, [loans]);

  // ── Chart: monthly loans by month (last 6 months) ────────────────────────
  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("pt-BR", { month: "short" }) });
    }
    const loansByMonth = months.map(({ key }) =>
      loans.filter((l) => l.start_date && l.start_date.startsWith(key))
        .reduce((s, l) => s + (Number(l.value) || 0), 0)
    );
    const receivedByMonth = months.map(({ key }) =>
      transactions.filter((t) => t.type === "income" && t.date && t.date.startsWith(key))
        .reduce((s, t) => s + (Number(t.amount) || 0), 0)
    );
    return {
      labels: months.map((m) => m.label),
      datasets: [
        {
          label: "Emprestado",
          data: loansByMonth,
          borderColor: getCss("--gold"),
          backgroundColor: getCss("--gold-glow"),
          tension: 0.4,
          fill: true,
        },
        {
          label: "Recebido",
          data: receivedByMonth,
          borderColor: getCss("--green"),
          backgroundColor: getCss("--green-dim"),
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }, [loans, transactions, theme]); // eslint-disable-line react-hooks/exhaustive-deps

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { color: getCss("--text") } },
      tooltip: {
        backgroundColor: getCss("--bg-secondary"),
        titleColor: getCss("--text"),
        bodyColor: getCss("--text-dim"),
        borderColor: getCss("--border"),
        borderWidth: 1,
        callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmt(ctx.parsed.y)}` },
      },
    },
    scales: {
      x: { ticks: { color: getCss("--text-dim") }, grid: { color: getCss("--border") } },
      y: {
        beginAtZero: true,
        ticks: { color: getCss("--text-dim"), callback: (v) => fmt(v) },
        grid: { color: getCss("--border") },
      },
    },
  }), [theme]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p className="page-desc">Visão geral do seu negócio</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline btn-sm" onClick={() => navigate("/emprestimos")}>
            + Novo Empréstimo
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-revenue animate-in" style={{ "--delay": 1 }}>
          <div className="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total Emprestado (Ativo)</span>
            <span className="kpi-value">{fmt(kpis.totalEmprestado)}</span>
            <span className="kpi-change positive">{kpis.activeLoansCount} empréstimo{kpis.activeLoansCount !== 1 ? "s" : ""} ativo{kpis.activeLoansCount !== 1 ? "s" : ""}</span>
          </div>
        </div>

        <div className="kpi-card kpi-profit animate-in" style={{ "--delay": 2 }}>
          <div className="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total a Receber</span>
            <span className="kpi-value">{fmt(kpis.totalAReceber)}</span>
            <span className="kpi-change neutral">Saldo em aberto</span>
          </div>
        </div>

        <div className="kpi-card kpi-clients animate-in" style={{ "--delay": 3 }}>
          <div className="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total Recebido</span>
            <span className="kpi-value">{fmt(kpis.totalRecebido)}</span>
            <span className="kpi-change positive">Parcelas quitadas</span>
          </div>
        </div>

        <div className="kpi-card kpi-expense animate-in" style={{ "--delay": 4 }}>
          <div className="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Em Atraso</span>
            <span className="kpi-value">{fmt(kpis.totalEmAtraso)}</span>
            <span className="kpi-change negative">{kpis.overdueCount} empréstimo{kpis.overdueCount !== 1 ? "s" : ""} inadimplente{kpis.overdueCount !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Chart */}
        <div className="card chart-card animate-in" style={{ "--delay": 5 }}>
          <div className="card-header">
            <h3>Evolução Mensal</h3>
            <button className="btn-link" onClick={() => navigate("/relatorios")}>Ver Relatórios</button>
          </div>
          <div className="chart-container">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Upcoming dues */}
        <div className="card animate-in" style={{ "--delay": 6 }}>
          <div className="card-header">
            <h3>Próximos Vencimentos</h3>
            <button className="btn-link" onClick={() => navigate("/emprestimos")}>Ver Todos</button>
          </div>
          <div className="transactions-list">
            {upcomingDues.length > 0 ? (
              upcomingDues.map(({ loan, due, diff, pmt, installmentNo }) => (
                <div key={`${loan.id}-${installmentNo}`} className="transaction-row">
                  <div className={`tx-icon ${diff < 0 ? "tx-expense" : diff <= 3 ? "tx-expense" : "tx-income"}`}>
                    {diff < 0 ? "⚠" : diff <= 3 ? "!" : "📅"}
                  </div>
                  <div className="tx-info">
                    <div className="tx-desc">{loan.client}</div>
                    <div className="tx-category">Parcela {installmentNo}/{loan.installments}</div>
                  </div>
                  <div className="tx-amount" style={{ textAlign: "right" }}>
                    <div>{fmt(pmt)}</div>
                    <div style={{ fontSize: "0.75rem", color: diff < 0 ? "var(--red)" : diff <= 3 ? "var(--orange)" : "var(--text-dim)" }}>
                      {diff < 0 ? `${Math.abs(diff)}d atrasado` : diff === 0 ? "Hoje" : `em ${diff}d — ${fmtDate(due.toISOString().split("T")[0])}`}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ padding: "20px", textAlign: "center", color: "var(--text-dim)" }}>
                Nenhum vencimento próximo.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Summary row */}
      <div className="dashboard-grid" style={{ marginTop: 0 }}>
        {/* Top debtors */}
        <div className="card animate-in" style={{ "--delay": 7 }}>
          <div className="card-header">
            <h3>Maiores Devedores</h3>
            <button className="btn-link" onClick={() => navigate("/clientes")}>Ver Clientes</button>
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
                      <td>{fmt(value)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: "center", padding: "20px", color: "var(--text-dim)" }}>Nenhum devedor ativo.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick stats */}
        <div className="card animate-in" style={{ "--delay": 8 }}>
          <div className="card-header">
            <h3>Resumo Geral</h3>
          </div>
          <div style={{ padding: "8px 0" }}>
            {[
              { label: "Clientes Ativos", value: kpis.activeClients, icon: "👥" },
              { label: "Empréstimos Ativos", value: kpis.activeLoansCount, icon: "💳" },
              { label: "Em Atraso", value: kpis.overdueCount, icon: "⚠️" },
              { label: "Total de Empréstimos", value: loans.length, icon: "📋" },
              { label: "Total de Clientes", value: clients.length, icon: "🧑‍💼" },
            ].map((item) => (
              <div key={item.label} className="transaction-row">
                <div className="tx-icon" style={{ background: "var(--bg-primary)" }}>{item.icon}</div>
                <div className="tx-info">
                  <div className="tx-desc">{item.label}</div>
                </div>
                <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
