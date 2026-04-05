import { getPrisma } from "@/lib/prisma";

import { generateUniqueReferralCode } from "./code";

/** Asigna `referralCode` a usuarios que aún no tienen (migraciones / cuentas viejas). */
export async function backfillMissingReferralCodes(): Promise<number> {
  const prisma = getPrisma();
  const users = await prisma.user.findMany({
    where: { OR: [{ referralCode: null }, { referralCode: "" }] },
    select: { id: true },
  });
  let updated = 0;
  for (const u of users) {
    const code = await generateUniqueReferralCode();
    await prisma.user.update({
      where: { id: u.id },
      data: { referralCode: code },
    });
    updated += 1;
  }
  return updated;
}
