import React, { useState, useMemo } from "react";
import { fmt } from "../utils/helpers";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const INTEREST_MODES = [
  { value: "per_installment", label: "Por Parcela", icon: "📦" },
  { value: "on_total", label: "Sobre o Total", icon: "💰" },
  { value: "compound_pure", label: "Compostos Puro", icon: "⚡" },
  {
    value: "price_table",
    label: "Tabela Price",
    icon: "📊",
    recommended: true,
  },
  { value: "sac", label: "SAC", icon: "📈" },
];

function Simulador() {
  const [form, setForm] = useState({
    value: 10000,
    interestRate: 2.98,
    installments: 12,
    startDate: "2026-05-04",
  });

  const [selectedMode, setSelectedMode] = useState("price_table");

  const set = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const calculations = useMemo(() => {
    const v = form.value;
    const r = form.interestRate / 100;
    const n = form.installments;

    const results = {};

    results.per_installment = {
      name: "Por Parcela",
      totalInterest: v * r * n,
      totalToReceive: v + v * r * n,
      installmentValue: (v + v * r * n) / n,
      rows: Array.from({ length: n }, (_, i) => {
        const due = new Date(form.startDate);
        due.setMonth(due.getMonth() + i);
        return {
          installment: i + 1,
          dueDate: due.toISOString().split("T")[0],
          payment: (v + v * r * n) / n,
          interest: (v * r * n) / n,
          amortization: v / n,
          balance: v - (v / n) * (i + 1),
        };
      }),
    };

    results.on_total = {
      name: "Sobre o Total",
      totalInterest: v * r,
      totalToReceive: v + v * r,
      installmentValue: (v + v * r) / n,
      rows: Array.from({ length: n }, (_, i) => {
        const due = new Date(form.startDate);
        due.setMonth(due.getMonth() + i);
        return {
          installment: i + 1,
          dueDate: due.toISOString().split("T")[0],
          payment: (v + v * r) / n,
          interest: (v * r) / n,
          amortization: v / n,
          balance: v - (v / n) * (i + 1),
        };
      }),
    };

    results.compound_pure = {
      name: "Juros Compostos Puro",
      totalToReceive: v * Math.pow(1 + r, n),
      totalInterest: v * Math.pow(1 + r, n) - v,
      installmentValue: (v * Math.pow(1 + r, n)) / n,
      rows: Array.from({ length: n }, (_, i) => {
        const due = new Date(form.startDate);
        due.setMonth(due.getMonth() + i);
        const totalFinal = v * Math.pow(1 + r, n);
        return {
          installment: i + 1,
          dueDate: due.toISOString().split("T")[0],
          payment: totalFinal / n,
          interest: (totalFinal - v) / n,
          amortization: v / n,
          balance: v - (v / n) * (i + 1),
        };
      }),
    };

    const calcPMT = (principal, rate, nInstallments) => {
      if (rate === 0) return principal / nInstallments;
      return (
        (principal * rate * Math.pow(1 + rate, nInstallments)) /
        (Math.pow(1 + rate, nInstallments) - 1)
      );
    };

    const pmt = calcPMT(v, r, n);
    let balance = v;
    const priceRows = [];
    let totalInterest = 0;

    for (let i = 1; i <= n; i++) {
      const interest = balance * r;
      const amort = pmt - interest;
      balance -= amort;
      totalInterest += interest;

      const due = new Date(form.startDate);
      due.setMonth(due.getMonth() + i - 1);

      priceRows.push({
        installment: i,
        dueDate: due.toISOString().split("T")[0],
        payment: pmt,
        interest,
        amortization: amort,
        balance: Math.max(balance, 0),
      });
    }

    results.price_table = {
      name: "Tabela Price",
      totalInterest,
      totalToReceive: pmt * n,
      installmentValue: pmt,
      rows: priceRows,
    };

    const amortizationConstant = v / n;
    let balanceSAC = v;
    const sacRows = [];
    let totalInterestSAC = 0;

    for (let i = 1; i <= n; i++) {
      const interestSAC = balanceSAC * r;
      totalInterestSAC += interestSAC;
      const paymentSAC = amortizationConstant + interestSAC;
      balanceSAC -= amortizationConstant;

      const due = new Date(form.startDate);
      due.setMonth(due.getMonth() + i - 1);

      sacRows.push({
        installment: i,
        dueDate: due.toISOString().split("T")[0],
        payment: paymentSAC,
        interest: interestSAC,
        amortization: amortizationConstant,
        balance: Math.max(balanceSAC, 0),
      });
    }

    results.sac = {
      name: "SAC",
      totalInterest: totalInterestSAC,
      totalToReceive: v + totalInterestSAC,
      installmentValue: "Variável",
      rows: sacRows,
    };

    return results;
  }, [form.value, form.interestRate, form.installments, form.startDate]);

  const selectedCalculation = calculations[selectedMode];

  // Helper para converter data YYYY-MM-DD para DD/MM/YYYY
  const formatDateToDDMMYYYY = (dateStr) => {
    if (!dateStr) return "—";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const handleExportFullPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;

    // ════ Header with branding ════
    doc.setFillColor(22, 163, 74); // Green (#16A34A)
    doc.rect(0, 0, pageWidth, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, "bold");
    doc.text("FidelizaCred", margin + 5, 18);
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text("Sistema de Gestão de Empréstimos", margin + 5, 25);

    // Mode highlight box
    let yPos = 40;
    doc.setFillColor(220, 252, 231); // Light green background
    doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 15, "F");
    doc.setTextColor(22, 163, 74);
    doc.setFont(undefined, "bold");
    doc.setFontSize(14);
    doc.text(`Modo: ${selectedCalculation.name}`, pageWidth / 2, yPos + 3, {
      align: "center",
    });

    yPos += 20;

    // ════ Two-column layout: Simulation & Details ════
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");

    // Left column: Dados da Simulação
    doc.text("DADOS DA SIMULAÇÃO", margin, yPos);
    doc.setFont(undefined, "normal");
    doc.setFontSize(10);
    yPos += 8;

    doc.text(`Valor: ${fmt(form.value)}`, margin, yPos);
    yPos += 6;
    doc.text(`Taxa: ${form.interestRate.toFixed(2)}% a.m.`, margin, yPos);
    yPos += 6;
    doc.text(`Parcelas: ${form.installments}`, margin, yPos);
    yPos += 6;
    doc.text(`Início: ${formatDateToDDMMYYYY(form.startDate)}`, margin, yPos);

    // Right column: Detalhes do Simulador
    const rightCol = margin + 100;
    doc.setFont(undefined, "bold");
    doc.setFontSize(11);
    doc.text("DETALHES DO SIMULADOR", rightCol, yPos - 20);
    doc.setFont(undefined, "normal");
    doc.setFontSize(10);

    const pmt =
      selectedCalculation.rows.length > 0
        ? selectedCalculation.rows[0].payment
        : 0;
    doc.text(`Valor Parcela: ${fmt(pmt)}`, rightCol, yPos - 14);
    doc.text(
      `Juros Totais: ${fmt(selectedCalculation.totalInterest)}`,
      rightCol,
      yPos - 8,
    );
    doc.text(
      `Total: ${fmt(selectedCalculation.totalToReceive)}`,
      rightCol,
      yPos - 2,
    );

    yPos += 15;

    // ════ Summary box ════
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 18, "F");
    doc.setFont(undefined, "bold");
    doc.setFontSize(11);
    doc.setTextColor(22, 163, 74);

    doc.text(`Valor a Receber: ${fmt(form.value)}`, margin + 5, yPos + 6);
    doc.text(`Valor de Cada Parcela: ${fmt(pmt)}`, pageWidth / 2, yPos + 6);

    yPos += 25;

    // ════ Payment Schedule ════
    doc.setFont(undefined, "bold");
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text("CRONOGRAMA DE PAGAMENTO", margin, yPos);
    yPos += 8;

    const scheduleRows = selectedCalculation.rows.map((row) => [
      row.installment,
      formatDateToDDMMYYYY(row.dueDate),
      fmt(row.payment),
      fmt(row.interest),
      fmt(row.balance),
    ]);

    autoTable(doc, {
      head: [["Parcela", "Vencimento", "Pagamento", "Juros", "Saldo"]],
      body: scheduleRows,
      startY: yPos,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: 51,
      },
      headStyles: {
        fillColor: [22, 163, 74],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [243, 244, 246],
      },
      columnStyles: {
        0: { halign: "center" },
        1: { halign: "center" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // ════ Footer ════
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `FidelizaCred © 2026 | Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: "center" },
    );

    doc.save(
      `simulador-completo-${selectedMode}-${new Date().toISOString().split("T")[0]}.pdf`,
    );
  };

  const handleExportClientPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;

    // ════ Header with branding ════
    doc.setFillColor(22, 163, 74); // Green (#16A34A)
    doc.rect(0, 0, pageWidth, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, "bold");
    doc.text("FidelizaCred", margin + 5, 18);
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text("Sistema de Gestão de Empréstimos", margin + 5, 25);

    // Simulation highlight box
    let yPos = 40;
    doc.setFillColor(220, 252, 231); // Light green background
    doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 15, "F");
    doc.setTextColor(22, 163, 74);
    doc.setFont(undefined, "bold");
    doc.setFontSize(14);
    doc.text(
      `Simulação - ${selectedCalculation.name}`,
      pageWidth / 2,
      yPos + 3,
      { align: "center" },
    );

    yPos += 20;

    // ════ Two-column layout ════
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");

    // Left column: Dados do Empréstimo
    doc.text("DADOS DO EMPRÉSTIMO", margin, yPos);
    doc.setFont(undefined, "normal");
    doc.setFontSize(10);
    yPos += 8;

    doc.text(`Valor: ${fmt(form.value)}`, margin, yPos);
    yPos += 6;
    doc.text(`Taxa: ${form.interestRate.toFixed(2)}% a.m.`, margin, yPos);
    yPos += 6;
    doc.text(`Parcelas: ${form.installments}`, margin, yPos);
    yPos += 6;
    doc.text(`Início: ${formatDateToDDMMYYYY(form.startDate)}`, margin, yPos);

    // Right column: Detalhes
    const rightCol = margin + 100;
    doc.setFont(undefined, "bold");
    doc.setFontSize(11);
    doc.text("DADOS DO PAGAMENTO", rightCol, yPos - 18);
    doc.setFont(undefined, "normal");
    doc.setFontSize(10);

    const pmt =
      selectedCalculation.rows.length > 0
        ? selectedCalculation.rows[0].payment
        : 0;
    doc.text(`Parcela: ${fmt(pmt)}`, rightCol, yPos - 12);
    doc.text(
      `Total: ${fmt(selectedCalculation.totalToReceive)}`,
      rightCol,
      yPos - 6,
    );

    yPos += 15;

    // ════ Summary box ════
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 18, "F");
    doc.setFont(undefined, "bold");
    doc.setFontSize(11);
    doc.setTextColor(22, 163, 74);

    doc.text(
      `Juros Totais: ${fmt(selectedCalculation.totalInterest)}`,
      margin + 5,
      yPos + 6,
    );
    doc.text(
      `Valor Final: ${fmt(selectedCalculation.totalToReceive)}`,
      pageWidth / 2,
      yPos + 6,
    );

    yPos += 25;

    // ════ Payment Schedule ════
    doc.setFont(undefined, "bold");
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text("CRONOGRAMA DE PAGAMENTO", margin, yPos);
    yPos += 8;

    // Para cliente: Parcela, vencimento e valor de pagamento
    const clientScheduleRows = selectedCalculation.rows.map((row) => [
      String(row.installment),
      formatDateToDDMMYYYY(row.dueDate),
      fmt(row.payment),
    ]);

    autoTable(doc, {
      head: [["Parcela", "Vencimento", "Pagamento"]],
      body: clientScheduleRows,
      startY: yPos,
      theme: "grid",
      styles: {
        fontSize: 10,
        cellPadding: 4,
        textColor: 51,
      },
      headStyles: {
        fillColor: [22, 163, 74],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [243, 244, 246],
      },
      columnStyles: {
        0: { halign: "center" },
        1: { halign: "center" },
        2: { halign: "right" },
      },
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // ════ Footer ════
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `FidelizaCred © 2026 | Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: "center" },
    );

    doc.save(
      `simulador-cliente-${selectedMode}-${new Date().toISOString().split("T")[0]}.pdf`,
    );
  };

  return (
    <div className="page active">
      <style>{`
        .sim-grid-layout {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 24px;
        }

        .sim-section {
          background: var(--bg-alt);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 24px;
        }
        
        .sim-section-title {
          margin-top: 0;
          margin-bottom: 20px;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--gold);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sim-input-group {
          margin-bottom: 16px;
        }

        .sim-input-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-dim);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .sim-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .sim-input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-dim);
          font-weight: 600;
          font-size: 1rem;
        }

        .sim-input {
          width: 100%;
          padding: 12px 14px 12px 40px;
          border: 1px solid var(--border);
          background: var(--bg);
          color: var(--text);
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .sim-input:focus {
          outline: none;
          border-color: var(--gold);
          box-shadow: 0 0 0 3px rgba(240, 200, 80, 0.1);
        }

        .sim-results-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .sim-result-card {
          padding: 20px;
          background: var(--bg);
          border-radius: 8px;
          border: 1px solid var(--border);
          text-align: center;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        
        .sim-result-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: var(--border);
          transition: background 0.3s;
        }

        .sim-result-card:hover {
          border-color: var(--gold);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }
        
        .sim-result-card:hover::before {
          background: var(--gold);
        }

        .sim-result-label {
          font-size: 0.75rem;
          color: var(--text-dim);
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          font-weight: 700;
        }

        .sim-result-value {
          font-size: 1.8rem;
          font-weight: 900;
          color: var(--text);
          word-break: break-word;
        }

        .sim-result-value.red { color: var(--red); }
        .sim-result-value.green { color: var(--green); }

        .sim-modes-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .sim-mode-btn {
          padding: 12px 16px;
          border: 1px solid var(--border);
          background: var(--bg);
          color: var(--text);
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-align: left;
        }

        .sim-mode-btn:hover {
          border-color: var(--gold);
          background: rgba(240, 200, 80, 0.05);
        }

        .sim-mode-btn.active {
          border-color: var(--gold);
          background: rgba(240, 200, 80, 0.1);
          color: var(--gold);
          box-shadow: inset 3px 0 0 var(--gold);
        }

        .sim-mode-icon {
          font-size: 1.2rem;
          margin-right: 12px;
        }

        .sim-table-container {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--bg-alt);
        }

        .sim-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .sim-table thead {
          background: rgba(0,0,0,0.2);
          border-bottom: 2px solid var(--border);
        }

        .sim-table th {
          padding: 14px 16px;
          text-align: right;
          font-weight: 700;
          color: var(--text-dim);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .sim-table th:first-child { text-align: left; }
        .sim-table th:nth-child(2) { text-align: center; }

        .sim-table tbody tr {
          border-bottom: 1px solid var(--border);
          transition: background 0.15s ease;
        }

        .sim-table tbody tr:hover { background: rgba(240, 200, 80, 0.08); }
        .sim-table tbody tr:nth-child(even) { background: rgba(0,0,0,0.1); }

        .sim-table td {
          padding: 12px 16px;
          text-align: right;
          font-family: 'Monaco', 'Space Mono', 'Courier New', monospace;
        }

        .sim-table td:first-child {
          text-align: left;
          font-family: inherit;
          font-weight: 600;
        }

        .sim-table td:nth-child(2) {
          text-align: center;
          font-family: inherit;
        }

        .sim-info-box {
          padding: 14px 18px;
          background: rgba(240, 200, 80, 0.1);
          border-radius: 6px;
          font-size: 0.9rem;
          margin-bottom: 24px;
          border-left: 4px solid var(--gold);
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .sim-export-btn {
          width: 100%;
          padding: 14px;
          font-size: 1rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: var(--gold);
          color: #000;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        
        .sim-export-btn:hover {
          opacity: 0.9;
        }

        @media (max-width: 1024px) {
          .sim-grid-layout { grid-template-columns: 1fr; }
          .sim-modes-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 768px) {
          .sim-results-grid { grid-template-columns: 1fr; }
          .sim-modes-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h2>🚀 Simulador Profissional</h2>
          <p className="page-desc">
            Análise avançada de cenários de crédito e amortização
          </p>
        </div>
      </div>

      <div style={{ padding: "24px" }}>
        <div className="sim-grid-layout" style={{ marginBottom: "24px" }}>
          {/* LADO ESQUERDO: CONTROLES */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            <div className="sim-section">
              <h3 className="sim-section-title">⚙️ Parâmetros</h3>

              <div className="sim-input-group">
                <label className="sim-input-label">Valor Solicitado (R$)</label>
                <div className="sim-input-wrapper">
                  <span className="sim-input-icon">R$</span>
                  <input
                    type="number"
                    min="100"
                    step="1000"
                    value={form.value}
                    onChange={(e) =>
                      set("value", parseFloat(e.target.value) || 0)
                    }
                    className="sim-input"
                  />
                </div>
              </div>

              <div className="sim-input-group">
                <label className="sim-input-label">
                  Taxa de Juros (% a.m.)
                </label>
                <div className="sim-input-wrapper">
                  <span className="sim-input-icon">%</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.interestRate}
                    onChange={(e) =>
                      set("interestRate", parseFloat(e.target.value) || 0)
                    }
                    className="sim-input"
                  />
                </div>
              </div>

              <div className="sim-input-group">
                <label className="sim-input-label">Prazo (Meses)</label>
                <div className="sim-input-wrapper">
                  <span className="sim-input-icon">📅</span>
                  <input
                    type="number"
                    min="1"
                    max="360"
                    value={form.installments}
                    onChange={(e) =>
                      set("installments", parseInt(e.target.value) || 1)
                    }
                    className="sim-input"
                  />
                </div>
              </div>

              <div className="sim-input-group" style={{ marginBottom: 0 }}>
                <label className="sim-input-label">Data de Início</label>
                <div className="sim-input-wrapper">
                  <span className="sim-input-icon" style={{ left: "10px" }}>
                    🗓️
                  </span>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => set("startDate", e.target.value)}
                    className="sim-input"
                    style={{ paddingLeft: "38px" }}
                  />
                </div>
              </div>
            </div>

            <div className="sim-section">
              <h3 className="sim-section-title">🔄 Sistema de Amortização</h3>
              <div className="sim-modes-grid">
                {INTEREST_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setSelectedMode(mode.value)}
                    className={`sim-mode-btn ${selectedMode === mode.value ? "active" : ""}`}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span className="sim-mode-icon">{mode.icon}</span>
                      <span>{mode.label}</span>
                    </div>
                    {mode.recommended && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          opacity: 0.8,
                          background: "var(--gold)",
                          color: "#000",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        RECOMENDADO
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <button
                onClick={handleExportFullPDF}
                className="sim-export-btn"
                style={{ background: "#f59e0b", marginBottom: 0 }}
              >
                📊 Relatório Completo
              </button>
              <button
                onClick={handleExportClientPDF}
                className="sim-export-btn"
                style={{ background: "#10b981", marginBottom: 0 }}
              >
                👤 Relatório Cliente
              </button>
            </div>
          </div>

          {/* LADO DIREITO: RESULTADOS */}
          <div
            className="sim-section"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <h3 className="sim-section-title">📊 Projeção Financeira</h3>

            <div className="sim-results-grid">
              <div className="sim-result-card">
                <div className="sim-result-label">Parcela Base</div>
                <div className="sim-result-value">
                  {typeof selectedCalculation.installmentValue === "string"
                    ? selectedCalculation.installmentValue
                    : fmt(selectedCalculation.installmentValue)}
                </div>
              </div>

              <div className="sim-result-card">
                <div className="sim-result-label">Custo do Crédito (Juros)</div>
                <div className="sim-result-value red">
                  {fmt(selectedCalculation.totalInterest)}
                </div>
              </div>

              <div className="sim-result-card">
                <div className="sim-result-label">Valor Total Final</div>
                <div className="sim-result-value green">
                  {fmt(selectedCalculation.totalToReceive)}
                </div>
              </div>
            </div>

            <div className="sim-info-box">
              <span style={{ fontSize: "1.2rem" }}>💡</span>
              <div>
                <strong>Custo Efetivo:</strong> A cada R$ 100,00 emprestados, o
                cliente pagará{" "}
                <strong>
                  R${" "}
                  {(
                    (selectedCalculation.totalToReceive / form.value) *
                    100
                  ).toFixed(2)}
                </strong>{" "}
                ao final do contrato.
              </div>
            </div>

            <div className="sim-table-container">
              <table className="sim-table">
                <thead>
                  <tr>
                    <th>Parc</th>
                    <th>Vencimento</th>
                    <th>Valor da Parcela</th>
                    <th>Juros</th>
                    <th>Amortização</th>
                    <th>Saldo Devedor</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCalculation.rows.slice(0, 24).map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.installment}</td>
                      <td>{row.dueDate}</td>
                      <td className="sim-td-amount">{fmt(row.payment)}</td>
                      <td className="sim-td-interest">{fmt(row.interest)}</td>
                      <td className="sim-td-amort">{fmt(row.amortization)}</td>
                      <td className="sim-td-balance">{fmt(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedCalculation.rows.length > 24 && (
              <div
                style={{
                  padding: "10px 14px",
                  textAlign: "center",
                  color: "var(--text-dim)",
                  fontSize: "0.8rem",
                  marginTop: "12px",
                  borderTop: "1px solid var(--border)",
                }}
              >
                📌 Mostrando 24 de {selectedCalculation.rows.length} parcelas (
                {selectedCalculation.rows.length - 24} ocultas)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Simulador;
