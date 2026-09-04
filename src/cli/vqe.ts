import * as fs from 'node:fs';
import { runVqe } from '../skills/vqe-agent/vqe';
import { assertFileExists } from '../skills/hardening/guard';
import { parseIntSafe } from './parse-int';

export async function vqeCommand(args: string[]) {
  let quboFile = '',
    layers = 2,
    iters = 50;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--qubo') {
      if (i + 1 >= args.length || args[i + 1] === undefined || args[i + 1].startsWith('-')) throw new Error('qwispr: missing value for --qubo');
      quboFile = args[++i];
    } else if (args[i] === '--layers') {
      if (i + 1 >= args.length || args[i + 1] === undefined || args[i + 1].startsWith('-')) throw new Error('qwispr: missing value for --layers');
      layers = parseIntSafe(args[++i], '--layers');
    } else if (args[i] === '--iters') {
      if (i + 1 >= args.length || args[i + 1] === undefined || args[i + 1].startsWith('-')) throw new Error('qwispr: missing value for --iters');
      iters = parseIntSafe(args[++i], '--iters');
    }
  }
  if (!quboFile) throw new Error('usage: qwispr vqe --qubo <file> --layers 2 --iters 50');
  assertFileExists(quboFile);
  let data: unknown;
  try {
    data = JSON.parse(fs.readFileSync(quboFile, 'utf8')) as unknown;
  } catch (e: unknown) {
    throw new Error(`qwispr: invalid JSON in ${quboFile}: ${(e as Error).message}`);
  }
  const d = data as Record<string, unknown>;
  const Q = (d.Q ?? d.costQubo) as number[][];
  return runVqe({ costQubo: Q, nLayers: layers, iters });
}
