import { describe, it, expect } from "vitest";
import { refactorSource } from "../refactor";

describe("refactor", () => {
  it("scores god-function higher than isolated helper", () => {
    const src = `
      function god(){ a(); b(); c(); d(); e(); }
      function a(){}
      function b(){}
      function c(){}
      function d(){}
      function e(){}
      function isolated(){}
    `;
    const r = refactorSource(src, "src/foo.ts", 10);
    const god = r.candidates.find(c => c.function === "god")!;
    const iso = r.candidates.find(c => c.function === "isolated")!;
    expect(god).toBeDefined();
    expect(iso).toBeDefined();
    expect(god.score).toBeGreaterThan(iso.score);
    expect(god.reason).toMatch(/centrality/i);
  });
});
