import { describe, expect, it } from "vitest";

import {
  compareLeaderboardRows,
  sortAndAssignRanks,
} from "./ranking-sort";

const d = (iso: string) => new Date(iso);

describe("compareLeaderboardRows", () => {
  it("orders by points descending", () => {
    const a = {
      userId: "a",
      points: 3,
      plenos: 1,
      signHits: 1,
      minSavedAt: d("2025-01-01T12:00:00.000Z"),
    };
    const b = {
      userId: "b",
      points: 6,
      plenos: 2,
      signHits: 2,
      minSavedAt: d("2025-01-01T12:00:00.000Z"),
    };
    expect(compareLeaderboardRows(a, b)).toBeGreaterThan(0);
    expect(compareLeaderboardRows(b, a)).toBeLessThan(0);
  });

  it("breaks ties on plenos when points are equal", () => {
    const morePlenos = {
      userId: "p",
      points: 6,
      plenos: 2,
      signHits: 1,
      minSavedAt: d("2025-01-01T12:00:00.000Z"),
    };
    const fewerPlenos = {
      userId: "q",
      points: 6,
      plenos: 1,
      signHits: 3,
      minSavedAt: d("2025-01-01T12:00:00.000Z"),
    };
    expect(compareLeaderboardRows(morePlenos, fewerPlenos)).toBeLessThan(0);
  });

  it("breaks ties on signHits when points and plenos are equal", () => {
    const moreSigns = {
      userId: "s",
      points: 4,
      plenos: 1,
      signHits: 3,
      minSavedAt: d("2025-01-01T12:00:00.000Z"),
    };
    const fewerSigns = {
      userId: "t",
      points: 4,
      plenos: 1,
      signHits: 2,
      minSavedAt: d("2025-01-01T12:00:00.000Z"),
    };
    expect(compareLeaderboardRows(moreSigns, fewerSigns)).toBeLessThan(0);
  });

  it("breaks ties on earlier savedAt when points, plenos and signHits match", () => {
    const earlier = {
      userId: "e",
      points: 5,
      plenos: 1,
      signHits: 2,
      minSavedAt: d("2025-01-01T10:00:00.000Z"),
    };
    const later = {
      userId: "l",
      points: 5,
      plenos: 1,
      signHits: 2,
      minSavedAt: d("2025-01-01T11:00:00.000Z"),
    };
    expect(compareLeaderboardRows(earlier, later)).toBeLessThan(0);
  });

  it("treats null minSavedAt as worse than a date", () => {
    const withDate = {
      userId: "a",
      points: 1,
      plenos: 0,
      signHits: 1,
      minSavedAt: d("2025-01-01T12:00:00.000Z"),
    };
    const noDate = {
      userId: "b",
      points: 1,
      plenos: 0,
      signHits: 1,
      minSavedAt: null,
    };
    expect(compareLeaderboardRows(withDate, noDate)).toBeLessThan(0);
  });
});

describe("sortAndAssignRanks", () => {
  it("assigns ordinal ranks 1…n; breaks full ties by userId", () => {
    const t = d("2025-01-01T12:00:00.000Z");
    const ranked = sortAndAssignRanks([
      {
        userId: "a",
        points: 3,
        plenos: 1,
        signHits: 1,
        minSavedAt: t,
      },
      {
        userId: "b",
        points: 3,
        plenos: 1,
        signHits: 1,
        minSavedAt: t,
      },
      {
        userId: "c",
        points: 1,
        plenos: 0,
        signHits: 1,
        minSavedAt: t,
      },
    ]);
    expect(ranked.map((r) => r.userId)).toEqual(["a", "b", "c"]);
    expect(ranked.map((r) => r.rankPosition)).toEqual([1, 2, 3]);
  });
});
