import { describe, expect, it } from "vitest";

import { initialsFromGreetingName } from "./user-display";

describe("initialsFromGreetingName", () => {
  it("una palabra toma dos caracteres", () => {
    expect(initialsFromGreetingName("futsal_fan")).toBe("FU");
  });

  it("nombre compuesto: primera y última palabra", () => {
    expect(initialsFromGreetingName("Juan Pérez")).toBe("JP");
  });
});
