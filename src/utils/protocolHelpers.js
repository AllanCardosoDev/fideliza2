import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { fmt, buildAmortizationTable, calcPMT } from "./helpers";

/**
 * Helper to convert YYYY-MM-DD to DD/MM/YYYY
 */
const formatDateToDDMMYYYY = (dateStr) => {
  if (!dateStr || dateStr === "—") return dateStr;
  // Parse string no formato YYYY-MM-DD: "2026-05-04"
  // Retorn DD/MM/YYYY: "04/05/2026"
  const parts = String(dateStr).split("-");
  if (parts.length === 3) {
    const day = parts[2]; // 04
    const month = parts[1]; // 05
    const year = parts[0]; // 2026
    return day + "/" + month + "/" + year;
  }
  return dateStr;
};

/**
 * Generates a contract protocol number in format DD.MM/NNNN/YYYY
 * Example: 07.01/0023/2026 (January 7, 23rd contract of 2026)
 */
export const generateContractProtocol = (sequenceNumber, date = new Date()) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  const seq = String(sequenceNumber).padStart(4, "0");
  return `${day}.${month}/${seq}/${year}`;
};

/**
 * Gets the next contract number for today (or a specific date)
 * Counts existing contracts with same date prefix
 */
export const getNextContractNumber = (loans = [], date = new Date()) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  const prefix = `${day}.${month}/`; // e.g., "07.01/"

  // Count protocols that start with today's date
  const todaysProtocols = loans.filter((loan) => {
    if (!loan.protocol) return false;
    return loan.protocol.startsWith(prefix);
  });

  return todaysProtocols.length + 1;
};

/**
 * Generates a professional PDF for a loan contract
 */
export const generateLoanPDF = (loan, client) => {
  if (!loan || !client) {
    console.error("Loan and client data required for PDF generation");
    return;
  }

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
  doc.text("🏦 FidelizaCred", margin + 5, 18);
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text("Sistema de Gestão de Empréstimos", margin + 5, 25);

  // Protocol highlight
  let yPos = 40;
  doc.setFillColor(220, 252, 231); // Light green background
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 15, "F");
  doc.setTextColor(22, 163, 74);
  doc.setFont(undefined, "bold");
  doc.setFontSize(14);
  doc.text(`Protocolo: ${loan.protocol || "N/A"}`, pageWidth / 2, yPos + 3, {
    align: "center",
  });

  yPos += 20;

  // ════ Two-column layout: Client Info & Loan Details ════
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");

  // Left column: Client Info
  doc.text("DADOS DO CLIENTE", margin, yPos);
  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  yPos += 8;

  doc.text(`Nome: ${client.name || "—"}`, margin, yPos);
  yPos += 6;
  doc.text(`CPF: ${client.cpf || "—"}`, margin, yPos);
  yPos += 6;
  doc.text(`Telefone: ${client.phone || "—"}`, margin, yPos);
  yPos += 6;
  doc.text(`E-mail: ${client.email || "—"}`, margin, yPos);

  // Right column: Loan Details
  const rightCol = margin + 100;
  doc.setFont(undefined, "bold");
  doc.setFontSize(11);
  doc.text("DETALHES DO EMPRÉSTIMO", rightCol, yPos - 20);
  doc.setFont(undefined, "normal");
  doc.setFontSize(10);

  const loanValue = Number(loan.value) || 0;
  const rate = Number(loan.interest_rate) || 0;
  const installments = Number(loan.installments) || 1;
  const pmt = calcPMT(loanValue, rate / 100, installments);

  doc.text(`Valor: ${fmt(loanValue)}`, rightCol, yPos - 14);
  doc.text(`Taxa (a.m.): ${rate.toFixed(2)}%`, rightCol, yPos - 8);
  doc.text(`Parcelas: ${installments}`, rightCol, yPos - 2);

  yPos += 15;

  // ════ Summary box ════
  doc.setFillColor(243, 244, 246);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 18, "F");
  doc.setFont(undefined, "bold");
  doc.setFontSize(11);
  doc.setTextColor(22, 163, 74);

  const totalReceived = loanValue;
  const totalToPay = pmt * installments;

  doc.text(`Valor a Receber: ${fmt(totalReceived)}`, margin + 5, yPos + 6);
  doc.text(`Valor de Cada Parcela: ${fmt(pmt)}`, pageWidth / 2, yPos + 6);

  // Note about hidden total
  doc.setFontSize(8);
  doc.setFont(undefined, "italic");
  doc.setTextColor(100, 116, 139);
  doc.text(
    "* Valor total a pagar não incluído neste documento",
    margin + 5,
    yPos + 14,
  );

  yPos += 25;

  // ════ Payment Schedule ════
  doc.setFont(undefined, "bold");
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text("CRONOGRAMA DE PAGAMENTO", margin, yPos);
  yPos += 8;

  // Build amortization table for first 10 installments
  const amortization = buildAmortizationTable(
    loanValue,
    rate / 100,
    installments,
    loan.start_date || new Date().toISOString().split("T")[0],
  );
  const scheduleRows = amortization
    .slice(0, 10)
    .map((row) => [
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

  // If more than 10 installments, show note
  if (installments > 10) {
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`... e mais ${installments - 10} parcelas`, margin, yPos);
    yPos += 8;
  }

  // ════ Signature lines ════
  yPos = pageHeight - 35;
  doc.setDrawColor(51, 65, 85);
  doc.setFont(undefined, "normal");
  doc.setFontSize(10);

  // Client line
  doc.line(margin, yPos, margin + 40, yPos);
  doc.text("Assinatura do Cliente", margin, yPos + 5);
  doc.text(client.name || "—", margin, yPos + 10);

  // Company line
  const companyX = pageWidth - margin - 50;
  doc.line(companyX, yPos, companyX + 40, yPos);
  doc.text("Assinatura - FidelizaCred", companyX - 10, yPos + 5);
  doc.text("Responsável", companyX, yPos + 10);

  // ════ Footer ════
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `FidelizaCred © 2026 | Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
    pageWidth / 2,
    pageHeight - 5,
    { align: "center" },
  );

  // Save PDF
  const filename = `contrato_${loan.protocol || loan.id}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
};

export default {
  generateContractProtocol,
  getNextContractNumber,
  generateLoanPDF,
};
