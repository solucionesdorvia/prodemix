import { describe, expect, it } from "vitest";

import {
  isNamedPremioTopThreeProde,
  normalizePremioKey,
} from "@/lib/leaderboard-prode-display";

describe("normalizePremioKey", () => {
  it("normaliza Fecha4 y espacios", () => {
    expect(normalizePremioKey("Premio B Fecha4", "x")).toContain("premio b fecha 4");
  });
});

describe("isNamedPremioTopThreeProde", () => {
  it("detecta Premio A/B Fecha 4 y Premio C Fecha 2", () => {
    expect(isNamedPremioTopThreeProde("Premio B Fecha4", "")).toBe(true);
    expect(isNamedPremioTopThreeProde("Premio A Fecha 4", "")).toBe(true);
    expect(isNamedPremioTopThreeProde("Premio c Fecha2", "")).toBe(true);
    expect(isNamedPremioTopThreeProde("Otro pool", "")).toBe(false);
  });
});
