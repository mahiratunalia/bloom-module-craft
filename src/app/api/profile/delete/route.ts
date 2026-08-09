import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  type: z.enum(["savedListing", "application", "roommateSession", "agreementDraft"]),
  id: z.string(),
});

export async function DELETE(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? "baskhuji-dev-secret",
  });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: String(token.sub) },
    include: { profile: true },
  });
  if (!user?.profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const profileId = user.profile.id;
  const { type, id } = parsed.data;

  if (type === "savedListing") {
    const item = await prisma.savedListing.findFirst({ where: { id, profileId } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.savedListing.delete({ where: { id } });
  } else if (type === "application") {
    const item = await prisma.application.findFirst({ where: { id, profileId } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.application.delete({ where: { id } });
  } else if (type === "roommateSession") {
    const item = await prisma.roommateSession.findFirst({ where: { id, profileId } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.roommateSession.delete({ where: { id } });
  } else if (type === "agreementDraft") {
    const item = await prisma.agreementDraft.findFirst({ where: { id, profileId } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.agreementDraft.delete({ where: { id } });
  }

  return NextResponse.json({ ok: true });
}
