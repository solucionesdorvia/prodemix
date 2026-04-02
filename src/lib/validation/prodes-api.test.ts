import { describe, expect, it } from "vitest";

import { predictionsPostBodySchema, prodeRouteIdSchema } from "./prodes-api";

describe("prodeRouteIdSchema", () => {
  it("accepts non-empty trimmed ids", () => {
    expect(prodeRouteIdSchema.safeParse("abc-123").success).toBe(true);
  });

  it("rejects empty", () => {
    expect(prodeRouteIdSchema.safeParse("").success).toBe(false);
    expect(prodeRouteIdSchema.safeParse("   ").success).toBe(false);
  });
});

describe("predictionsPostBodySchema", () => {
  it("accepts valid scores and dedupes by matchId are enforced", () => {
    const ok = predictionsPostBodySchema.safeParse({
      predictions: [
        { matchId: "m1", predictedHomeScore: 0, predictedAwayScore: 99 },
      ],
    });
    expect(ok.success).toBe(true);
  });

  it("rejects duplicate matchId", () => {
    const bad = predictionsPostBodySchema.safeParse({
      predictions: [
        { matchId: "x", predictedHomeScore: 1, predictedAwayScore: 0 },
        { matchId: "x", predictedHomeScore: 2, predictedAwayScore: 0 },
      ],
    });
    expect(bad.success).toBe(false);
  });

  it("rejects out-of-range scores", () => {
    const bad = predictionsPostBodySchema.safeParse({
      predictions: [{ matchId: "m", predictedHomeScore: 100, predictedAwayScore: 0 }],
    });
    expect(bad.success).toBe(false);
  });

  it("requires at least one prediction", () => {
    const bad = predictionsPostBodySchema.safeParse({ predictions: [] });
    expect(bad.success).toBe(false);
  });

  it("rejects negative scores", () => {
    const bad = predictionsPostBodySchema.safeParse({
      predictions: [{ matchId: "m", predictedHomeScore: -1, predictedAwayScore: 0 }],
    });
    expect(bad.success).toBe(false);
  });
});
