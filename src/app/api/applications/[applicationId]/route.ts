import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  status: z.enum(["shortlisted", "accepted", "declined"]),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? "baskhuji-dev-secret",
  });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { applicationId } = await params;
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { listing: true, profile: true },
  });
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const userId = String(token.sub);
  const isTenant = application.profile.userId === userId;
  const isLandlord = application.listing.landlordId === userId;
  if (!isTenant && !isLandlord) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (application.status !== "accepted") {
    return NextResponse.json(
      {
        error:
          "This application hasn't been accepted yet — the agreement unlocks once it's accepted.",
      },
      { status: 409 },
    );
  }

  const landlord = await prisma.user.findUnique({ where: { id: application.listing.landlordId } });

  return NextResponse.json({
    id: application.id,
    tenantName: application.profile.displayName,
    landlordName: landlord?.name ?? "Landlord",
    listing: {
      id: application.listing.id,
      title: application.listing.title,
      roomType: application.listing.roomType,
      area: application.listing.area,
      city: application.listing.city,
      latitude: application.listing.latitude,
      longitude: application.listing.longitude,
      rent: application.listing.rent,
      deposit: application.listing.deposit,
      availableFrom: application.listing.availableFrom.toISOString(),
      landlordId: application.listing.landlordId,
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? "baskhuji-dev-secret",
  });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { applicationId } = await params;
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { listing: true },
  });
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  if (application.listing.landlordId !== String(token.sub)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: { status: parsed.data.status },
  });

  return NextResponse.json(updated);
}
