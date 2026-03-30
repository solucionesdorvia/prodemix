import type { StoredProde } from "./types";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** 6-char suffix after PMX- (avoids 0/O confusion). */
export function inviteCodeKey(raw: string): string | null {
  const a = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const suffix = (a.startsWith("PMX") ? a.slice(3) : a).slice(0, 6);
  if (suffix.length !== 6) return null;
  return suffix;
}

export function generateInviteCode(existing: Set<string>): string {
  for (let attempt = 0; attempt < 64; attempt++) {
    let s = "PMX-";
    for (let i = 0; i < 6; i++) {
      s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]!;
    }
    if (!existing.has(s)) {
      existing.add(s);
      return s;
    }
  }
  return `PMX-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export function findProdeByInviteCode(
  prodes: StoredProde[],
  raw: string,
): StoredProde | undefined {
  const key = inviteCodeKey(raw);
  if (!key) return undefined;
  return prodes.find((p) => inviteCodeKey(p.inviteCode) === key);
}

export function collectInviteCodes(prodes: StoredProde[]): Set<string> {
  const set = new Set<string>();
  for (const p of prodes) {
    if (p.inviteCode) set.add(p.inviteCode);
  }
  return set;
}
