import { jsPDF } from "jspdf";

import type { AgreementClause } from "./agreement.server";

export type PdfAgreement = {
  reference: string;
  generatedOn: string;
  landlordName: string;
  tenantName: string;
  propertyLine: string;
  rentLine: string;
  termLine: string;
  clauses: AgreementClause[];
  tenantSigned: boolean;
  landlordSigned: boolean;
};

const MARGIN = 56;
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - MARGIN * 2;

export function downloadAgreementPdf(a: PdfAgreement) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = MARGIN;

  const newPageIfNeeded = (needed: number) => {
    if (y + needed > PAGE_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.text("Residential Rental Agreement", MARGIN, y);
  y += 20;

  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(`BasaKhuji · Ref ${a.reference} · generated ${a.generatedOn}`, MARGIN, y);
  y += 18;
  doc.setDrawColor(160);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 22;

  doc.setTextColor(20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const line of [
    `Landlord: ${a.landlordName}`,
    `Tenant: ${a.tenantName}`,
    `Property: ${a.propertyLine}`,
    a.rentLine,
    a.termLine,
  ]) {
    const wrapped = doc.splitTextToSize(line, CONTENT_W) as string[];
    newPageIfNeeded(wrapped.length * 13);
    doc.text(wrapped, MARGIN, y);
    y += wrapped.length * 13 + 2;
  }

  y += 14;

  a.clauses.forEach((clause, i) => {
    const heading = `${String(i + 1).padStart(2, "0")} · ${clause.title.toUpperCase()}`;
    const body = doc.splitTextToSize(clause.body, CONTENT_W) as string[];
    newPageIfNeeded(body.length * 14 + 34);
    doc.setFont("courier", "bold");
    doc.setFontSize(9);
    doc.setTextColor(90);
    doc.text(heading, MARGIN, y);
    y += 14;
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.setTextColor(20);
    doc.text(body, MARGIN, y);
    y += body.length * 14 + 16;
  });

  newPageIfNeeded(110);
  y += 10;
  doc.setDrawColor(160);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 26;

  const half = CONTENT_W / 2;
  const signature = (label: string, name: string, signed: boolean, x: number) => {
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(110);
    doc.text(label.toUpperCase(), x, y);
    doc.setFont("times", signed ? "italic" : "normal");
    doc.setFontSize(signed ? 15 : 11);
    doc.setTextColor(signed ? 20 : 150);
    doc.text(signed ? name : "Not yet acknowledged", x, y + 22);
    doc.setDrawColor(180);
    doc.line(x, y + 30, x + half - 24, y + 30);
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(110);
    doc.text(signed ? `Acknowledged ${a.generatedOn}` : "Pending", x, y + 42);
  };
  signature("Tenant", a.tenantName, a.tenantSigned, MARGIN);
  signature("Landlord", a.landlordName, a.landlordSigned, MARGIN + half);

  doc.save(`BasaKhuji-agreement-${a.reference.replace(/\//g, "-")}.pdf`);
}
