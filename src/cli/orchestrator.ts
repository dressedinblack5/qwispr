import * as fs from 'node:fs';
import { orchestrateAdaptive } from '../skills/orchestrator/orchestrator';
import { appendEvent } from '../skills/learning/telemetry';
import { assertFileExists, resolveInsideRoot } from '../skills/hardening/guard';
import type { Task } from '../skills/orchestrator/router';
import { searchCommand } from './search';
import { testgenCommand } from './testgen';
import { analyzeCommand } from './analyze';
import { refactorCommand } from './refactor';
import { runQaoa } from '../skills/qaoa-agent/qaoa';
import { parseIntSafe } from './parse-int';

function parseTask(args: string[]): {
  task: Task;
  rest: string[];
  nVars?: number;
  trivial?: boolean;
} {
  let task: Task = 'search';
  let nVars: number | undefined;
  let trivial: boolean | undefined;
  const rest: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--task') {
      if (i + 1 >= args.length || args[i + 1] === undefined || args[i + 1].startsWith('-')) throw new Error('qwispr: missing value for --task');
      task = args[++i] as Task;
    } else if (args[i] === '--vars') {
      if (i + 1 >= args.length || args[i + 1] === undefined || args[i + 1].startsWith('-')) throw new Error('qwispr: missing value for --vars');
      nVars = parseIntSafe(args[++i], '--vars');
    } else if (args[i] === '--trivial') trivial = true;
    else rest.push(args[i]);
  }
  // infer nVars from --qubo if not explicit
  if (nVars === undefined) {
    const qi = rest.indexOf('--qubo');
    if (qi !== -1) {
      if (qi + 1 >= rest.length || rest[qi + 1] === undefined || rest[qi + 1].startsWith('-')) {
        throw new Error('qwispr: missing value for --qubo');
      }
      try {
        assertFileExists(rest[qi + 1]);
        const raw = fs.readFileSync(resolveInsideRoot(rest[qi + 1]), 'utf8');
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(raw) as Record<string, unknown>;
        } catch (e: unknown) {
          throw new Error(`qwispr: invalid JSON in ${rest[qi + 1]}: ${(e as Error).message}`);
        }
        const Q = data.Q ?? data.costQubo;
        if (Array.isArray(Q)) nVars = (Q as unknown[]).length;
      } catch (e: unknown) {
        if ((e as Error).message.startsWith('qwispr: invalid JSON') || (e as Error).message.startsWith('qwispr: file not found') || (e as Error).message.startsWith('qwispr: file too large') || (e as Error).message.startsWith('qwispr: symlink')) throw e;
      }
    }
  }
  // infer from --file for analyze/refactor/testgen: count trivial as small file
  if (nVars === undefined && trivial === undefined) {
    const fi = rest.indexOf('--file');
    if (fi !== -1) {
      if (fi + 1 >= rest.length || rest[fi + 1] === undefined || rest[fi + 1].startsWith('-')) {
        throw new Error('qwispr: missing value for --file');
      }
      try {
        const src = fs.readFileSync(resolveInsideRoot(rest[fi + 1]), 'utf8');
        // heuristic: number of functions as proxy for nVars
        const funcs = (src.match(/function\s+\w+/g) || []).length;
        if (funcs > 0) nVars = funcs;
      } catch {
        /* ignore */
      }
    }
  }
  return { task, rest, nVars, trivial };
}

export async function orchestratorCommand(args: string[]) {
  const { task, rest, nVars, trivial } = parseTask(args);
  const decision = orchestrateAdaptive({ task, nVars, trivial });
  const t0 = Date.now();

  let result: unknown = null;
  let success = true;
  try {
    if (task === 'search') {
      result = searchCommand(rest);
    } else if (task === 'resolve') {
      const qi = rest.indexOf('--qubo');
      if (qi !== -1) {
        if (qi + 1 >= rest.length || rest[qi + 1] === undefined || rest[qi + 1].startsWith('-')) {
          throw new Error('qwispr: missing value for --qubo');
        }
        assertFileExists(rest[qi + 1]);
        let data: unknown;
        try {
          data = JSON.parse(fs.readFileSync(resolveInsideRoot(rest[qi + 1]), 'utf8')) as unknown;
        } catch (e: unknown) {
          throw new Error(`qwispr: invalid JSON in ${rest[qi + 1]}: ${(e as Error).message}`);
        }
        const d = data as Record<string, unknown>;
        const Q = (d.Q ?? d.costQubo) as number[][];
        if (decision.route === 'quantum') result = await runQaoa({ Q });
        else {
          const n = Q.length;
          if (n > 20) throw new Error(`qwispr: n=${n} too large for classical brute force (max 20)`);
          let best = Infinity,
            bestBs = '';
          for (let bits = 0; bits < Math.pow(2, n); bits++) {
            const bv = Array.from({ length: n }, (_, k) => (bits >> k) & 1);
            const e = Q.reduce(
              (s: number, row: number[], i: number) =>
                s + row.reduce((a: number, v: number, j: number) => a + v * bv[i] * bv[j], 0),
              0
            );
            if (e < best) {
              best = e;
              bestBs = bv.slice().reverse().join('');
            }
          }
          result = { bitstring: bestBs, energy: best, route: 'classical' };
        }
      } else {
        result = { note: 'no --qubo provided, routing only', decision };
      }
    } else if (task === 'testgen') {
      result = await testgenCommand(rest);
    } else if (task === 'analyze') {
      result = analyzeCommand(rest);
    } else if (task === 'refactor') {
      result = refactorCommand(rest);
    } else {
      throw new Error(`unknown task: ${task}`);
    }
  } catch (e) {
    success = false;
    throw e;
  } finally {
    const wallMs = Date.now() - t0;
    if (process.env.QWISPR_TELEMETRY === '1') {
      try {
        appendEvent({
          ts: Date.now(),
          task,
          route: decision.route,
          nVars: nVars ?? 0,
          wallMs,
          success,
        });
      } catch {
        /* ignore */
      }
    }
  }
  return { ...decision, task, result };
}
