import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { generateTestInputs } from "../testgen";

describe("testgen", () => {
  it("generates boundary inputs and covers branch", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "testgen-"));
    const file = path.join(tmp, "foo.ts");
    fs.writeFileSync(file, `export function add(a:number,b:number){ if(a>0){ return a+b; } return b; }`);
    const r = await generateTestInputs({ file, functionName: "add", layers: 1 });
    expect(r.inputs.length).toBeGreaterThan(0);
    expect(r.coverageHint).toBeTruthy();
    // at least one input triggers a>0
    const triggers = r.inputs.some(([a]) => a > 0);
    expect(triggers).toBe(true);
    // inputs are arrays matching param count
    expect(r.inputs[0].length).toBe(2);
  }, 30000);
});
