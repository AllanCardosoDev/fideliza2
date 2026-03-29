// src/pages/Relatorios.jsx
import React, { useContext, useMemo } from "react";
import { AppContext, ThemeContext } from "../App";
import { fmt, fmtDate, calcPMT } from "../utils/helpers";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement
);

function Relatorios() {
  const { loans, clients, transactions } = useContext(AppContext);
  const { theme } = useContext(ThemeContext);

  const getCss = (v) =>
    getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  // ── Computed stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = loans.reduce((s, l) => s + (Number(l.value) || 0), 0);
    const active = loans.filter((l) => l.status === "active" || l.status === "overdue");
    const paid = loans.filter((l) => l.status === "paid");
    const overdue = loans.filter((l) => l.status === "overdue");

    const totalReceived = loans.reduce((s, l) => {
      const pmt = calcPMT(Number(l.value) || 0, (Number(l.interest_rate) || 0) / 100, Number(l.installments) || 1);
      return s + pmt * (Number(l.paid) || 0);
    }, 0);

    const totalPending = loans.reduce((s, l) => {
      if (l.status === "paid" || l.status === "cancelled") return s;
      const pmt = calcPMT(Number(l.value) || 0, (Number(l.interest_rate) || 0) / 100, Number(l.installments) || 1);
      return s + pmt * Math.max((Number(l.installments) || 0) - (Number(l.paid) || 0), 0);
    }, 0);

    const totalInterest = loans.reduce((s, l) => {
      const pmt = calcPMT(Number(l.value) || 0, (Number(l.interest_rate) || 0) / 100, Number(l.installments) || 1);
      const totalPay = pmt * (Number(l.installments) || 0);
      return s + (totalPay - (Number(l.value) || 0));
    }, 0);

    return { total, active, paid, overdue, totalReceived, totalPending, totalInterest };
  }, [loans]);

  // ── Monthly data (last 6 months) ─────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      });
    }
    const loaned = months.map(({ key }) =>
      loans.filter((l) => l.start_date && l.start_date.startsWith(key))
        .reduce((s, l) => s + (Number(l.value) || 0), 0)
    );
    const received = months.map(({ key }) =>
      transactions.filter((t) => t.type === "income" && t.date && t.date.startsWith(key))
        .reduce((s, t) => s + (Number(t.amount) || 0), 0)
    );
    const count = months.map(({ key }) =>
      loans.filter((l) => l.start_date && l.start_date.startsWith(key)).length
    );
    return { labels: months.map((m) => m.label), loaned, received, count };
  }, [loans, transactions, theme]); // eslint-disable-line react-hooks/exhaustive-deps

  const barData = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: "Emprestado",
        data: monthlyData.loaned,
        backgroundColor: getCss("--gold"),
        borderColor: getCss("--gold"),
        borderWidth: 1,
      },
      {
        label: "Recebido",
        data: monthlyData.received,
        backgroundColor: getCss("--green"),
        borderColor: getCss("--green"),
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
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
        ticks: { color: getCss("--text-dim"), callback: (v) => fmt(v) },
        grid: { color: getCss("--border") },
      },
    },
  };

  // Status breakdown pie chart
  const statusBreakdown = {
    active: loans.filter((l) => l.status === "active").length,
    overdue: loans.filter((l) => l.status === "overdue").length,
    paid: loans.filter((l) => l.status === "paid").length,
    other: loans.filter((l) => !["active", "overdue", "paid"].includes(l.status)).length,
  };

  const pieData = {
    labels: ["Ativos", "Atrasados", "Pagos", "Outros"],
    datasets: [{
      data: [statusBreakdown.active, statusBreakdown.overdue, statusBreakdown.paid, statusBreakdown.other],
      backgroundColor: [getCss("--green"), getCss("--red"), getCss("--blue"), getCss("--text-dim")],
      borderColor: getCss("--bg-card"),
      borderWidth: 2,
    }],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: { color: theme === "light" ? "#333" : getCss("--text") },
      },
      tooltip: {
        backgroundColor: getCss("--bg-secondary"),
        titleColor: getCss("--text"),
        bodyColor: getCss("--text-dim"),
        borderColor: getCss("--border"),
        borderWidth: 1,
      },
    },
  };

  // ── Export functions ─────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = ["ID", "Cliente", "Valor", "Taxa", "Parcelas", "Pagas", "Status", "Início"];
    const rows = loans.map((l) => [
      l.id, l.client, l.value, `${l.interest_rate}%`, l.installments, l.paid, l.status, l.start_date || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `emprestimos-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportClientesCSV = () => {
    const headers = ["ID", "Nome", "CPF/CNPJ", "Telefone", "Email", "Status"];
    const rows = clients.map((c) => [
      c.id, c.name, c.cpf_cnpj || "", c.phone || "", c.email || "", c.status || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c2) => `"${c2}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Inadimplência list
  const inadimplentes = useMemo(() => {
    return loans.filter((l) => l.status === "overdue").map((l) => {
      const pmt = calcPMT(Number(l.value) || 0, (Number(l.interest_rate) || 0) / 100, Number(l.installments) || 1);
      const remaining = ((Number(l.installments) || 0) - (Number(l.paid) || 0)) * pmt;
      return { ...l, remaining };
    }).sort((a, b) => b.remaining - a.remaining);
  }, [loans]);

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Relatórios</h2>
          <p className="page-desc">Análise detalhada do negócio</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline btn-sm" onClick={handleExportCSV}>
            📊 Exportar Empréstimos (CSV)
          </button>
          <button className="btn btn-gold btn-sm" onClick={handleExportClientesCSV}>
            👥 Exportar Clientes (CSV)
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card kpi-revenue">
          <div className="kpi-info">
            <span className="kpi-label">Total Emprestado</span>
            <span className="kpi-value">{fmt(stats.total)}</span>
          </div>
        </div>
        <div className="kpi-card kpi-profit">
          <div className="kpi-info">
            <span className="kpi-label">Total Recebido</span>
            <span className="kpi-value">{fmt(stats.totalReceived)}</span>
          </div>
        </div>
        <div className="kpi-card kpi-clients">
          <div className="kpi-info">
            <span className="kpi-label">A Receber</span>
            <span className="kpi-value">{fmt(stats.totalPending)}</span>
          </div>
        </div>
        <div className="kpi-card kpi-expense">
          <div className="kpi-info">
            <span className="kpi-label">Juros Totais</span>
            <span className="kpi-value">{fmt(stats.totalInterest)}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card chart-card animate-in" style={{ "--delay": 1 }}>
          <div className="card-header"><h3>Evolução Mensal (Emprestado vs Recebido)</h3></div>
          <div className="chart-container">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
        <div className="card chart-card animate-in" style={{ "--delay": 2 }}>
          <div className="card-header"><h3>Status dos Empréstimos</h3></div>
          <div className="chart-container">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>
      </div>

      {/* Inadimplência table */}
      {inadimplentes.length > 0 && (
        <div className="card animate-in" style={{ "--delay": 3 }}>
          <div className="card-header">
            <h3>Relatório de Inadimplência</h3>
            <span className="kpi-change negative">{inadimplentes.length} empréstimo{inadimplentes.length !== 1 ? "s" : ""} em atraso</span>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Valor Original</th>
                  <th>Taxa</th>
                  <th>Parcelas</th>
                  <th>Pagas</th>
                  <th>A Receber</th>
                  <th>Início</th>
                </tr>
              </thead>
              <tbody>
                {inadimplentes.map((l) => (
                  <tr key={l.id} className="row-overdue">
                    <td><strong>{l.client}</strong></td>
                    <td>{fmt(l.value)}</td>
                    <td>{l.interest_rate ? `${l.interest_rate}% a.m.` : "—"}</td>
                    <td>{l.installments}</td>
                    <td>{l.paid}</td>
                    <td className="tx-expense">{fmt(l.remaining)}</td>
                    <td>{fmtDate(l.start_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All loans table */}
      <div className="card animate-in" style={{ "--delay": 4 }}>
        <div className="card-header">
          <h3>Todos os Empréstimos</h3>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Taxa</th>
                <th>Parcelas</th>
                <th>Pagas</th>
                <th>Status</th>
                <th>Início</th>
              </tr>
            </thead>
            <tbody>
              {loans.length > 0 ? (
                loans.map((l) => (
                  <tr key={l.id}>
                    <td>{l.client}</td>
                    <td>{fmt(l.value)}</td>
                    <td>{l.interest_rate ? `${l.interest_rate}%` : "—"}</td>
                    <td>{l.installments}</td>
                    <td>{l.paid}</td>
                    <td>
                      <span className={`status status-${l.status}`}>
                        {l.status === "active" ? "Ativo" : l.status === "paid" ? "Pago" : l.status === "overdue" ? "Atrasado" : l.status}
                      </span>
                    </td>
                    <td>{fmtDate(l.start_date)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "20px", color: "var(--text-dim)" }}>
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

export default Relatorios;
