import * as fs from 'node:fs';
import * as path from 'node:path';
import { runVqe } from '../vqe-agent/vqe';

function assertInsideRoot(file: string): string {
  const root = path.resolve(process.cwd());
  const abs = path.isAbsolute(file) ? file : path.join(root, file);
  let resolved: string;
  try {
    fs.lstatSync(abs);
    resolved = fs.realpathSync(abs);
  } catch {
    resolved = path.resolve(abs);
    const inside = resolved === root || resolved.startsWith(root + path.sep);
    if (!inside && process.env.QWISPR_ALLOW_ABSOLUTE !== '1') {
      throw new Error(`qwispr: path escapes workspace root: ${file}`);
    }
    throw new Error(`qwispr: file not found: ${file}`);
  }
  const inside =
    process.env.QWISPR_ALLOW_ABSOLUTE === '1'
      ? true
      : resolved === root || resolved.startsWith(root + path.sep);
  if (!inside) throw new Error(`qwispr: path escapes workspace root: ${file}`);
  const stat = fs.statSync(resolved);
  if (!stat.isFile()) throw new Error(`qwispr: not a regular file: ${file}`);
  return resolved;
}

function extractIfConditions(body: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < body.length) {
    const idx = body.indexOf('if', i);
    if (idx === -1) break;
    const before = idx > 0 ? body[idx - 1] : ' ';
    if (/\w/.test(before)) {
      i = idx + 2;
      continue;
    }
    let j = idx + 2;
    while (j < body.length && /\s/.test(body[j] ?? '')) j++;
    if (body[j] !== '(') {
      i = j + 1;
      continue;
    }
    let depth = 0;
    let end = -1;
    for (let k = j; k < body.length; k++) {
      if (body[k] === '(') depth++;
      else if (body[k] === ')') {
        depth--;
        if (depth === 0) {
          end = k;
          break;
        }
      }
    }
    if (end === -1) break;
    out.push(body.slice(j + 1, end));
    i = end + 1;
  }
  return out;
}

function splitConditions(cond: string): string[] {
  return cond
    .split(/\s*&&\s*|\s*\|\|\s*/)
    .map(s => s.trim().replace(/^\(+/, '').replace(/\)+$/, '').trim())
    .filter(Boolean);
}

export interface TestgenResult {
  inputs: number[][];
  coverageHint: string;
}

const BITS = 3;
const OFFSET = 4;

function extractFunction(src: string, fn: string): { params: string[]; body: string } | null {
  const esc = fn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let patterns: RegExp[];
  try {
    patterns = [
      new RegExp(
        `(?:export\\s+)?(?:async\\s+)?function\\s+${esc}\\s*\\(([^)]*)\\)\\s*(?::\\s*[^{]+)?\\{`
      ),
      new RegExp(
        `(?:export\\s+)?(?:const|let|var)\\s+${esc}\\s*=\\s*\\(([^)]*)\\)\\s*(?::\\s*[^{]+)?=>\\s*\\{`
      ),
      new RegExp(
        `(?:export\\s+)?(?:const|let|var)\\s+${esc}\\s*=\\s*(?:async\\s+)?function\\s*\\(([^)]*)\\)\\s*(?::\\s*[^{]+)?\\{`
      ),
    ];
  } catch {
    throw new Error(`qwispr: invalid function name "${fn}"`);
  }
  const stripTypes = (raw: string) =>
    raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(p => p.split(':')[0].split('=')[0].trim())
      .filter(Boolean);
  for (const re of patterns) {
    const m = src.match(re);
    if (m) {
      const params = stripTypes(m[1] ?? '');
      const start = (m.index ?? 0) + m[0].length - 1;
      let depth = 0,
        end = start;
      for (let i = start; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') {
          depth--;
          if (depth === 0) {
            end = i;
            break;
          }
        }
      }
      const body = src.slice(start, end + 1);
      return { params, body };
    }
  }
  let arrow: RegExp;
  try {
    arrow = new RegExp(
      `(?:export\\s+)?(?:const|let|var)\\s+${esc}\\s*=\\s*\\(([^)]*)\\)\\s*(?::\\s*[^{]+)?=>\\s*([^;\\n]+)`
    );
  } catch {
    throw new Error(`qwispr: invalid function name "${fn}"`);
  }
  const m2 = src.match(arrow);
  if (m2) return { params: stripTypes(m2[1] ?? ''), body: m2[2] ?? '' };
  return null;
}

