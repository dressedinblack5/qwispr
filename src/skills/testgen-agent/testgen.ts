import * as fs from 'node:fs';
import { runVqe } from '../vqe-agent/vqe';

export interface TestgenResult {
  inputs: number[][];
  coverageHint: string;
}

const BITS = 3;
const OFFSET = 4; // 3 bits -> values -4..3

function extractFunction(src: string, fn: string): { params: string[]; body: string } | null {
  const esc = fn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let patterns: RegExp[];
  try {
    // ponytail: regex with optional type, upgrade to tree-sitter when parser lands
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
  // fallback: arrow without braces
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
  // ponytail: naive branch-distance heuristic — for `if(x>0)` distance=-x, `if(x<0)` distance=x; upgrade to symbolic execution if coverage stalls
  const ifRe = /if\s*\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = ifRe.exec(body))) {
    const cond = m[1].trim();
    // single var truthy: if(a)
    if (/^\w+$/.test(cond) && paramIdx.has(cond)) {
      const pi = paramIdx.get(cond)!;
      for (let k = 0; k < BITS; k++) Q[pi * BITS + k][pi * BITS + k] += -(1 << k);
      continue;
    }
    if (/^!\w+$/.test(cond)) {
      const v = cond.slice(1);
      if (paramIdx.has(v)) {
        const pi = paramIdx.get(v)!;
        for (let k = 0; k < BITS; k++) Q[pi * BITS + k][pi * BITS + k] += 1 << k;
      }
      continue;
    }
    const cmp = cond.match(/(\w+)\s*(>=|<=|>|<|===|==|!==|!=)\s*(-?\d+|\w+)/);
    if (!cmp) continue;
    const [, left, op, right] = cmp;
    const leftIsParam = paramIdx.has(left);
    const rightIsParam = paramIdx.has(right);
    const rightNum = Number(right);
    const rightIsNum = !isNaN(rightNum) && !rightIsParam;
    const leftNum = Number(left);
    const leftIsNum = !isNaN(leftNum) && !leftIsParam;

    const addLinear = (param: string, coeff: number) => {
      const pi = paramIdx.get(param)!;
      for (let k = 0; k < BITS; k++) Q[pi * BITS + k][pi * BITS + k] += coeff * (1 << k);
    };

    if (leftIsParam && rightIsNum) {
      if (op === '>' || op === '>=') addLinear(left, -1);
      else if (op === '<' || op === '<=') addLinear(left, 1);
      else if (op === '===' || op === '==') {
        /* minimize |x-C|: push toward C via quadratic would be ideal, naive linear toward C */
        // heuristic: if C>=0 push positive else negative — handled by no-op, VQE will find near-zero
      } else if (op === '!==' || op === '!=') addLinear(left, -1);
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
  // if no branches found, bias first param positive to generate boundary
  const hasBias = Q.some(row => row.some(v => v !== 0));
  if (!hasBias && params.length > 0) {
    for (let k = 0; k < BITS; k++) Q[k][k] += -(1 << k);
  }
  return Q;
}

function decodeBitstring(bs: string, params: string[]): number[] {
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
  const src = fs.readFileSync(opts.file, 'utf8');
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
    // fallback heuristic without VQE
    decoded = params.map((_, i) => (i === 0 ? 1 : 0));
    hint = `fallback heuristic for ${opts.functionName} (VQE unavailable)`;
  }
  // generate boundary variants around decoded
  const inputs: number[][] = [decoded];
  const plus = decoded.map(v => v + 1);
  const minus = decoded.map(v => v - 1);
  const zero = params.map(() => 0);
  for (const cand of [plus, minus, zero]) {
    if (!inputs.some(a => a.every((v, i) => v === cand[i]))) inputs.push(cand);
  }
  // ponytail: no eval — pure branch-distance heuristic only
  const evalCond = (cond: string, env: Record<string, number>): boolean | null => {
    const c = cond.trim();
    if (/^\w+$/.test(c)) return !!env[c];
    if (/^!\w+$/.test(c)) return !env[c.slice(1)];
    const cmp = c.match(/^(\w+)\s*(>=|<=|>|<|===|==|!==|!=)\s*(-?\d+|\w+)$/);
    if (!cmp) return null;
    const [, left, op, right] = cmp;
    const lv = left in env ? env[left]! : Number(left);
    const rv = right in env ? env[right]! : Number(right);
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
  const triggersBranch = (vals: number[]) => {
    const env: Record<string, number> = {};
    params.forEach((p, i) => (env[p] = vals[i]!));
    const re = /if\s*\(([^)]+)\)/g;
    let mm: RegExpExecArray | null;
    while ((mm = re.exec(body))) {
      const cond = mm[1].trim();
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

// alias for CLI
export const testgen = generateTestInputs;
