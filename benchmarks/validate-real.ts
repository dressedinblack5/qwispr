#!/usr/bin/env tsx
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
const dir = join(import.meta.dirname, "real");
const files = readdirSync(dir).filter(f => f.endsWith(".json"));
let pass = 0, fail = 0;
for (const name of files) {
  const p = join(dir, name);
  try {
    const j = JSON.parse(readFileSync(p, "utf8"));
    const q = j._qwispr;
    if (!q || typeof q.expectedSolvable !== "boolean" || q.source !== "real" || !j.packages) throw new Error("missing _qwispr fields");
    if (!["MIT","Apache-2.0","BSD-3-Clause","ISC"].includes(q.license)) throw new Error(`license ${q.license} not allowed`);
    console.log(`PASS ${name} (solvable=${q.expectedSolvable}, license=${q.license})`);
    pass++;
  } catch (e:any) { console.error(`FAIL ${name}: ${e.message}`); fail++; }
}
console.log(`--- ${pass} passed, ${fail} failed ---`);
process.exit(fail ? 1 : 0);
