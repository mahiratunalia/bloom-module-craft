import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { authOptions } from "@/auth";
import { draftAgreementClauses, type AgreementTerms } from "@/lib/agreement.server";

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: authOptions.secret });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const terms = (await request.json()) as AgreementTerms;
  const result = await draftAgreementClauses(terms);
  return NextResponse.json(result);
}