function buildQubo(params: string[], body: string): number[][] {
  const n = params.length * BITS;
  const Q: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  if (n === 0) return Q;
  const paramIdx = new Map(params.map((p, i) => [p, i]));
  const addLinear = (param: string, coeff: number) => {
    const pi = paramIdx.get(param)!;
    for (let k = 0; k < BITS; k++) Q[pi * BITS + k][pi * BITS + k] += coeff * (1 << k);
  };
  for (const cond of extractIfConditions(body)) {
    for (const sub of splitConditions(cond)) {
      const c = sub.trim();
      if (/^\w+$/.test(c) && paramIdx.has(c)) {
        const pi = paramIdx.get(c)!;
        for (let k = 0; k < BITS; k++) Q[pi * BITS + k][pi * BITS + k] += -(1 << k);
        continue;
      }
      if (/^!\w+$/.test(c)) {
        const v = c.slice(1);
        if (paramIdx.has(v)) {
          const pi = paramIdx.get(v)!;
          for (let k = 0; k < BITS; k++) Q[pi * BITS + k][pi * BITS + k] += 1 << k;
        }
        continue;
      }
      const cmp = c.match(/(\w+)\s*(>=|<=|>|<|===|==|!==|!=)\s*(-?\d+|\w+)/);
      if (!cmp) continue;
      const [, left, op, right] = cmp;
      const leftIsParam = paramIdx.has(left);
      const rightIsParam = paramIdx.has(right);
      const rightNum = Number(right);
      const rightIsNum = !isNaN(rightNum) && !rightIsParam;
      const leftNum = Number(left);
      const leftIsNum = !isNaN(leftNum) && !leftIsParam;

      if (leftIsParam && rightIsNum) {
        if (op === '>' || op === '>=') addLinear(left, -1);
        else if (op === '<' || op === '<=') addLinear(left, 1);
        else if (op === '!==' || op === '!=') addLinear(left, -1);
      } else if (leftIsNum && rightIsParam) {
        if (op === '>' || op === '>=') addLinear(right, 1);
        else if (op === '<' || op === '<=') addLinear(right, -1);
      } else if (leftIsParam && rightIsParam) {
        if (op === '>' || op === '>=') {
          addLinear(left, -1);
          addLinear(right, 1);
        } else if (op === '<' || op === '<=') {
          addLinear(left, 1);
          addLinear(right, -1);
        }
      }
    }
  }
  const hasBias = Q.some(row => row.some(v => v !== 0));
  if (!hasBias && params.length > 0) {
    for (let k = 0; k < BITS; k++) Q[k][k] += -(1 << k);
  }
  return Q;
}

function decodeBitstring(bs: string, params: string[]): number[] {
  const needed = params.length * BITS;
  if (bs.length < needed) throw new Error(`qwispr: bitstring too short: expected ${needed}, got ${bs.length}`);
  const rev = bs.split('').reverse().join('');
  const vals: number[] = [];
  for (let p = 0; p < params.length; p++) {
    let v = 0;
    for (let k = 0; k < BITS; k++) {
      const bit = rev[p * BITS + k] === '1' ? 1 : 0;
      v += bit * (1 << k);
    }
    vals.push(v - OFFSET);
  }
  return vals;
}

