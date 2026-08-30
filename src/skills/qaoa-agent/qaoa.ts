import * as fs from "node:fs";
import * as path from "node:path";
import { spawnWithTimeout } from "../hardening/guard";

export interface QaoaInput { Q: number[][]; layers?: number; iters?: number; }
export interface QaoaResult { bitstring: string; energy: number; }

export async function runQaoa(input: QaoaInput): Promise<QaoaResult> {
  const candidates = [path.join(__dirname, "qaoa.py"), path.join(__dirname, "..", "..", "..", "..", "src", "skills", "qaoa-agent", "qaoa.py")];
  const script = candidates.find((p) => fs.existsSync(p)) ?? candidates[0]!;
  const inputJson = JSON.stringify({ Q: input.Q });
  let result: { stdout: string; stderr: string };
  try {
    result = await spawnWithTimeout("python3", [script, "--qubo", "-", "--layers", String(input.layers ?? 1), "--iters", String(input.iters ?? 50)], { timeout: 30000, maxBuffer: 1024 * 1024, input: inputJson });
  } catch (e: unknown) {
    const msg = (e as Error).message;
    if (msg.includes("ENOENT") || msg.includes("not found")) throw new Error(`qwispr: python not found: python3 — ${msg}`);
    throw e;
  }
  try { return JSON.parse(result.stdout); } catch { throw new Error(result.stdout.slice(0, 200) || "qwispr: qaoa parse failed"); }
}
