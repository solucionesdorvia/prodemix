import { cookies } from "next/headers";

import { logStructured } from "@/lib/observability";
import { getPrisma } from "@/lib/prisma";

import { REFERRAL_COOKIE } from "./constants";
import { generateUniqueReferralCode, normalizeReferralCode } from "./code";

import type { Prisma } from "@/generated/prisma/client";

async function bumpReferrerAfterInvite(
  tx: Prisma.TransactionClient,
  referrerId: string,
): Promise<void> {
  const updated = await tx.user.update({
    where: { id: referrerId },
    data: {
      referralCount: { increment: 1 },
    },
    select: { referralCount: true },
  });
  const c = updated.referralCount;
  if (c >= 10) {
    await tx.user.update({
      where: { id: referrerId },
      data: { hasFreeEntry: true },
    });
  }
}

export type PendingReferralResult = {
  code: string | null;
};

/**
 * Lee cookie o string explícito; prioriza cookie del servidor.
 */
export async function getPendingReferralCode(
  explicit?: string | null,
): Promise<PendingReferralResult> {
  const fromExplicit = normalizeReferralCode(explicit ?? undefined);
  const cookieStore = await cookies();
  const fromCookie = normalizeReferralCode(
    cookieStore.get(REFERRAL_COOKIE)?.value,
  );
  const code = fromCookie ?? fromExplicit ?? null;
  return { code };
}

/**
 * Registro email/contraseña: crea usuario + código + opcional referral en una transacción.
 */
export async function createUserWithReferral(args: {
  email: string;
  passwordHash: string;
  name: string;
  /** Desde body JSON (opcional) si la cookie no llegó. */
  referralFromBody?: string | null;
}): Promise<{ userId: string }> {
  const prisma = getPrisma();
  const { code: pending } = await getPendingReferralCode(args.referralFromBody);

  const referralCode = await generateUniqueReferralCode();

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: args.email,
        passwordHash: args.passwordHash,
        name: args.name,
        referralCode,
      },
    });

    if (pending) {
      await attachReferralIfValid(tx, {
        newUserId: user.id,
        pendingCode: pending,
      });
    }

    return { userId: user.id };
  });
}

/**
 * OAuth u otros flujos donde el usuario ya existe (User recién creado por el adapter).
 */
export async function finalizeNewUserReferral(userId: string): Promise<void> {
  const prisma = getPrisma();
  const { code: pending } = await getPendingReferralCode();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      referralCode: true,
      referredById: true,
    },
  });
  if (!user) return;

  await prisma.$transaction(async (tx) => {
    if (!user.referralCode) {
      await tx.user.update({
        where: { id: userId },
        data: { referralCode: await generateUniqueReferralCode() },
      });
    }

    if (user.referredById) return;

    if (pending) {
      await attachReferralIfValid(tx, {
        newUserId: userId,
        pendingCode: pending,
      });
    }
  });
}

async function attachReferralIfValid(
  tx: Prisma.TransactionClient,
  args: { newUserId: string; pendingCode: string },
): Promise<void> {
  const pending = normalizeReferralCode(args.pendingCode);
  if (!pending) return;

  const referrer = await tx.user.findUnique({
    where: { referralCode: pending },
    select: { id: true, bannedAt: true },
  });
  if (!referrer || referrer.bannedAt) {
    logStructured("referral.skipped", {
      reason: "invalid_or_banned_referrer",
      newUserId: args.newUserId,
    });
    return;
  }
  if (referrer.id === args.newUserId) {
    logStructured("referral.skipped", { reason: "self", userId: args.newUserId });
    return;
  }

  const dup = await tx.referral.findUnique({
    where: { referredUserId: args.newUserId },
    select: { id: true },
  });
  if (dup) return;

  await tx.referral.create({
    data: {
      referrerUserId: referrer.id,
      referredUserId: args.newUserId,
    },
  });

  await tx.user.update({
    where: { id: args.newUserId },
    data: { referredById: referrer.id },
  });

  await bumpReferrerAfterInvite(tx, referrer.id);

  logStructured("referral.recorded", {
    referrerId: referrer.id,
    referredUserId: args.newUserId,
  });
}
