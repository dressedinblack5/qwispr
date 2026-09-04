import * as fs from 'node:fs';
import * as path from 'node:path';
import { bfsReachable, centrality, diameter, hotSpots, buildAdj } from '../qwalk-agent/qwalk';

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

export interface AnalyzeResult {
  nodes: string[];
  edges: [string, string][];
  reachableFromEntry: string[];
  centrality: Record<string, number>;
  diameter: number;
  hotSpots: string[];
}

// ponytail: regex call-graph, O(n) scan; replace with code-graph AST when parser ready
function extractCallGraph(source: string): { nodes: string[]; edges: [string, string][] } {
  try {
    const cg = (
      globalThis as unknown as {
        __codeGraph?: { parse: (s: string) => { nodes: string[]; edges: [string, string][] } };
      }
    ).__codeGraph;
    if (cg) return cg.parse(source);
  } catch {
    /* fallback */
  }

  const funcRe =
    /(?:function\s+(\w+)\s*\(|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(.*?\)\s*=>|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?function\s*\()/g;
  const funcs: { name: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = funcRe.exec(source))) {
    const name = m[1] ?? m[2] ?? m[3];
    if (name) funcs.push({ name, index: m.index });
  }
  funcs.sort((a, b) => a.index - b.index);
  const nodes = funcs.map(f => f.name);
  const nodeSet = new Set(nodes);
  const edges: [string, string][] = [];

  for (let i = 0; i < funcs.length; i++) {
    const funcStart = funcs[i].index;
    const openIdx = source.indexOf('{', funcStart);
    let body: string;
    if (openIdx !== -1) {
      let depth = 0;
      let closeIdx = -1;
      for (let j = openIdx; j < source.length; j++) {
        if (source[j] === '{') depth++;
        else if (source[j] === '}') {
          depth--;
          if (depth === 0) {
            closeIdx = j;
            break;
          }
        }
      }
      if (closeIdx !== -1) body = source.slice(openIdx, closeIdx + 1);
      else body = source.slice(openIdx);
    } else {
      const end = i + 1 < funcs.length ? funcs[i + 1].index : source.length;
      body = source.slice(funcStart, end);
    }
    const callRe = /\b(\w+)\s*\(/g;
    let cm: RegExpExecArray | null;
    const seen = new Set<string>();
    while ((cm = callRe.exec(body))) {
      const callee = cm[1];
      if (
        ['if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'await', 'async'].includes(
          callee
        )
      )
        continue;
      if (nodeSet.has(callee) && !seen.has(callee)) {
        seen.add(callee);
        edges.push([funcs[i].name, callee]);
      }
    }
  }
  return { nodes, edges };
}

export function analyzeSource(source: string, entry?: string): AnalyzeResult {
  const { nodes, edges } = extractCallGraph(source);
  const adj = buildAdj(nodes, edges);
  const e = entry ?? nodes[0] ?? '';
  const reachableFromEntry = e ? bfsReachable(adj, e) : [];
  const cent = centrality(nodes, edges);
  const diaRaw = diameter(nodes, adj);
  // JSON has no Infinity: -1 means disconnected graph (qwalk sentinel is Infinity)
  const dia = Number.isFinite(diaRaw) ? diaRaw : -1;
  const hs = hotSpots(cent);
  return { nodes, edges, reachableFromEntry, centrality: cent, diameter: dia, hotSpots: hs };
}

export function analyze(opts: { file: string; entry?: string }): AnalyzeResult {
  const resolved = assertInsideRoot(opts.file);
  const source = fs.readFileSync(resolved, 'utf8');
  return analyzeSource(source, opts.entry);
}
