import * as fs from 'node:fs';
import * as path from 'node:path';
import { Backend, getBackend } from './backend';
import { spawnWithTimeout } from '../hardening/guard';

export interface QpuStatus {
  backend: Backend;
  hasToken: boolean;
  dryRun: boolean;
  shots: number;
}

export type QpuResult = Record<string, unknown>;

function isQpuResult(v: unknown): v is QpuResult {
  return typeof v === 'object' && v !== null;
}

export function getQpuStatus(): QpuStatus {
  const backend = getBackend();
  const hasToken = !!process.env.QISKIT_TOKEN?.trim();
  const dryRun = process.env.QWISPR_QPU_DRYRUN === '1';
  const raw = parseInt(process.env.QWISPR_QPU_SHOTS ?? '1024', 10);
  const shots = Number.isNaN(raw) ? 1024 : Math.min(10000, Math.max(1, raw));
  return { backend, hasToken, dryRun, shots };
}

// ponytail: simple 2×2 flip, calibrar con matriz real si QPU lo requiere
export function applyReadoutMitigation(
  counts: Record<string, number>,
  flipProb = 0.02
): Record<string, number> {
  const keys = Object.keys(counts);
  if (keys.length === 0) return {};
  const n = keys[0].length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return { ...counts };
  const corrected: Record<string, number> = {};
  for (const bs of keys) {
    let v = counts[bs] * (1 - n * flipProb);
    for (let i = 0; i < n; i++) {
      const flipped = bs.slice(0, i) + (bs[i] === '0' ? '1' : '0') + bs.slice(i + 1);
      if (counts[flipped] !== undefined) v += counts[flipped] * flipProb;
    }
    corrected[bs] = Math.max(0, v);
  }
  const sumCorr = Object.values(corrected).reduce((a, b) => a + b, 0);
  if (sumCorr === 0) return corrected;
  const scale = total / sumCorr;
  for (const k of keys) corrected[k] *= scale;
  return corrected;
}

// ponytail: reuse guard spawnWithTimeout
// ponytail: stub, queue/cost cuando haya tracción QPU
export async function runQpuOrFallback(
  quboPath: string,
  opts?: { shots?: number }
): Promise<{ result: unknown; path: 'qpu' | 'simulator'; warning?: string }> {
  const s = getQpuStatus();
  const shots = opts?.shots ?? s.shots;
  if (!s.dryRun) return { result: null, path: 'simulator' };
  return {
    result: { dryRun: true, shots, quboPath } satisfies QpuResult,
    path: 'qpu',
    warning: 'dry-run: simulated QPU path',
  };
}
