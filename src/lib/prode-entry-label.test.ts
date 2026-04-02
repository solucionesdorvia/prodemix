import { describe, expect, it } from "vitest";

import {
  prodeDbTypeLabel,
  prodeEntryLabel,
  publicPoolEntryLabel,
} from "./prode-entry-label";

describe("prodeEntryLabel", () => {
  it("entrada > 0", () => {
    expect(prodeEntryLabel({ entryFeeArs: 5000 })).toBe("Entrada $5.000");
  });

  it("sin entrada con premio en pool", () => {
    expect(
      prodeEntryLabel({ entryFeeArs: 0, prizePoolArs: 100_000 }),
    ).toBe("Con premio");
  });

  it("sin entrada con premio por puesto", () => {
    expect(
      prodeEntryLabel({
        entryFeeArs: 0,
        prizeFirstArs: 50_000,
      }),
    ).toBe("Con premio");
  });

  it("gratis sin premio", () => {
    expect(prodeEntryLabel({ entryFeeArs: 0 })).toBe("Gratis");
  });
});

describe("publicPoolEntryLabel", () => {
  it("delega a prodeEntryLabel", () => {
    expect(
      publicPoolEntryLabel({ entryFeeArs: 0, prizePoolArs: 1 }),
    ).toBe("Con premio");
  });
});

describe("prodeDbTypeLabel", () => {
  it("mapea enums de Prisma", () => {
    expect(prodeDbTypeLabel("FREE")).toBe("Gratis");
    expect(prodeDbTypeLabel("ELITE")).toBe("Con entrada o premio");
  });
});
