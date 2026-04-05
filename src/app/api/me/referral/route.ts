import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { generateUniqueReferralCode } from "@/lib/referrals/code";
import { REFERRAL_TARGET_FREE } from "@/lib/referrals/constants";
import { buildReferralShareUrl } from "@/lib/referrals/share-url";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "No autenticado." } },
      { status: 401 },
    );
  }

  const prisma = getPrisma();
  let user = await prisma.user.findUnique({
    where: { id: uid },
    select: {
      referralCode: true,
      referralCount: true,
      hasFreeEntry: true,
    },
  });
  if (!user) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Usuario no encontrado." } },
      { status: 404 },
    );
  }
  if (!user.referralCode) {
    const code = await generateUniqueReferralCode();
    await prisma.user.update({
      where: { id: uid },
      data: { referralCode: code },
    });
    user = { ...user, referralCode: code };
  }

  const referralCode = user.referralCode as string;
  const count = user.referralCount;
  const target = REFERRAL_TARGET_FREE;
  const remaining = Math.max(0, target - count);

  return NextResponse.json({
    referralCode,
    shareUrl: buildReferralShareUrl(referralCode),
    referralCount: count,
    targetFree: target,
    remainingForFree: remaining,
    hasFreeEntry: user.hasFreeEntry,
    milestones: {
      at3: count >= 3,
      at5: count >= 5,
      at10: count >= target || user.hasFreeEntry,
    },
  });
}
