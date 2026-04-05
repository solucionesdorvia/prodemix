import { randomInt } from "node:crypto";

import { getPrisma } from "@/lib/prisma";

export { normalizeReferralCode } from "./normalize";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0,O,1,I confusos
const CODE_LEN = 8;

function randomCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LEN; i += 1) {
    out += ALPHABET[randomInt(0, ALPHABET.length)]!;
  }
  return out;
}

/** Genera y persiste un código único (reintentos ante colisión). */
export async function generateUniqueReferralCode(): Promise<string> {
  const prisma = getPrisma();
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const code = randomCode();
    const clash = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });
    if (!clash) return code;
  }
  throw new Error("Could not allocate referral code.");
}
