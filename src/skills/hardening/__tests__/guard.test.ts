import { describe, it, expect } from "vitest";
import { assertSafePattern, assertFileExists } from "../guard";

describe("guard", () => {
  it("rejects catastrophic ReDoS pattern", () => {
    expect(() => assertSafePattern("([a-z]+)+")).toThrow(/unsafe pattern/);
  });
  it("throws typed file-not-found error", () => {
    expect(() => assertFileExists("missing-xyz-123.json")).toThrow(/qwispr: file not found/);
  });
});
