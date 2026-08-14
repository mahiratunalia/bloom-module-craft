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

export async function sendEmail(payload: EmailPayload) {
  if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("Gmail not configured — skipping email:", payload.subject);
    return;
  }
  await transporter.sendMail({
    from: `"BasaKhuji" <${process.env.GMAIL_EMAIL}>`,
    ...payload,
  });
}

export function agreementDeliveryEmail(to: string, tenantName: string, reference: string) {
  return sendEmail({
    to,
    subject: `Your rental agreement is ready — Ref ${reference}`,
    html: `<p>Hi ${tenantName},</p><p>Your rental agreement (Ref: <strong>${reference}</strong>) has been generated and acknowledged on BasaKhuji. Please log in to download your signed PDF.</p><p>— BasaKhuji</p>`,
  });
}

export function paymentReceiptEmail(to: string, tenantName: string, amount: number, month: string) {
  return sendEmail({
    to,
    subject: `Payment receipt — ৳${amount.toLocaleString("en-BD")} for ${month}`,
    html: `<p>Hi ${tenantName},</p><p>Your rent payment of <strong>৳${amount.toLocaleString("en-BD")}</strong> for <strong>${month}</strong> has been logged on BasaKhuji.</p><p>— BasaKhuji</p>`,
  });
}

export function disputeNotificationEmail(to: string, name: string, disputeId: string) {
  return sendEmail({
    to,
    subject: `Dispute filed — Ref ${disputeId}`,
    html: `<p>Hi ${name},</p><p>A dispute (Ref: <strong>${disputeId}</strong>) has been filed on your tenancy. Log in to BasaKhuji to review the evidence and respond.</p><p>— BasaKhuji</p>`,
  });
}

export function expiryReminderEmail(to: string, tenantName: string, endDate: string) {
  return sendEmail({
    to,
    subject: `Your tenancy expires on ${endDate}`,
    html: `<p>Hi ${tenantName},</p><p>This is a reminder that your tenancy agreement expires on <strong>${endDate}</strong>. Please log in to BasaKhuji to renew or arrange a move-out.</p><p>— BasaKhuji</p>`,
  });
}

export function maintenanceFiledEmail(
  to: string,
  landlordName: string,
  requestTitle: string,
  listingTitle: string,
) {
  return sendEmail({
    to,
    subject: `New maintenance request — ${listingTitle}`,
    html: `<p>Hi ${landlordName},</p><p>A new maintenance request has been filed on <strong>${listingTitle}</strong>: &ldquo;${requestTitle}&rdquo;. Please log in to BasaKhuji to review and respond.</p><p>— BasaKhuji</p>`,
  });
}

export function maintenanceStatusEmail(
  to: string,
  tenantName: string,
  requestTitle: string,
  status: string,
  listingTitle: string,
) {
  const statusLabel = status.replace("_", " ");
  return sendEmail({
    to,
    subject: `Maintenance request update — ${requestTitle}`,
    html: `<p>Hi ${tenantName},</p><p>Your maintenance request &ldquo;${requestTitle}&rdquo; on <strong>${listingTitle}</strong> is now <strong>${statusLabel}</strong>.</p><p>— BasaKhuji</p>`,
  });
}
