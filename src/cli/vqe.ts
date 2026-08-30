import * as fs from "node:fs";
import { runVqe } from "../skills/vqe-agent/vqe";
import { assertFileExists } from "../skills/hardening/guard";

export async function vqeCommand(args: string[]) {
  let quboFile = "", layers = 2, iters = 50;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--qubo" && args[i+1]) quboFile = args[++i];
    else if (args[i] === "--layers" && args[i+1]) { const v = parseInt(args[++i], 10); if (Number.isNaN(v) || v <= 0) throw new Error("qwispr: invalid --layers/--iters"); layers = v; }
    else if (args[i] === "--iters" && args[i+1]) { const v = parseInt(args[++i], 10); if (Number.isNaN(v) || v <= 0) throw new Error("qwispr: invalid --layers/--iters"); iters = v; }
  }
  if (!quboFile) throw new Error("usage: qwispr vqe --qubo <file> --layers 2 --iters 50");
  assertFileExists(quboFile);
  let data: unknown;
  try { data = JSON.parse(fs.readFileSync(quboFile, "utf8")) as unknown; } catch (e: unknown) { throw new Error(`qwispr: invalid JSON in ${quboFile}: ${(e as Error).message}`); }
  const d = data as Record<string, unknown>;
  const Q = (d.Q ?? d.costQubo) as number[][];
  return runVqe({ costQubo: Q, nLayers: layers, iters });
}
