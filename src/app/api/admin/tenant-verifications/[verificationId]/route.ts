import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  status: z.enum(["verified", "rejected"]),
  reviewNote: z.string().max(500).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ verificationId: string }> },
) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? "baskhuji-dev-secret",
  });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (token.role !== "ADMIN")
    return NextResponse.json({ error: "Admin accounts only" }, { status: 403 });

  const { verificationId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const existing = await prisma.tenantVerification.findUnique({ where: { id: verificationId } });
  if (!existing) return NextResponse.json({ error: "Verification not found" }, { status: 404 });

  const updated = await prisma.tenantVerification.update({
    where: { id: verificationId },
    data: {
      status: parsed.data.status,
      reviewNote: parsed.data.reviewNote,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
