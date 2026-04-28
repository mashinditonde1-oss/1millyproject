import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { BusinessDocument, BusinessProfile, Client } from "./types";
import { computeTotals } from "./calc";
import { formatMoney, formatDate } from "./format";
import { isPro } from "./freemium";

const TYPE_LABEL: Record<BusinessDocument["type"], string> = {
  quote: "QUOTATION",
  proforma: "PROFORMA INVOICE",
  invoice: "INVOICE",
  credit_note: "CREDIT NOTE",
};

export function generatePdf(doc: BusinessDocument, profile: BusinessProfile, client: Client): jsPDF {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const W = pdf.internal.pageSize.getWidth();
  const totals = computeTotals(doc);
  const brand = profile.brandColor || "#1e5f3a";

  pdf.setFillColor(brand);
  pdf.rect(0, 0, W, 80, "F");
  pdf.setTextColor("#ffffff");
  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  pdf.text(profile.businessName || "Your Business", 40, 38);
  if (profile.tagline) {
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(profile.tagline, 40, 56);
  }
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text(TYPE_LABEL[doc.type], W - 40, 38, { align: "right" });
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`No: ${doc.number}`, W - 40, 56, { align: "right" });

  pdf.setTextColor("#222");
  let y = 110;
  pdf.setFontSize(9);
  const bizLines = [profile.address, profile.phone, profile.email, profile.vatNumber ? `VAT: ${profile.vatNumber}` : null].filter(Boolean) as string[];
  bizLines.forEach((l) => { pdf.text(l, 40, y); y += 12; });

  let cy = 110;
  pdf.setFont("helvetica", "bold");
  pdf.text("BILL TO", W - 220, cy);
  cy += 14;
  pdf.setFont("helvetica", "normal");
  const cLines = [client.companyName, client.fullName, client.address, client.whatsapp, client.email].filter(Boolean) as string[];
  cLines.forEach((l) => { pdf.text(l, W - 220, cy); cy += 12; });
  y = Math.max(y, cy) + 10;

  pdf.setFont("helvetica", "bold"); pdf.text(`Date: `, 40, y);
  pdf.setFont("helvetica", "normal"); pdf.text(formatDate(doc.date), 80, y);
  if (doc.dueDate) {
    pdf.setFont("helvetica", "bold"); pdf.text(`Due: `, 200, y);
    pdf.setFont("helvetica", "normal"); pdf.text(formatDate(doc.dueDate), 230, y);
  }
  if (doc.expiryDate) {
    pdf.setFont("helvetica", "bold"); pdf.text(`Expires: `, 200, y);
    pdf.setFont("helvetica", "normal"); pdf.text(formatDate(doc.expiryDate), 250, y);
  }
  if (doc.poNumber) {
    pdf.setFont("helvetica", "bold"); pdf.text(`PO: `, 360, y);
    pdf.setFont("helvetica", "normal"); pdf.text(doc.poNumber, 385, y);
  }
  y += 18;

  autoTable(pdf, {
    startY: y,
    head: [["Description", "Qty", "Unit Price", "Total"]],
    body: doc.items.map((i) => [
      i.description,
      String(i.quantity),
      formatMoney(i.unitPrice, doc.currency),
      formatMoney(i.quantity * i.unitPrice, doc.currency),
    ]),
    headStyles: { fillColor: brand, textColor: "#fff" },
    styles: { fontSize: 9, cellPadding: 6 },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
  });

  let ty = (pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 100;
  ty += 14;
  const right = W - 40;
  const rowR = (label: string, val: string, bold = false) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.text(label, right - 160, ty);
    pdf.text(val, right, ty, { align: "right" });
    ty += 14;
  };
  rowR("Subtotal", formatMoney(totals.subtotal, doc.currency));
  if (totals.discount > 0) rowR("Discount", `- ${formatMoney(totals.discount, doc.currency)}`);
  if (doc.vatEnabled) rowR("VAT (15%)", formatMoney(totals.vat, doc.currency));
  rowR("TOTAL", formatMoney(totals.total, doc.currency), true);
  if (totals.deposit > 0) {
    rowR("Deposit Required", formatMoney(totals.deposit, doc.currency));
    rowR("Balance after deposit", formatMoney(totals.total - totals.deposit, doc.currency));
  }
  if (totals.paid > 0) {
    rowR("Paid", formatMoney(totals.paid, doc.currency));
    rowR("Balance", formatMoney(totals.balance, doc.currency), true);
  }

  ty += 10;
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(10);
  pdf.text("PAYMENT DETAILS", 40, ty);
  ty += 14;
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(9);
  const pay: string[] = [];
  if (profile.bankName) pay.push(`Bank: ${profile.bankName}  Acc Name: ${profile.bankAccountName ?? ""}  Acc #: ${profile.bankAccountNumber ?? ""}  Branch: ${profile.bankBranchCode ?? ""}`);
  if (profile.ecocash) pay.push(`EcoCash: ${profile.ecocash}`);
  if (profile.innbucks) pay.push(`InnBucks: ${profile.innbucks}`);
  pay.push(`Use ${doc.number} as payment reference.`);
  pay.forEach((l) => { pdf.text(l, 40, ty); ty += 12; });

  if (doc.notes) {
    ty += 8;
    pdf.setFont("helvetica", "bold"); pdf.text("Notes & Terms", 40, ty); ty += 12;
    pdf.setFont("helvetica", "normal");
    const split = pdf.splitTextToSize(doc.notes, W - 80);
    pdf.text(split, 40, ty);
    ty += split.length * 12;
  }

  if (doc.signature) {
    ty += 10;
    pdf.setFont("helvetica", "bold"); pdf.text("Signed", 40, ty); ty += 8;
    try { pdf.addImage(doc.signature.dataUrl, "PNG", 40, ty, 140, 50); } catch {}
    pdf.setFont("helvetica", "normal");
    pdf.text(`${doc.signature.fullName}`, 200, ty + 24);
    pdf.text(`${formatDate(doc.signature.date)}`, 200, ty + 38);
    ty += 60;
  }

  if (profile.footerMessage) {
    pdf.setFontSize(9); pdf.setTextColor("#666");
    pdf.text(profile.footerMessage, W / 2, pdf.internal.pageSize.getHeight() - 30, { align: "center" });
  }
  if (!isPro(profile)) {
    pdf.setFontSize(8); pdf.setTextColor("#999");
    pdf.text("Made with GetPaid", W / 2, pdf.internal.pageSize.getHeight() - 16, { align: "center" });
  }
  return pdf;
}

