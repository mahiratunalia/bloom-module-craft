import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";

import { draftAgreementClauses, type AgreementTerms } from "./agreement.server";

export const generateAgreementClauses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: AgreementTerms) => input)
  .handler(async ({ data }) => draftAgreementClauses(data));
