// src/pages/Relatorios.jsx
import React, { useContext, useMemo, useState } from "react";
import { AppContext, ThemeContext } from "../App";
import { fmt, fmtDate, calcPMT } from "../utils/helpers";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
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
  const [reportType, setReportType] = useState("overview");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);

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

  // ── Filtered data by date range ──────────────────────────────────────────
  const filteredLoans = useMemo(() =>
    loans.filter((l) => {
      if (!l.start_date) return true;
      const matchFrom = dateFrom ? l.start_date >= dateFrom : true;
      const matchTo = dateTo ? l.start_date <= dateTo : true;
      return matchFrom && matchTo;
    }), [loans, dateFrom, dateTo]);

  const filteredTransactions = useMemo(() =>
    transactions.filter((t) => {
      if (!t.date) return true;
      const matchFrom = dateFrom ? t.date >= dateFrom : true;
      const matchTo = dateTo ? t.date <= dateTo : true;
      return matchFrom && matchTo;
    }), [transactions, dateFrom, dateTo]);

  const cashflow = useMemo(() => {
    const income = filteredTransactions.filter((t) => t.type === "income");
    const expense = filteredTransactions.filter((t) => t.type === "expense");
    return {
      income,
      expense,
      totalIncome: income.reduce((s, t) => s + (Number(t.amount) || 0), 0),
      totalExpense: expense.reduce((s, t) => s + (Number(t.amount) || 0), 0),
    };
  }, [filteredTransactions]);

  // ── Export functions ─────────────────────────────────────────────────────

  const exportPDF = (title, columns, rows, filename) => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, 16);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
      14,
      23
    );
    if (dateFrom || dateTo) {
      doc.text(
        `Período: ${dateFrom ? fmtDate(dateFrom) : "início"} até ${dateTo ? fmtDate(dateTo) : "hoje"}`,
        14,
        29
      );
    }
    autoTable(doc, {
      startY: 35,
      head: [columns],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [243, 156, 18], textColor: 255 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
    });
    doc.save(filename);
  };

  const exportExcel = (title, columns, rows, filename) => {
    const wsData = [columns, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
    XLSX.writeFile(wb, filename);
  };

  const handleExportLoansPDF = () => {
    exportPDF(
      "Relatório de Empréstimos",
      ["Cliente", "Valor", "Taxa", "Parcelas", "Pagas", "Status", "Início"],
      filteredLoans.map((l) => [
        l.client, fmt(l.value), `${l.interest_rate}%`,
        l.installments, l.paid,
        l.status === "active" ? "Ativo" : l.status === "paid" ? "Pago" : l.status === "overdue" ? "Atrasado" : l.status,
        fmtDate(l.start_date),
      ]),
      `emprestimos-${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  const handleExportLoansExcel = () => {
    exportExcel(
      "Empréstimos",
      ["Cliente", "Valor (R$)", "Taxa (%)", "Parcelas", "Pagas", "Status", "Data Início"],
      filteredLoans.map((l) => [
        l.client, Number(l.value), Number(l.interest_rate),
        Number(l.installments), Number(l.paid), l.status, l.start_date || "",
      ]),
      `emprestimos-${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  const handleExportClientesPDF = () => {
    exportPDF(
      "Relatório de Clientes",
      ["Nome", "CPF/CNPJ", "Telefone", "Email", "Status"],
      clients.map((c) => [c.name, c.cpf_cnpj || "", c.phone || "", c.email || "", c.status || ""]),
      `clientes-${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  const handleExportClientesExcel = () => {
    exportExcel(
      "Clientes",
      ["Nome", "CPF/CNPJ", "Telefone", "Email", "Status"],
      clients.map((c) => [c.name, c.cpf_cnpj || "", c.phone || "", c.email || "", c.status || ""]),
      `clientes-${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  const handleExportInadimplenciaPDF = () => {
    exportPDF(
      "Relatório de Inadimplência",
      ["Cliente", "Valor Original", "Taxa", "Parcelas", "Pagas", "A Receber", "Início"],
      inadimplentes.map((l) => [
        l.client, fmt(l.value), `${l.interest_rate}%`,
        l.installments, l.paid, fmt(l.remaining), fmtDate(l.start_date),
      ]),
      `inadimplencia-${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  const handleExportCashflowPDF = () => {
    exportPDF(
      "Fluxo de Caixa",
      ["Data", "Descrição", "Categoria", "Tipo", "Valor (R$)"],
      filteredTransactions.map((t) => [
        fmtDate(t.date), t.description, t.category || "",
        t.type === "income" ? "Entrada" : "Saída", fmt(t.amount),
      ]),
      `fluxo-caixa-${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  const handleExportCashflowExcel = () => {
    exportExcel(
      "Fluxo de Caixa",
      ["Data", "Descrição", "Categoria", "Tipo", "Valor (R$)"],
      filteredTransactions.map((t) => [
        t.date, t.description, t.category || "",
        t.type === "income" ? "Entrada" : "Saída", Number(t.amount),
      ]),
      `fluxo-caixa-${new Date().toISOString().split("T")[0]}.xlsx`
    );
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
      </div>

      {/* Report Type Tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {[
          { key: "overview", label: "📊 Visão Geral" },
          { key: "loans", label: "💳 Empréstimos" },
          { key: "cashflow", label: "💵 Fluxo de Caixa" },
          { key: "overdue", label: "⚠ Inadimplência" },
          { key: "clients", label: "👥 Clientes" },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`btn btn-sm ${reportType === key ? "btn-gold" : "btn-outline"}`}
            onClick={() => setReportType(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Date Filter Bar */}
      <div className="card" style={{ padding: "14px 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-dim)", marginBottom: 4 }}>
              Período: De
            </label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-dim)", marginBottom: 4 }}>
              Até
            </label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => { setDateFrom(""); setDateTo(""); }}
          >
            Limpar Período
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

      {/* ── Overview ───────────────────────────────────────────────────────── */}
      {reportType === "overview" && (
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
      )}

      {/* ── Loans report ───────────────────────────────────────────────────── */}
      {reportType === "loans" && (
        <div className="card animate-in" style={{ "--delay": 1 }}>
          <div className="card-header">
            <h3>
              Empréstimos no Período
              <span style={{ marginLeft: 8, fontSize: "0.8rem", color: "var(--text-dim)", fontWeight: 400 }}>
                ({filteredLoans.length} registros)
              </span>
            </h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={handleExportLoansPDF}>
                📄 PDF
              </button>
              <button className="btn btn-gold btn-sm" onClick={handleExportLoansExcel}>
                📊 Excel
              </button>
            </div>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th><th>Valor</th><th>Taxa</th>
                  <th>Parcelas</th><th>Pagas</th><th>Status</th><th>Início</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.length > 0 ? (
                  filteredLoans.map((l) => (
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
                    <td colSpan="7" style={{ textAlign: "center", padding: "30px", color: "var(--text-dim)" }}>
                      Nenhum empréstimo no período.
                    </td>
                  </tr>
                )}
              </tbody>
              {filteredLoans.length > 0 && (
                <tfoot>
                  <tr>
                    <td><strong>Total</strong></td>
                    <td><strong>{fmt(filteredLoans.reduce((s, l) => s + (Number(l.value) || 0), 0))}</strong></td>
                    <td colSpan="5" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ── Cash Flow ──────────────────────────────────────────────────────── */}
      {reportType === "cashflow" && (
        <div className="card animate-in" style={{ "--delay": 1 }}>
          <div className="card-header">
            <h3>
              Fluxo de Caixa
              <span style={{ marginLeft: 8, fontSize: "0.8rem", color: "var(--text-dim)", fontWeight: 400 }}>
                ({filteredTransactions.length} transações)
              </span>
            </h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={handleExportCashflowPDF}>
                📄 PDF
              </button>
              <button className="btn btn-gold btn-sm" onClick={handleExportCashflowExcel}>
                📊 Excel
              </button>
            </div>
          </div>
          {/* Summary */}
          <div style={{ display: "flex", gap: 16, padding: "12px 16px", flexWrap: "wrap" }}>
            <div style={{ padding: "10px 20px", background: "var(--green-dim)", borderRadius: "var(--radius-sm)", border: "1px solid var(--green)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Total Entradas</div>
              <div style={{ fontWeight: 700, color: "var(--green)" }}>{fmt(cashflow.totalIncome)}</div>
            </div>
            <div style={{ padding: "10px 20px", background: "var(--red-dim)", borderRadius: "var(--radius-sm)", border: "1px solid var(--red)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Total Saídas</div>
              <div style={{ fontWeight: 700, color: "var(--red)" }}>{fmt(cashflow.totalExpense)}</div>
            </div>
            <div style={{ padding: "10px 20px", background: "var(--gold-glow)", borderRadius: "var(--radius-sm)", border: "1px solid var(--gold)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Saldo</div>
              <div style={{ fontWeight: 700, color: cashflow.totalIncome - cashflow.totalExpense >= 0 ? "var(--green)" : "var(--red)" }}>
                {fmt(cashflow.totalIncome - cashflow.totalExpense)}
              </div>
            </div>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((t) => (
                    <tr key={t.id}>
                      <td>{fmtDate(t.date)}</td>
                      <td>{t.description}</td>
                      <td>{t.category || "—"}</td>
                      <td>
                        <span className={`status ${t.type === "income" ? "status-active" : "status-overdue"}`}>
                          {t.type === "income" ? "Entrada" : "Saída"}
                        </span>
                      </td>
                      <td className={t.type === "income" ? "tx-income" : "tx-expense"}>
                        {t.type === "expense" ? "-" : ""}{fmt(t.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "var(--text-dim)" }}>
                      Nenhuma transação no período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Inadimplência ──────────────────────────────────────────────────── */}
      {reportType === "overdue" && (
        <div className="card animate-in" style={{ "--delay": 1 }}>
          <div className="card-header">
            <h3>
              Inadimplência
              <span style={{ marginLeft: 8, fontSize: "0.8rem", color: "var(--red)", fontWeight: 400 }}>
                ({inadimplentes.length} empréstimo{inadimplentes.length !== 1 ? "s" : ""} em atraso)
              </span>
            </h3>
            <button className="btn btn-outline btn-sm" onClick={handleExportInadimplenciaPDF}>
              📄 PDF
            </button>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th><th>Valor Original</th><th>Taxa</th>
                  <th>Parcelas</th><th>Pagas</th><th>A Receber</th><th>Início</th>
                </tr>
              </thead>
              <tbody>
                {inadimplentes.length > 0 ? (
                  inadimplentes.map((l) => (
                    <tr key={l.id} className="row-overdue">
                      <td><strong>{l.client}</strong></td>
                      <td>{fmt(l.value)}</td>
                      <td>{l.interest_rate ? `${l.interest_rate}% a.m.` : "—"}</td>
                      <td>{l.installments}</td>
                      <td>{l.paid}</td>
                      <td className="tx-expense"><strong>{fmt(l.remaining)}</strong></td>
                      <td>{fmtDate(l.start_date)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "30px", color: "var(--green)" }}>
                      ✓ Nenhum empréstimo em atraso!
                    </td>
                  </tr>
                )}
              </tbody>
              {inadimplentes.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan="5"><strong>Total em Atraso</strong></td>
                    <td className="tx-expense">
                      <strong>{fmt(inadimplentes.reduce((s, l) => s + l.remaining, 0))}</strong>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ── Clients ────────────────────────────────────────────────────────── */}
      {reportType === "clients" && (
        <div className="card animate-in" style={{ "--delay": 1 }}>
          <div className="card-header">
            <h3>
              Clientes
              <span style={{ marginLeft: 8, fontSize: "0.8rem", color: "var(--text-dim)", fontWeight: 400 }}>
                ({clients.length} clientes)
              </span>
            </h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={handleExportClientesPDF}>
                📄 PDF
              </button>
              <button className="btn btn-gold btn-sm" onClick={handleExportClientesExcel}>
                📊 Excel
              </button>
            </div>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th><th>CPF/CNPJ</th><th>Telefone</th><th>Email</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {clients.length > 0 ? (
                  clients.map((c) => (
                    <tr key={c.id}>
                      <td><strong>{c.name}</strong></td>
                      <td>{c.cpf_cnpj || "—"}</td>
                      <td>{c.phone || "—"}</td>
                      <td>{c.email || "—"}</td>
                      <td>
                        <span className={`status status-${c.status}`}>
                          {c.status === "active" ? "Ativo" : c.status === "inactive" ? "Inativo" : c.status === "overdue" ? "Inadimplente" : c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "var(--text-dim)" }}>
                      Nenhum cliente cadastrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Relatorios;
