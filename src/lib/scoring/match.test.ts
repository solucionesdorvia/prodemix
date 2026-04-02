import { describe, expect, it } from "vitest";

import {
  PRODE_PUNTOS_ERROR,
  PRODE_PUNTOS_PLENO,
  PRODE_PUNTOS_SIGNO,
} from "./constants";
import { pointsForPrediction, scorePrediction } from "./match";

describe("scorePrediction", () => {
  it("awards pleno when exact score matches", () => {
    expect(scorePrediction(2, 1, 2, 1)).toEqual({
      points: PRODE_PUNTOS_PLENO,
      pleno: true,
      signHit: true,
    });
  });

  it("awards signo when outcome matches but not exact score (home)", () => {
    expect(scorePrediction(2, 0, 1, 0)).toEqual({
      points: PRODE_PUNTOS_SIGNO,
      pleno: false,
      signHit: true,
    });
  });

  it("awards signo when outcome matches (away wins)", () => {
    expect(scorePrediction(0, 2, 1, 3)).toEqual({
      points: PRODE_PUNTOS_SIGNO,
      pleno: false,
      signHit: true,
    });
  });

  it("awards signo on matching draws", () => {
    expect(scorePrediction(1, 1, 0, 0)).toEqual({
      points: PRODE_PUNTOS_SIGNO,
      pleno: false,
      signHit: true,
    });
  });

  it("awards error when outcome differs", () => {
    expect(scorePrediction(2, 1, 1, 2)).toEqual({
      points: PRODE_PUNTOS_ERROR,
      pleno: false,
      signHit: false,
    });
  });

  it("treats draw vs non-draw as error", () => {
    expect(scorePrediction(1, 1, 2, 0).points).toBe(PRODE_PUNTOS_ERROR);
  });
});

describe("pointsForPrediction", () => {
  it("returns 0 | 1 | 3", () => {
    expect(pointsForPrediction({ home: 0, away: 0 }, { home: 0, away: 0 })).toBe(
      PRODE_PUNTOS_PLENO,
    );
    expect(pointsForPrediction({ home: 1, away: 0 }, { home: 2, away: 0 })).toBe(
      PRODE_PUNTOS_SIGNO,
    );
    expect(pointsForPrediction({ home: 0, away: 0 }, { home: 1, away: 0 })).toBe(
      PRODE_PUNTOS_ERROR,
    );
  });
});
