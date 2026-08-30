import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { search } from "../search";

describe("search", () => {
  it("finds TODO via grover-ranked search", () => {
    const prev = process.env.QWISPR_ALLOW_ABSOLUTE;
    process.env.QWISPR_ALLOW_ABSOLUTE = "1";
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "qwispr-search-"));
    try {
      fs.writeFileSync(path.join(dir, "a.ts"), "const x=1;\n// TODO fix me\nconst y=2;\n");
      fs.writeFileSync(path.join(dir, "b.ts"), "const z=3;\n");
      const res = search({ pattern: "TODO", files: path.join(dir, "**/*.ts"), top: 10 });
      expect(res.hits.length).toBe(1);
      expect(res.hits[0].snippet).toContain("TODO");
      expect(res.hits[0].line).toBe(2);
      expect(res.amplifiedIndex).toBe(0);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
      if (prev === undefined) delete process.env.QWISPR_ALLOW_ABSOLUTE;
      else process.env.QWISPR_ALLOW_ABSOLUTE = prev;
    }
  });
});
