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
    interestRate: 3.18,
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

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 25, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("💰 Simulador de Empréstimo", 10, 16);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    let yPos = 35;

    doc.text(`Modo: ${selectedCalculation.name}`, 10, yPos);
    yPos += 6;
    doc.text(
      `Valor: ${fmt(form.value)} | Taxa: ${form.interestRate.toFixed(2)}% a.m. | Parcelas: ${form.installments}`,
      10,
      yPos,
    );
    yPos += 10;

    doc.setFillColor(240, 250, 245);
    doc.rect(10, yPos, pageWidth - 20, 25, "F");
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(
      `Total de Juros: ${fmt(selectedCalculation.totalInterest)}`,
      12,
      yPos + 8,
    );
    doc.text(
      `Total a Receber: ${fmt(selectedCalculation.totalToReceive)}`,
      12,
      yPos + 16,
    );

    yPos += 30;

    const tableColumn = [
      "Parcela",
      "Vencimento",
      "Parcela",
      "Juros",
      "Amortização",
      "Saldo",
    ];
    const tableRows = selectedCalculation.rows.map((row) => [
      row.installment,
      row.dueDate,
      fmt(row.payment),
      fmt(row.interest),
      fmt(row.amortization),
      fmt(row.balance),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: yPos,
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    });

    doc.save(
      `simulador-${selectedMode}-${new Date().toISOString().split("T")[0]}.pdf`,
    );
  };

  return (
    <div className="page active">
      <style>{`
        .sim-param-row {
          display: grid;
          grid-template-columns: 1fr 130px;
          gap: 12px;
          align-items: flex-end;
          padding: 14px;
          background: var(--bg-alt);
          border-radius: 6px;
          margin-bottom: 14px;
          border: 1px solid var(--border);
        }

        .sim-param-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sim-param-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sim-range {
          appearance: none;
          -webkit-appearance: none;
          width: 100%;
          height: 5px;
          background: var(--border);
          outline: none;
          border-radius: 3px;
          cursor: pointer;
        }

        .sim-range::-webkit-slider-thumb {
          appearance: none;
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: var(--gold);
          cursor: pointer;
          border-radius: 50%;
          border: 2px solid #0f172a;
          box-shadow: 0 2px 6px rgba(240, 200, 80, 0.3);
          transition: all 0.2s ease;
        }

        .sim-range::-webkit-slider-thumb:hover {
          box-shadow: 0 4px 12px rgba(240, 200, 80, 0.5);
          transform: scale(1.1);
        }

        .sim-range::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: var(--gold);
          cursor: pointer;
          border-radius: 50%;
          border: 2px solid #0f172a;
          box-shadow: 0 2px 6px rgba(240, 200, 80, 0.3);
          transition: all 0.2s ease;
        }

        .sim-number-input {
          padding: 7px 9px;
          border: 1px solid var(--border);
          background: var(--bg);
          color: var(--text);
          border-radius: 5px;
          font-size: 0.9rem;
          font-weight: 600;
          text-align: center;
          transition: all 0.2s ease;
        }

        .sim-number-input:focus {
          outline: none;
          border-color: var(--gold);
          box-shadow: 0 0 0 2px rgba(240, 200, 80, 0.1);
        }

        .sim-results-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 18px;
        }

        .sim-result-card {
          padding: 16px;
          background: var(--bg-alt);
          border-radius: 6px;
          border: 1px solid var(--border);
          text-align: center;
          transition: all 0.2s ease;
        }

        .sim-result-card:hover {
          border-color: var(--gold);
          box-shadow: 0 4px 12px rgba(240, 200, 80, 0.15);
          transform: translateY(-2px);
        }

        .sim-result-label {
          font-size: 0.75rem;
          color: var(--text-dim);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          font-weight: 600;
        }

        .sim-result-value {
          font-size: 1.65rem;
          font-weight: 900;
          color: var(--gold);
          word-break: break-word;
        }

        .sim-result-value.red {
          color: var(--red);
        }

        .sim-result-value.green {
          color: var(--green);
        }

        .sim-modes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(95px, 1fr));
          gap: 8px;
          margin-bottom: 18px;
        }

        .sim-mode-btn {
          padding: 11px;
          border: 2px solid var(--border);
          background: var(--bg-alt);
          color: var(--text);
          border-radius: 5px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          text-align: center;
        }

        .sim-mode-btn:hover {
          border-color: var(--gold);
          background: rgba(240, 200, 80, 0.08);
        }

        .sim-mode-btn.active {
          border-color: var(--gold);
          background: rgba(240, 200, 80, 0.15);
          color: var(--gold);
        }

        .sim-mode-icon {
          font-size: 1.2rem;
        }

        .sim-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8rem;
          margin: 0 -16px;
        }

        .sim-table thead {
          background: rgba(240, 200, 80, 0.09);
          border-bottom: 1px solid var(--border);
        }

        .sim-table th {
          padding: 10px;
          text-align: right;
          font-weight: 700;
          color: var(--text);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .sim-table th:first-child {
          text-align: left;
          padding-left: 26px;
        }

        .sim-table th:nth-child(2) {
          text-align: center;
          padding-left: 26px;
        }

        .sim-table tbody tr {
          border-bottom: 1px solid var(--border);
          transition: background 0.15s ease;
        }

        .sim-table tbody tr:hover {
          background: rgba(240, 200, 80, 0.04);
        }

        .sim-table tbody tr:nth-child(even) {
          background: rgba(240, 200, 80, 0.015);
        }

        .sim-table td {
          padding: 9px 10px;
          text-align: right;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.78rem;
        }

        .sim-table td:first-child {
          text-align: left;
          padding-left: 26px;
          font-family: inherit;
          font-weight: 500;
        }

        .sim-table td:nth-child(2) {
          text-align: center;
          padding-left: 26px;
          font-family: inherit;
        }

        .sim-td-amount {
          color: var(--text);
          font-weight: 600;
        }

        .sim-td-interest {
          color: var(--red);
        }

        .sim-td-amort {
          color: var(--blue);
        }

        .sim-td-balance {
          color: var(--text);
          font-weight: 600;
        }

        .sim-date-input {
          padding: 7px 9px;
          border: 1px solid var(--border);
          background: var(--bg);
          color: var(--text);
          border-radius: 5px;
          font-size: 0.9rem;
          width: 100%;
          transition: all 0.2s ease;
        }

        .sim-date-input:focus {
          outline: none;
          border-color: var(--gold);
          box-shadow: 0 0 0 2px rgba(240, 200, 80, 0.1);
        }

        .sim-info-box {
          padding: 11px 14px;
          background: rgba(240, 200, 80, 0.08);
          border-radius: 5px;
          text-align: center;
          font-size: 0.85rem;
          margin-bottom: 14px;
          border-left: 3px solid var(--gold);
        }

        @media (max-width: 1024px) {
          .sim-results-grid {
            grid-template-columns: 1fr;
          }

          .sim-modes-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .sim-param-row {
            grid-template-columns: 1fr;
          }

          .sim-table {
            font-size: 0.7rem;
          }

          .sim-table td,
          .sim-table th {
            padding: 6px 4px;
          }

          .sim-table td:first-child,
          .sim-table th:first-child {
            padding-left: 12px;
          }

          .sim-modes-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h2>💰 Simulador de Empréstimo</h2>
          <p className="page-desc">
            Simule diferentes cenários e compare resultados de juros
          </p>
        </div>
      </div>

      <div style={{ padding: "24px" }}>
        {/* SEÇÃO 1: PARÂMETROS */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <h3
            style={{
              marginTop: 0,
              marginBottom: "16px",
              fontSize: "1.1rem",
              fontWeight: 700,
            }}
          >
            ⚙️ Parâmetros de Cálculo
          </h3>

          {/* Valor */}
          <div className="sim-param-row">
            <div className="sim-param-wrapper">
              <label className="sim-param-label">💵 Valor (R$)</label>
              <input
                type="range"
                min="100"
                max="1000000"
                value={form.value}
                onChange={(e) => set("value", parseFloat(e.target.value))}
                className="sim-range"
              />
            </div>
            <input
              type="number"
              min="100"
              step="1000"
              value={form.value}
              onChange={(e) => set("value", parseFloat(e.target.value) || 100)}
              className="sim-number-input"
            />
          </div>

          {/* Taxa */}
          <div className="sim-param-row">
            <div className="sim-param-wrapper">
              <label className="sim-param-label">📊 Taxa (% a.m.)</label>
              <input
                type="range"
                min="0"
                max="20"
                step="0.01"
                value={form.interestRate}
                onChange={(e) =>
                  set("interestRate", parseFloat(e.target.value))
                }
                className="sim-range"
              />
            </div>
            <input
              type="number"
              min="0"
              max="20"
              step="0.01"
              value={form.interestRate}
              onChange={(e) =>
                set("interestRate", parseFloat(e.target.value) || 0)
              }
              className="sim-number-input"
            />
          </div>

          {/* Parcelas */}
          <div className="sim-param-row">
            <div className="sim-param-wrapper">
              <label className="sim-param-label">📅 Parcelas</label>
              <input
                type="range"
                min="1"
                max="120"
                value={form.installments}
                onChange={(e) => set("installments", parseInt(e.target.value))}
                className="sim-range"
              />
            </div>
            <input
              type="number"
              min="1"
              max="120"
              value={form.installments}
              onChange={(e) =>
                set("installments", parseInt(e.target.value) || 1)
              }
              className="sim-number-input"
            />
          </div>

          {/* Data */}
          <div
            style={{
              padding: "14px",
              background: "var(--bg-alt)",
              borderRadius: "6px",
              border: "1px solid var(--border)",
            }}
          >
            <label className="sim-param-label">🗓️ Data de Início</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              className="sim-date-input"
            />
          </div>
        </div>

        {/* SEÇÃO 2: RESULTADOS */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <h3
            style={{
              marginTop: 0,
              marginBottom: "16px",
              fontSize: "1.1rem",
              fontWeight: 700,
            }}
          >
            📈 Resultados
          </h3>

          <div className="sim-results-grid">
            <div className="sim-result-card">
              <div className="sim-result-label">Valor da Parcela</div>
              <div className="sim-result-value">
                {typeof selectedCalculation.installmentValue === "string"
                  ? selectedCalculation.installmentValue
                  : fmt(selectedCalculation.installmentValue)}
              </div>
            </div>

            <div className="sim-result-card">
              <div className="sim-result-label">Total de Juros</div>
              <div className="sim-result-value red">
                {fmt(selectedCalculation.totalInterest)}
              </div>
            </div>

            <div className="sim-result-card">
              <div className="sim-result-label">Total a Receber</div>
              <div className="sim-result-value green">
                {fmt(selectedCalculation.totalToReceive)}
              </div>
            </div>
          </div>

          <div className="sim-info-box">
            <strong>Taxa Efetiva:</strong>{" "}
            {(
              (selectedCalculation.totalInterest /
                selectedCalculation.totalToReceive) *
              100
            ).toFixed(2)}
            % do valor total recebido
          </div>

          <button
            onClick={handleExportPDF}
            className="btn btn-gold"
            style={{ width: "100%", padding: "10px 16px", fontSize: "0.95rem" }}
          >
            📥 Exportar Simulação em PDF
          </button>
        </div>

        {/* SEÇÃO 3: MODO DE CÁLCULO */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <h3
            style={{
              marginTop: 0,
              marginBottom: "14px",
              fontSize: "1.1rem",
              fontWeight: 700,
            }}
          >
            🔄 Modo de Cálculo de Juros
          </h3>

          <div className="sim-modes-grid">
            {INTEREST_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setSelectedMode(mode.value)}
                className={`sim-mode-btn ${selectedMode === mode.value ? "active" : ""}`}
                title={mode.label}
              >
                <span className="sim-mode-icon">{mode.icon}</span>
                <span>{mode.label}</span>
                {mode.recommended && (
                  <span style={{ fontSize: "0.65rem", opacity: 0.7 }}>⭐</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* SEÇÃO 4: TABELA */}
        <div className="card">
          <h3
            style={{
              marginTop: 0,
              marginBottom: "14px",
              fontSize: "1.1rem",
              fontWeight: 700,
            }}
          >
            📊 Tabela de Amortização
          </h3>

          <div
            style={{
              overflowX: "auto",
              borderRadius: "6px",
              border: "1px solid var(--border)",
            }}
          >
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
  );
}

export default Simulador;
