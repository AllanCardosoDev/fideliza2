// src/pages/Relatorios.jsx
import React, { useState, useContext, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AppContext, ThemeContext } from "../App";
import { fmt, fmtDate, calcPMT, getClientName } from "../utils/helpers";
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
import { Pie, Bar, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
);

function Relatorios() {
  const { loans, clients, transactions, currentUser, userRole } =
    useContext(AppContext);
  const { theme } = useContext(ThemeContext);

  // State para busca de protocolo
  const [selectedProtocol, setSelectedProtocol] = useState("");

  const getCss = (v) =>
    getComputedStyle(document.documentElement).getPropertyValue(v).trim();

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

  // Get all available protocols (AFTER accessibleLoans is defined)
  const availableProtocols = useMemo(() => {
    return accessibleLoans
      .filter((l) => l.protocol)
      .map((l) => ({ id: l.id, protocol: l.protocol, client: l.client }))
      .sort((a, b) => (b.protocol || "").localeCompare(a.protocol || ""));
  }, [accessibleLoans]);

  // Get selected loan detail (AFTER accessibleLoans is defined)
  const selectedLoanDetail = useMemo(() => {
    if (!selectedProtocol) return null;
    const loan = accessibleLoans.find((l) => l.protocol === selectedProtocol);
    if (!loan) return null;

    const client = clients.find((c) => c.id === loan.client_id);
    const pmt = calcPMT(
      Number(loan.value) || 0,
      (Number(loan.interest_rate) || 0) / 100,
      Number(loan.installments) || 1,
    );
    const totalPayment = pmt * (Number(loan.installments) || 0);
    const totalInterest = totalPayment - (Number(loan.value) || 0);

    return {
      ...loan,
      client,
      pmt,
      totalPayment,
      totalInterest,
    };
  }, [selectedProtocol, accessibleLoans, clients]);

  // Generate all installments (same logic as Cobranças)
  const allInstallments = useMemo(() => {
    const items = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    accessibleLoans.forEach((loan) => {
      if (!loan.start_date) return;
      const v = Number(loan.value) || 0;
      const rate = (Number(loan.interest_rate) || 0) / 100;
      const n = Number(loan.installments) || 0;
      const paid = Number(loan.paid) || 0;
      if (!v || !n) return;

      const pmt = calcPMT(v, rate, n);
      const start = new Date(loan.start_date + "T00:00:00");

      for (let i = 1; i <= n; i++) {
        const due = new Date(start);
        due.setMonth(due.getMonth() + (i - 1));
        const dueDate = due.toISOString().split("T")[0];

        let status;
        if (i <= paid) {
          status = "paid";
        } else if (due < today) {
          status = "overdue";
        } else {
          status = "due";
        }

        items.push({
          id: `${loan.id}-${i}`,
          loanId: loan.id,
          client: getClientName(loan.client),
          installmentNo: i,
          totalInstallments: n,
          dueDate,
          due,
          amount: pmt,
          status,
        });
      }
    });
    return items;
  }, [loans]);

  // ── Computed stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = loans.reduce((s, l) => s + (Number(l.value) || 0), 0);
    const active = loans.filter(
      (l) => l.status === "active" || l.status === "overdue",
    );
    const paid = loans.filter((l) => l.status === "paid");
    const overdue = loans.filter((l) => l.status === "overdue");

    // ✅ Use paid installments (same logic as Cobranças)
    const paidInstallments = allInstallments.filter((i) => i.status === "paid");
    const totalReceived = paidInstallments.reduce((s, i) => s + i.amount, 0);

    const totalPending = loans.reduce((s, l) => {
      if (l.status === "paid" || l.status === "cancelled") return s;
      const pmt = calcPMT(
        Number(l.value) || 0,
        (Number(l.interest_rate) || 0) / 100,
        Number(l.installments) || 1,
      );
      return (
        s +
        pmt * Math.max((Number(l.installments) || 0) - (Number(l.paid) || 0), 0)
      );
    }, 0);

    const totalInterest = loans.reduce((s, l) => {
      const pmt = calcPMT(
        Number(l.value) || 0,
        (Number(l.interest_rate) || 0) / 100,
        Number(l.installments) || 1,
      );
      const totalPay = pmt * (Number(l.installments) || 0);
      return s + (totalPay - (Number(l.value) || 0));
    }, 0);

    return {
      total,
      active,
      paid,
      overdue,
      totalReceived,
      totalPending,
      totalInterest,
    };
  }, [accessibleLoans, allInstallments]);

  // ── Monthly data (last 6 months) ─────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("pt-BR", {
          month: "short",
          year: "2-digit",
        }),
      });
    }
    const loaned = months.map(({ key }) =>
      accessibleLoans
        .filter((l) => l.start_date && l.start_date.startsWith(key))
        .reduce((s, l) => s + (Number(l.value) || 0), 0),
    );
    // ✅ Use paid installments by dueDate
    const received = months.map(({ key }) =>
      allInstallments
        .filter(
          (i) => i.status === "paid" && i.dueDate && i.dueDate.startsWith(key),
        )
        .reduce((s, i) => s + i.amount, 0),
    );
    const count = months.map(
      ({ key }) =>
        accessibleLoans.filter(
          (l) => l.start_date && l.start_date.startsWith(key),
        ).length,
    );
    return { labels: months.map((m) => m.label), loaned, received, count };
  }, [accessibleLoans, allInstallments, theme]); // eslint-disable-line react-hooks/exhaustive-deps

  const barData = {
    labels: ["FidelizaCred"],
    datasets: [
      {
        label: "Total Emprestado",
        data: [stats.total],
        backgroundColor: getCss("--gold"),
        borderColor: getCss("--gold"),
        borderWidth: 1,
      },
      {
        label: "Total Recebido",
        data: [stats.totalReceived],
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
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${fmt(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: getCss("--text-dim") },
        grid: { color: getCss("--border") },
      },
      y: {
        ticks: { color: getCss("--text-dim"), callback: (v) => fmt(v) },
        grid: { color: getCss("--border") },
      },
    },
  };

  // Status breakdown pie chart (by VALUE, not count)
  const statusBreakdown = {
    active: loans
      .filter((l) => l.status === "active")
      .reduce((s, l) => s + (Number(l.value) || 0), 0),
    overdue: loans
      .filter((l) => l.status === "overdue")
      .reduce((s, l) => s + (Number(l.value) || 0), 0),
    paid: loans
      .filter((l) => l.status === "paid")
      .reduce((s, l) => s + (Number(l.value) || 0), 0),
    other: loans
      .filter((l) => !["active", "overdue", "paid"].includes(l.status))
      .reduce((s, l) => s + (Number(l.value) || 0), 0),
  };

  const pieData = {
    labels: ["Ativos", "Atrasados em Cobrança", "Pagos", "Verificar"],
    datasets: [
      {
        data: [
          statusBreakdown.active,
          statusBreakdown.overdue,
          statusBreakdown.paid,
          statusBreakdown.other,
        ],
        backgroundColor: [
          getCss("--green"),
          getCss("--red"),
          getCss("--blue"),
          getCss("--text-dim"),
        ],
        borderColor: getCss("--bg-card"),
        borderWidth: 2,
      },
    ],
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
        callbacks: {
          label: (ctx) => `${ctx.label}: ${fmt(ctx.parsed)}`,
        },
      },
    },
  };

  // ── Export functions ─────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Cliente",
      "Valor",
      "Taxa",
      "Parcelas",
      "Pagas",
      "Status",
      "Início",
    ];
    const rows = loans.map((l) => [
      l.id,
      l.client,
      l.value,
      `${l.interest_rate}%`,
      l.installments,
      l.paid,
      l.status,
      l.start_date || "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
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
      c.id,
      c.name,
      c.cpf_cnpj || "",
      c.phone || "",
      c.email || "",
      c.status || "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c2) => `"${c2}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportContratosCSV = () => {
    const headers = [
      "Protocolo",
      "Cliente",
      "CPF",
      "Valor",
      "Taxa",
      "Parcelas",
      "Pagas",
      "A Pagar",
      "Status",
      "Início",
      "Data de Expedição",
    ];
    const rows = loans.map((l) => {
      const pmt = calcPMT(
        Number(l.value) || 0,
        (Number(l.interest_rate) || 0) / 100,
        Number(l.installments) || 1,
      );
      const remaining =
        ((Number(l.installments) || 0) - (Number(l.paid) || 0)) * pmt;
      const client = clients.find((c) => c.id === l.client_id);
      return [
        l.protocol || "—",
        l.client,
        client?.cpf_cnpj || "—",
        l.value,
        `${l.interest_rate}%`,
        l.installments,
        l.paid,
        remaining,
        l.status,
        l.start_date || "",
        new Date().toLocaleDateString("pt-BR"),
      ];
    });
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contratos-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Export Protocol PDF ─────────────────────────────────────────────────────
  const handleExportProtocolPDF = (loan) => {
    if (!loan) return;

    const client = clients.find((c) => c.id === loan.client_id);
    if (!client) {
      alert("Cliente não encontrado");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Logo no canto superior esquerdo com fundo
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 20, "F");

    // Tentar adicionar a logo
    try {
      doc.addImage("/logo.jpeg", "JPEG", 5, 3, 14, 14);
    } catch {
      // Se a logo não carregar, usar um placeholder com iniciais
      doc.setTextColor(240, 200, 80);
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("FC", 8, 14);
    }

    // Título ao lado da logo
    doc.setTextColor(240, 200, 80);
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("CONTRATO DE EMPRÉSTIMO", 22, 13);

    // Informações principais
    let yPos = 30;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");

    doc.text(`Contratante: ${client.name || "—"}`, 10, yPos);
    yPos += 6;
    doc.text(`Protocolo: ${loan.protocol || "—"}`, 10, yPos);
    yPos += 6;
    doc.text(`Valor do Empréstimo: ${fmt(loan.value)}`, 10, yPos);
    yPos += 6;
    doc.text(`Taxa de Juros: ${loan.interest_rate}% a.m.`, 10, yPos);
    yPos += 6;
    doc.text(`Número de Parcelas: ${loan.installments}`, 10, yPos);
    yPos += 6;
    doc.text(`Data de Contratação: ${fmtDate(loan.start_date)}`, 10, yPos);
    yPos += 12;

    // Título da tabela
    doc.setFont(undefined, "bold");
    doc.text("CRONOGRAMA DE PARCELAS", 10, yPos);
    yPos += 8;
    doc.setFont(undefined, "normal");

    // Calcular dados da amortização
    const v = Number(loan.value) || 0;
    const r = (Number(loan.interest_rate) || 0) / 100;
    const n = Number(loan.installments) || 0;
    const pmt = calcPMT(v, r, n);

    // Gerar tabela de parcelas usando autoTable
    const tableData = [];
    let balance = v;

    for (let i = 1; i <= n; i++) {
      const interest = balance * r;
      const amort = pmt - interest;
      balance -= amort;

      const due = new Date(loan.start_date + "T00:00:00");
      due.setMonth(due.getMonth() + (i - 1));
      const dueDate = due.toISOString().split("T")[0];
      const [year, month, day] = dueDate.split("-");
      const dueDateFormatted = `${day}/${month}/${year}`;

      tableData.push([
        i,
        dueDateFormatted,
        fmt(pmt),
        fmt(interest),
        fmt(amort),
        fmt(Math.max(balance, 0)),
      ]);
    }

    autoTable(doc, {
      head: [
        [
          "Parc.",
          "Vencimento",
          "Valor Parcela",
          "Juros",
          "Amortização",
          "Saldo Devedor",
        ],
      ],
      body: tableData,
      startY: yPos,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [240, 200, 80],
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { halign: "center" },
        1: { halign: "center" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" },
      },
    });

    // Rodapé
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Documento gerado em ${new Date().toLocaleString("pt-BR")}`,
      10,
      pageHeight - 10,
    );

    doc.save(
      `contrato-${loan.id}-${(client.name || "contratos").replace(/\s+/g, "-")}.pdf`,
    );
  };

  // Inadimplência list
  const inadimplentes = useMemo(() => {
    return loans
      .filter((l) => l.status === "overdue")
      .map((l) => {
        const pmt = calcPMT(
          Number(l.value) || 0,
          (Number(l.interest_rate) || 0) / 100,
          Number(l.installments) || 1,
        );
        const remaining =
          ((Number(l.installments) || 0) - (Number(l.paid) || 0)) * pmt;
        return { ...l, remaining };
      })
      .sort((a, b) => b.remaining - a.remaining);
  }, [loans]);

  // ── Fluxo de Caixa (Cash Flow) ─────────────────────────────────────────
  const fluxoCaixa = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("pt-BR", {
          month: "short",
          year: "2-digit",
        }),
      });
    }

    let cashBalance = 1000000; // Initial cash (1M)
    const balances = [];

    months.forEach(({ key }) => {
      // Loan disbursements (saídas)
      const loaned = loans
        .filter((l) => l.start_date && l.start_date.startsWith(key))
        .reduce((s, l) => s + (Number(l.value) || 0), 0);

      // Payments received (entradas)
      const received = allInstallments
        .filter(
          (i) => i.status === "paid" && i.dueDate && i.dueDate.startsWith(key),
        )
        .reduce((s, i) => s + i.amount, 0);

      // Balance = Previous + Received - Loaned
      cashBalance = cashBalance + received - loaned;
      balances.push(cashBalance);
    });

    return {
      labels: months.map((m) => m.label),
      balances,
    };
  }, [accessibleLoans, allInstallments]);

  const lineData = {
    labels: fluxoCaixa.labels,
    datasets: [
      {
        label: "Saldo de Caixa",
        data: fluxoCaixa.balances,
        borderColor: getCss("--gold"),
        backgroundColor: "rgba(255, 165, 0, 0.1)",
        pointBackgroundColor: getCss("--gold"),
        pointBorderColor: getCss("--bg-primary"),
        pointBorderWidth: 2,
        pointRadius: 5,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const lineOptions = {
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
        callbacks: {
          label: (ctx) => `Saldo: ${fmt(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: getCss("--text-dim") },
        grid: { color: `${getCss("--border")}40` },
      },
      y: {
        ticks: { color: getCss("--text-dim"), callback: (v) => fmt(v) },
        grid: { color: `${getCss("--border")}40` },
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
          <button className="btn btn-outline btn-sm" onClick={handleExportCSV}>
            📊 Exportar Empréstimos (CSV)
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={handleExportContratosCSV}
          >
            📑 Exportar Contratos (CSV)
          </button>
          <button
            className="btn btn-gold btn-sm"
            onClick={handleExportClientesCSV}
          >
            👥 Exportar Clientes (CSV)
          </button>
        </div>
      </div>

      {/* Protocol Search Card */}
      <div
        className="card animate-in"
        style={{ "--delay": 0.5, marginBottom: 24 }}
      >
        <div className="card-header">
          <h3>🔍 Buscar por Protocolo</h3>
        </div>
        <div
          style={{
            padding: 16,
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 16,
            alignItems: "end",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--text-dim)",
                textTransform: "uppercase",
              }}
            >
              Selecione um Protocolo
            </label>
            <select
              value={selectedProtocol}
              onChange={(e) => setSelectedProtocol(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                borderRadius: 6,
                fontSize: "1rem",
                fontWeight: 600,
              }}
            >
              <option value="">-- Selecione um protocolo --</option>
              {availableProtocols.map((p) => (
                <option key={p.id} value={p.protocol}>
                  {p.protocol} - {p.client}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-gold btn-sm"
            onClick={() => {
              if (selectedLoanDetail) {
                handleExportProtocolPDF(selectedLoanDetail);
              }
            }}
            disabled={!selectedLoanDetail}
            style={{
              opacity: !selectedLoanDetail ? 0.5 : 1,
              cursor: !selectedLoanDetail ? "not-allowed" : "pointer",
            }}
          >
            📄 Gerar PDF
          </button>
        </div>

        {/* Selected Protocol Details */}
        {selectedLoanDetail && (
          <div
            style={{
              padding: "16px",
              backgroundColor: "rgba(22, 163, 74, 0.05)",
              borderTop: "1px solid var(--border)",
              borderRadius: "0 0 8px 8px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--text-dim)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Cliente
                </span>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  {selectedLoanDetail.client?.name ||
                    selectedLoanDetail.client ||
                    "—"}
                </p>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--text-dim)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Valor Empréstimo
                </span>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  {fmt(selectedLoanDetail.value)}
                </p>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--text-dim)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Taxa (a.m.)
                </span>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  {parseFloat(selectedLoanDetail.interest_rate || 0).toFixed(2)}
                  %
                </p>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--text-dim)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Parcelas
                </span>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  {selectedLoanDetail.paid}/{selectedLoanDetail.installments}
                </p>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--text-dim)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Valor Parcela
                </span>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  {fmt(selectedLoanDetail.pmt)}
                </p>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--text-dim)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Status
                </span>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      backgroundColor:
                        selectedLoanDetail.status === "active"
                          ? "rgba(34, 197, 94, 0.1)"
                          : selectedLoanDetail.status === "paid"
                            ? "rgba(59, 130, 246, 0.1)"
                            : selectedLoanDetail.status === "overdue"
                              ? "rgba(239, 68, 68, 0.1)"
                              : "rgba(107, 114, 128, 0.1)",
                      color:
                        selectedLoanDetail.status === "active"
                          ? "var(--green)"
                          : selectedLoanDetail.status === "paid"
                            ? "var(--blue)"
                            : selectedLoanDetail.status === "overdue"
                              ? "var(--red)"
                              : "var(--text-dim)",
                    }}
                  >
                    {selectedLoanDetail.status}
                  </span>
                </p>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--text-dim)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Juros Totais
                </span>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  {fmt(selectedLoanDetail.totalInterest)}
                </p>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--text-dim)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Total a Receber
                </span>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--gold)",
                  }}
                >
                  {fmt(selectedLoanDetail.totalPayment)}
                </p>
              </div>
            </div>
          </div>
        )}
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
          <div className="card-header">
            <h3>Comparativo - Total Emprestado vs Total Recebido</h3>
          </div>
          <div className="chart-container">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
        <div className="card chart-card animate-in" style={{ "--delay": 2 }}>
          <div className="card-header">
            <h3>Status dos Empréstimos</h3>
          </div>
          <div className="chart-container">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>
      </div>

      {/* Fluxo de Caixa */}
      <div className="card animate-in chart-card" style={{ "--delay": 2.5 }}>
        <div className="card-header">
          <h3>💰 Fluxo de Caixa (12 últimos meses)</h3>
        </div>
        <div className="chart-container" style={{ height: "300px" }}>
          <Line data={lineData} options={lineOptions} />
        </div>
      </div>

      {/* Inadimplência table */}
      {inadimplentes.length > 0 && (
        <div className="card animate-in" style={{ "--delay": 3 }}>
          <div className="card-header">
            <h3>Relatório de Inadimplência</h3>
            <span className="kpi-change negative">
              {inadimplentes.length} empréstimo
              {inadimplentes.length !== 1 ? "s" : ""} em atraso
            </span>
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
                    <td>
                      <strong>{l.client}</strong>
                    </td>
                    <td>{fmt(l.value)}</td>
                    <td>
                      {l.interest_rate ? `${l.interest_rate}% a.m.` : "—"}
                    </td>
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

      {/* Contratos e Protocolos table */}
      <div className="card animate-in" style={{ "--delay": 4 }}>
        <div className="card-header">
          <h3>📋 Contratos e Protocolos</h3>
          <span className="badge" style={{ fontSize: "0.8rem" }}>
            {loans.length} contrato{loans.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Protocolo</th>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Taxa</th>
                <th>Parcelas</th>
                <th>Pagas</th>
                <th>Status</th>
                <th>Início</th>
                <th style={{ textAlign: "center" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loans.length > 0 ? (
                loans.map((l) => {
                  const client = clients.find((c) => c.id === l.client_id);
                  return (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 700, color: "var(--gold)" }}>
                        {l.protocol || "—"}
                      </td>
                      <td>{l.client}</td>
                      <td>{fmt(l.value)}</td>
                      <td>{l.interest_rate ? `${l.interest_rate}%` : "—"}</td>
                      <td>{l.installments}</td>
                      <td>{l.paid}</td>
                      <td>
                        <span className={`status status-${l.status}`}>
                          {l.status === "active"
                            ? "Ativo"
                            : l.status === "paid"
                              ? "Pago"
                              : l.status === "overdue"
                                ? "Atrasado"
                                : l.status}
                        </span>
                      </td>
                      <td>{fmtDate(l.start_date)}</td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => {
                            handleExportProtocolPDF(l);
                          }}
                          title="Gerar e baixar PDF do contrato"
                          style={{
                            padding: "4px 8px",
                            fontSize: "0.75rem",
                          }}
                        >
                          📄 PDF
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "var(--text-dim)",
                    }}
                  >
                    Nenhum contrato registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* All loans table */}
      <div className="card animate-in" style={{ "--delay": 5 }}>
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
                        {l.status === "active"
                          ? "Ativo"
                          : l.status === "paid"
                            ? "Pago"
                            : l.status === "overdue"
                              ? "Atrasado"
                              : l.status}
                      </span>
                    </td>
                    <td>{fmtDate(l.start_date)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
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

export default Relatorios;
