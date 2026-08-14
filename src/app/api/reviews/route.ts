import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  applicationId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? "baskhuji-dev-secret",
  });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const applicationId = request.nextUrl.searchParams.get("applicationId");
  if (!applicationId) {
    return NextResponse.json({ error: "applicationId is required" }, { status: 400 });
  }

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

  const reviews = await prisma.review.findMany({
    where: { applicationId },
    include: { raterProfile: { select: { displayName: true } } },
  });

  return NextResponse.json(
    reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      raterIsTenant: r.raterProfileId === application.profileId,
      raterName: r.raterProfile.displayName,
    })),
  );
}

export async function POST(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? "baskhuji-dev-secret",
  });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid review" }, { status: 400 });

  const application = await prisma.application.findUnique({
    where: { id: parsed.data.applicationId },
    include: { listing: true, profile: true },
  });
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const userId = String(token.sub);
  const isTenant = application.profile.userId === userId;
  const isLandlord = application.listing.landlordId === userId;
  if (!isTenant && !isLandlord) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (application.status !== "completed") {
    return NextResponse.json(
      { error: "Reviews unlock once this tenancy has ended." },
      { status: 409 },
    );
  }

  const raterProfileId = isTenant
    ? application.profileId
    : (await prisma.profile.findUnique({ where: { userId } }))?.id;
  if (!raterProfileId) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  try {
    const review = await prisma.review.create({
      data: {
        applicationId: application.id,
        raterProfileId,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      },
    });
    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "You've already reviewed this tenancy." }, { status: 409 });
    }
    throw err;
  }
}
