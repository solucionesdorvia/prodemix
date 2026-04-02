import { describe, expect, it } from "vitest";

import { normalizeUsername, validateUsernameFormat } from "./username";

describe("normalizeUsername", () => {
  it("pasa a minúsculas y recorta", () => {
    expect(normalizeUsername("  PePe  ")).toBe("pepe");
  });

  it("quita tildes", () => {
    expect(normalizeUsername("José")).toBe("jose");
    expect(normalizeUsername("MARÍA")).toBe("maria");
  });

  it("convierte ñ a n (no forma parte de a-z ASCII)", () => {
    expect(normalizeUsername("ñoño")).toBe("nono");
  });

  it("espacios pasan a guión bajo; otros símbolos se quitan", () => {
    expect(normalizeUsername("juan perez")).toBe("juan_perez");
    expect(normalizeUsername("a--b")).toBe("ab");
  });
});

describe("validateUsernameFormat", () => {
  it("acepta resultado normalizado típico", () => {
    expect(validateUsernameFormat(normalizeUsername("María García"))).toBeNull();
  });
});
