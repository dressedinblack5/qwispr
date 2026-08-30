import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawnWithTimeout } from '../hardening/guard';

export interface VqeInput {
  costQubo: number[][];
  nLayers?: number;
  iters?: number;
}
export interface VqeResult {
  bestBitstring: string;
  bestEnergy: number;
  trajectory: number[];
}

export async function runVqe(input: VqeInput): Promise<VqeResult> {
  const candidates = [
    path.join(__dirname, 'vqe.py'),
    path.join(__dirname, '..', '..', '..', '..', 'src', 'skills', 'vqe-agent', 'vqe.py'),
  ];
  const script = candidates.find(p => fs.existsSync(p)) ?? candidates[0];
  const args = ['--layers', String(input.nLayers ?? 2), '--iters', String(input.iters ?? 50)];
  const inputJson = JSON.stringify({ costQubo: input.costQubo });
  let result: { stdout: string; stderr: string };
  try {
    result = await spawnWithTimeout('python3', [script, ...args], {
      timeout: 30000,
      maxBuffer: 1024 * 1024,
      input: inputJson,
    });
  } catch (e: unknown) {
    const msg = (e as Error).message;
    if (msg.includes('ENOENT') || msg.includes('not found'))
      throw new Error(`qwispr: python not found: python3 — ${msg}`);
    throw e;
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error(`qwispr: parse failed: ${result.stdout.slice(0, 200)}`);
  }
}