export async function generateTestInputs(opts: {
  file: string;
  functionName: string;
  layers?: number;
}): Promise<TestgenResult> {
  const resolved = assertInsideRoot(opts.file);
  const src = fs.readFileSync(resolved, 'utf8');
  const fn = extractFunction(src, opts.functionName);
  if (!fn) throw new Error(`function ${opts.functionName} not found in ${opts.file}`);
  const { params, body } = fn;
  const Q = buildQubo(params, body);
  let decoded: number[];
  let hint: string;
  if (Q.length === 0) return { inputs: [[]], coverageHint: 'no params' };
  try {
    const r = await runVqe({ costQubo: Q, nLayers: opts.layers ?? 2, iters: 30 });
    decoded = decodeBitstring(r.bestBitstring, params);
    hint = `VQE energy ${r.bestEnergy.toFixed(2)} bitstring ${r.bestBitstring} covers branch in ${opts.functionName}`;
  } catch {
    decoded = params.map((_, i) => (i === 0 ? 1 : 0));
    hint = `fallback heuristic for ${opts.functionName} (VQE unavailable)`;
  }
  const inputs: number[][] = [decoded];
  const plus = decoded.map(v => v + 1);
  const minus = decoded.map(v => v - 1);
  const zero = params.map(() => 0);
  for (const cand of [plus, minus, zero]) {
    if (!inputs.some(a => a.every((v, i) => v === cand[i]))) inputs.push(cand);
  }
  const evalSingle = (c: string, env: Record<string, number>): boolean | null => {
    const t = c.trim().replace(/^\(+/, '').replace(/\)+$/, '').trim();
    if (/^\w+$/.test(t)) {
      if (t in env) return !!env[t];
      return null;
    }
    if (/^!\w+$/.test(t)) {
      const v = t.slice(1);
      if (v in env) return !env[v];
      return null;
    }
    const cmp = t.match(/^(\w+)\s*(>=|<=|>|<|===|==|!==|!=)\s*(-?\d+|\w+)$/);
    if (!cmp) return null;
    const [, left, op, right] = cmp;
    const lv = left in env ? env[left] : Number(left);
    const rv = right in env ? env[right] : Number(right);
    if (Number.isNaN(lv) || Number.isNaN(rv)) return null;
    switch (op) {
      case '>':
        return lv > rv;
      case '>=':
        return lv >= rv;
      case '<':
        return lv < rv;
      case '<=':
        return lv <= rv;
      case '===':
      case '==':
        return lv === rv;
      case '!==':
      case '!=':
        return lv !== rv;
      default:
        return null;
    }
  };
  const evalCond = (cond: string, env: Record<string, number>): boolean | null => {
    const trimmed = cond.trim();
    if (trimmed.includes('||')) {
      const parts = trimmed.split(/\s*\|\|\s*/);
      let anyTrue = false;
      let anyNull = false;
      for (const p of parts) {
        const v = p.includes('&&') ? evalCond(p, env) : evalSingle(p, env);
        if (v === true) anyTrue = true;
        if (v === null) anyNull = true;
      }
      if (anyTrue) return true;
      if (anyNull) return null;
      return false;
    }
    if (trimmed.includes('&&')) {
      const parts = trimmed.split(/\s*&&\s*/);
      for (const p of parts) {
        const v = evalSingle(p, env);
        if (v === false) return false;
        if (v === null) return null;
      }
      return true;
    }
    return evalSingle(trimmed, env);
  };
  const triggersBranch = (vals: number[]) => {
    const env: Record<string, number> = {};
    params.forEach((p, i) => (env[p] = vals[i]!));
    for (const cond of extractIfConditions(body)) {
      if (evalCond(cond, env) === true) return true;
    }
    return false;
  };
  if (params.length > 0 && !inputs.some(triggersBranch)) {
    const range = [-4, -3, -2, -1, 0, 1, 2, 3];
    let found: number[] | null = null;
    const search = (idx: number, cur: number[]) => {
      if (found) return;
      if (idx === params.length) {
        if (triggersBranch(cur)) found = [...cur];
        return;
      }
      for (const v of range) {
        cur[idx] = v;
        search(idx + 1, cur);
        if (found) return;
      }
    };
    search(0, Array(params.length).fill(0));
    if (found) {
      if (inputs.length >= 3) inputs[2] = found;
      else inputs[inputs.length - 1] = found;
    } else {
      const heuristic = params.map((_, i) => (i === 0 ? 1 : 0));
      if (!inputs.some(a => a.every((v, i) => v === heuristic[i]))) {
        if (inputs.length >= 3) inputs[2] = heuristic;
        else inputs[inputs.length - 1] = heuristic;
      }
    }
  }
  return { inputs: inputs.slice(0, 3), coverageHint: hint };
}

export const testgen = generateTestInputs;
