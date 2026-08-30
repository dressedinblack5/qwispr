import * as fs from 'node:fs';
import { bfsReachable, centrality, diameter, hotSpots, buildAdj } from '../qwalk-agent/qwalk';

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
  // try code-graph if available
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
  // also match `function foo()` without const
  funcs.sort((a, b) => a.index - b.index);
  const nodes = funcs.map(f => f.name);
  const nodeSet = new Set(nodes);
  const edges: [string, string][] = [];

  // slice body for each function: from its index to next function index (or end)
  for (let i = 0; i < funcs.length; i++) {
    const start = funcs[i].index;
    const end = i + 1 < funcs.length ? funcs[i + 1].index : source.length;
    const body = source.slice(start, end);
    // find calls: word followed by '(' not preceded by 'function' or '=>'
    const callRe = /\b(\w+)\s*\(/g;
    let cm: RegExpExecArray | null;
    const seen = new Set<string>();
    while ((cm = callRe.exec(body))) {
      const callee = cm[1];
      if (callee === funcs[i].name) continue; // skip self definition match
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
  const dia = diameter(nodes, adj);
  const hs = hotSpots(cent);
  return { nodes, edges, reachableFromEntry, centrality: cent, diameter: dia, hotSpots: hs };
}

export function analyze(opts: { file: string; entry?: string }): AnalyzeResult {
  const source = fs.readFileSync(opts.file, 'utf8');
  return analyzeSource(source, opts.entry);
}