export function downloadPdf(doc: BusinessDocument, profile: BusinessProfile, client: Client) {
  generatePdf(doc, profile, client).save(`${doc.number}.pdf`);
}

export function generateReceiptPdf(doc: BusinessDocument, profile: BusinessProfile, client: Client, paymentIndex: number): jsPDF {
  const payment = doc.payments[paymentIndex];
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const W = pdf.internal.pageSize.getWidth();
  const brand = profile.brandColor || "#1e5f3a";
  pdf.setFillColor(brand);
  pdf.rect(0, 0, W, 80, "F");
  pdf.setTextColor("#fff"); pdf.setFontSize(20); pdf.setFont("helvetica", "bold");
  pdf.text(profile.businessName, 40, 38);
  pdf.setFontSize(16); pdf.text("RECEIPT", W - 40, 38, { align: "right" });
  pdf.setTextColor("#222");
  let y = 120; pdf.setFontSize(11);
  pdf.text(`Receipt for invoice ${doc.number}`, 40, y); y += 18;
  pdf.text(`Client: ${client.companyName ?? client.fullName}`, 40, y); y += 14;
  pdf.text(`Date: ${formatDate(payment.date)}`, 40, y); y += 14;
  pdf.text(`Payment method: ${payment.method}`, 40, y); y += 14;
  pdf.text(`Amount received: ${formatMoney(payment.amount, doc.currency)}`, 40, y); y += 14;
  const totals = computeTotals(doc);
  pdf.text(`Total invoice: ${formatMoney(totals.total, doc.currency)}`, 40, y); y += 14;
  pdf.text(`Balance remaining: ${formatMoney(totals.balance, doc.currency)}`, 40, y); y += 14;
  if (payment.isDeposit) { pdf.setFont("helvetica", "bold"); pdf.text("(Deposit payment)", 40, y); }
  if (!isPro(profile)) {
    pdf.setFontSize(8); pdf.setTextColor("#999");
    pdf.text("Made with GetPaid", W / 2, pdf.internal.pageSize.getHeight() - 16, { align: "center" });
  }
  return pdf;
}