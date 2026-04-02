import { describe, expect, it } from "vitest";

import { resultSign } from "./outcome";

describe("resultSign", () => {
  it("classifies home win", () => {
    expect(resultSign(2, 1)).toBe("home");
    expect(resultSign(1, 0)).toBe("home");
  });

  it("classifies away win", () => {
    expect(resultSign(0, 1)).toBe("away");
    expect(resultSign(2, 3)).toBe("away");
  });

  it("classifies draw", () => {
    expect(resultSign(0, 0)).toBe("draw");
    expect(resultSign(2, 2)).toBe("draw");
  });
});
