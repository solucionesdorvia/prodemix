import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getMaintenanceEndLabel,
  isMaintenanceModeActive,
} from "./maintenance-mode";

const AR_TZ = "America/Argentina/Buenos_Aires";

function artYmd(ms: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: AR_TZ }).format(
    new Date(ms),
  );
}

describe("maintenance-mode", () => {
  const prev = { ...process.env };

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...prev };
  });

  it("is inactive when MAINTENANCE_MODE is off", () => {
    delete process.env.MAINTENANCE_MODE;
    expect(isMaintenanceModeActive()).toBe(false);
  });

  it("MAINTENANCE_UNTIL: active before end, inactive after", () => {
    process.env.MAINTENANCE_MODE = "true";
    process.env.MAINTENANCE_UNTIL = "2026-04-16T17:00:00.000Z";
    vi.setSystemTime(new Date("2026-04-16T16:59:59.999Z"));
    expect(isMaintenanceModeActive()).toBe(true);
    vi.setSystemTime(new Date("2026-04-16T17:00:00.000Z"));
    expect(isMaintenanceModeActive()).toBe(false);
  });

  it("MAINTENANCE_DAY: same calendar day in AR and before 14:00 ART → active", () => {
    process.env.MAINTENANCE_MODE = "true";
    delete process.env.MAINTENANCE_UNTIL;
    process.env.MAINTENANCE_DAY = "2026-04-16";
    const noonArt = new Date("2026-04-16T15:00:00.000Z");
    expect(artYmd(noonArt.getTime())).toBe("2026-04-16");
    vi.setSystemTime(noonArt);
    expect(isMaintenanceModeActive()).toBe(true);
  });

  it("MAINTENANCE_DAY: after 14:00 ART on that day → inactive", () => {
    process.env.MAINTENANCE_MODE = "true";
    delete process.env.MAINTENANCE_UNTIL;
    process.env.MAINTENANCE_DAY = "2026-04-16";
    vi.setSystemTime(new Date("2026-04-16T17:00:01.000Z"));
    expect(isMaintenanceModeActive()).toBe(false);
  });

  it("MAINTENANCE_DAY: wrong AR calendar day → inactive", () => {
    process.env.MAINTENANCE_MODE = "true";
    delete process.env.MAINTENANCE_UNTIL;
    process.env.MAINTENANCE_DAY = "2026-04-16";
    vi.setSystemTime(new Date("2026-04-16T02:00:00.000Z"));
    expect(artYmd(Date.now())).toBe("2026-04-15");
    expect(isMaintenanceModeActive()).toBe(false);
  });

  it("getMaintenanceEndLabel ends at 14:00 ART for MAINTENANCE_DAY", () => {
    process.env.MAINTENANCE_MODE = "true";
    delete process.env.MAINTENANCE_UNTIL;
    process.env.MAINTENANCE_DAY = "2026-04-16";
    const label = getMaintenanceEndLabel();
    expect(label).toMatch(/14:00|2:00\s*p\.\s*m\./i);
  });
});
