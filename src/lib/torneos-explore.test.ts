import { describe, expect, it } from "vitest";

import { isPoolPaid } from "./torneos-explore";
import type { PublicPool } from "@/domain";

function pool(partial: Partial<PublicPool>): PublicPool {
  return {
    id: "p",
    tournamentId: "t",
    matchdayId: "m",
    type: "public_free",
    entryFeeArs: 0,
    prizePoolArs: 0,
    payoutTopN: 3,
    payoutPercents: [50, 30, 20],
    participantsCount: 0,
    status: "open",
    closesAt: new Date().toISOString(),
    ...partial,
  };
}

describe("isPoolPaid", () => {
  it("entrada > 0", () => {
    expect(isPoolPaid(pool({ entryFeeArs: 5_000 }))).toBe(true);
  });

  it("public_paid", () => {
    expect(isPoolPaid(pool({ type: "public_paid", entryFeeArs: 0 }))).toBe(true);
  });

  it("gratis", () => {
    expect(isPoolPaid(pool({ type: "public_free", entryFeeArs: 0 }))).toBe(false);
  });
});
