import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentReceiptEmail } from "@/lib/gmail.server";

export async function POST(request: Request) {
  const body = await request.formData().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const status = body.get("status") as string;
  const transactionId = body.get("tran_id") as string;
  const validationId = body.get("val_id") as string;

  if (!transactionId) return NextResponse.json({ error: "Missing tran_id" }, { status: 400 });

  const payment = await prisma.payment.findUnique({ where: { transactionId } });
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  if (status === "VALID" || status === "VALIDATED") {
    await prisma.payment.update({
      where: { transactionId },
      data: { status: "paid", validationId },
    });

    // Send receipt email
    const profile = await prisma.profile.findUnique({
      where: { id: payment.profileId },
      include: { user: true },
    });
    if (profile?.user.email) {
      await paymentReceiptEmail(
        profile.user.email,
        profile.displayName,
        payment.amount,
        payment.month,
      );
    }
  } else {
    await prisma.payment.update({
      where: { transactionId },
      data: { status: "failed" },
    });
  }

  return NextResponse.json({ received: true });
}

// SSLCOMMERZ also hits IPN via GET redirect for success/fail/cancel
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  if (status === "success")
    return NextResponse.redirect(new URL("/profile?payment=success", request.url));
  if (status === "fail")
    return NextResponse.redirect(new URL("/profile?payment=failed", request.url));
  return NextResponse.redirect(new URL("/profile?payment=cancelled", request.url));
}
