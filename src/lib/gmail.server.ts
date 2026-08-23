import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

// Every value interpolated into an email template below is user-controlled
// (display names, comments, message bodies, admin resolution text) — escape
// unconditionally rather than trust any of it not to contain markup.
function escapeHtml(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendEmail(payload: EmailPayload) {
  if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("Gmail not configured — skipping email:", payload.subject);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"BasaKhuji" <${process.env.GMAIL_EMAIL}>`,
      ...payload,
    });
  } catch (error) {
    console.error("sendEmail failed:", payload.subject, error);
  }
}

export function agreementDeliveryEmail(to: string, tenantName: string, reference: string) {
  const name = escapeHtml(tenantName);
  const ref = escapeHtml(reference);
  return sendEmail({
    to,
    subject: `Your rental agreement is ready — Ref ${reference}`,
    html: `<p>Hi ${name},</p><p>Your rental agreement (Ref: <strong>${ref}</strong>) has been generated and acknowledged on BasaKhuji. Please log in to download your signed PDF.</p><p>— BasaKhuji</p>`,
  });
}

export function paymentReceiptEmail(to: string, tenantName: string, amount: number, month: string) {
  const name = escapeHtml(tenantName);
  const monthEsc = escapeHtml(month);
  return sendEmail({
    to,
    subject: `Payment receipt — ৳${amount.toLocaleString("en-BD")} for ${month}`,
    html: `<p>Hi ${name},</p><p>Your rent payment of <strong>৳${amount.toLocaleString("en-BD")}</strong> for <strong>${monthEsc}</strong> has been logged on BasaKhuji.</p><p>— BasaKhuji</p>`,
  });
}

export function paymentConfirmationEmailForLandlord(
  to: string,
  landlordName: string,
  tenantName: string,
  amount: number,
  month: string,
) {
  const landlord = escapeHtml(landlordName);
  const tenant = escapeHtml(tenantName);
  const monthEsc = escapeHtml(month);
  return sendEmail({
    to,
    subject: `Rent received — ৳${amount.toLocaleString("en-BD")} from ${tenantName} for ${month}`,
    html: `<p>Hi ${landlord},</p><p><strong>${tenant}</strong> has paid <strong>৳${amount.toLocaleString("en-BD")}</strong> in rent for <strong>${monthEsc}</strong>. This payment has been logged on BasaKhuji and added to the tenancy's activity timeline.</p><p>— BasaKhuji</p>`,
  });
}

export function disputeNotificationEmail(to: string, name: string, disputeId: string) {
  const nameEsc = escapeHtml(name);
  const id = escapeHtml(disputeId);
  return sendEmail({
    to,
    subject: `Dispute filed — Ref ${disputeId}`,
    html: `<p>Hi ${nameEsc},</p><p>A dispute (Ref: <strong>${id}</strong>) has been filed on your tenancy. Log in to BasaKhuji to review the evidence and respond.</p><p>— BasaKhuji</p>`,
  });
}

export function disputeFiledConfirmationEmail(to: string, name: string, disputeId: string) {
  const nameEsc = escapeHtml(name);
  const id = escapeHtml(disputeId);
  return sendEmail({
    to,
    subject: `Your dispute has been filed — Ref ${disputeId}`,
    html: `<p>Hi ${nameEsc},</p><p>Your dispute (Ref: <strong>${id}</strong>) has been filed on BasaKhuji. We've bundled the agreement, payment history, and maintenance timeline for this tenancy for admin review. You'll be notified by email once it's resolved.</p><p>— BasaKhuji</p>`,
  });
}

export function disputeResolvedEmail(
  to: string,
  name: string,
  disputeId: string,
  resolution: string,
) {
  const nameEsc = escapeHtml(name);
  const id = escapeHtml(disputeId);
  const resolutionEsc = escapeHtml(resolution);
  return sendEmail({
    to,
    subject: `Dispute resolved — Ref ${disputeId}`,
    html: `<p>Hi ${nameEsc},</p><p>An admin has issued a resolution for dispute Ref <strong>${id}</strong>:</p><blockquote style="border-left:2px solid #ccc;margin:8px 0;padding-left:12px;">${resolutionEsc}</blockquote><p>Log in to BasaKhuji to view the full evidence record.</p><p>— BasaKhuji</p>`,
  });
}

export function expiryReminderEmail(to: string, tenantName: string, endDate: string) {
  const name = escapeHtml(tenantName);
  const date = escapeHtml(endDate);
  return sendEmail({
    to,
    subject: `Your tenancy expires on ${endDate}`,
    html: `<p>Hi ${name},</p><p>This is a reminder that your tenancy agreement expires on <strong>${date}</strong>. Please log in to BasaKhuji to renew or arrange a move-out.</p><p>— BasaKhuji</p>`,
  });
}

export function maintenanceFiledEmail(
  to: string,
  landlordName: string,
  requestTitle: string,
  listingTitle: string,
) {
  const landlord = escapeHtml(landlordName);
  const title = escapeHtml(requestTitle);
  const listing = escapeHtml(listingTitle);
  return sendEmail({
    to,
    subject: `New maintenance request — ${listingTitle}`,
    html: `<p>Hi ${landlord},</p><p>A new maintenance request has been filed on <strong>${listing}</strong>: &ldquo;${title}&rdquo;. Please log in to BasaKhuji to review and respond.</p><p>— BasaKhuji</p>`,
  });
}

export function maintenanceStatusEmail(
  to: string,
  tenantName: string,
  requestTitle: string,
  status: string,
  listingTitle: string,
) {
  const name = escapeHtml(tenantName);
  const title = escapeHtml(requestTitle);
  const listing = escapeHtml(listingTitle);
  const statusLabel = escapeHtml(status.replace("_", " "));
  return sendEmail({
    to,
    subject: `Maintenance request update — ${requestTitle}`,
    html: `<p>Hi ${name},</p><p>Your maintenance request &ldquo;${title}&rdquo; on <strong>${listing}</strong> is now <strong>${statusLabel}</strong>.</p><p>— BasaKhuji</p>`,
  });
}

export function newMessageEmail(
  to: string,
  name: string,
  senderName: string,
  listingTitle: string,
) {
  const nameEsc = escapeHtml(name);
  const sender = escapeHtml(senderName);
  const listing = escapeHtml(listingTitle);
  return sendEmail({
    to,
    subject: `New message — ${listingTitle}`,
    html: `<p>Hi ${nameEsc},</p><p><strong>${sender}</strong> sent you a new message on BasaKhuji about <strong>${listing}</strong>. Log in to read and reply.</p><p>— BasaKhuji</p>`,
  });
}
