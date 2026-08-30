import * as fs from 'node:fs';
import { analyzeSource } from '../analyze-agent/analyze';

// ponytail: heuristic cohesion = 1/(1+outDegree); swap to QML classifier when qml-agent wired
function cohesionHeuristic(nodes: string[], edges: [string, string][]): Record<string, number> {
  const outDeg = new Map<string, number>(nodes.map(n => [n, 0]));
  for (const [f] of edges) outDeg.set(f, (outDeg.get(f) ?? 0) + 1);
  const out: Record<string, number> = {};
  for (const n of nodes) out[n] = 1 / (1 + (outDeg.get(n) ?? 0));
  return out;
}

export interface RefactorCandidate {
  file: string;
  function: string;
  score: number;
  reason: string;
  centrality: number;
  cohesion: number;
}
export interface RefactorResult {
  candidates: RefactorCandidate[];
}

export function refactorSource(source: string, file: string, top = 5): RefactorResult {
  const { nodes, edges, centrality: cent } = analyzeSource(source);
  if (nodes.length === 0) return { candidates: [] };
  const cohesion = cohesionHeuristic(nodes, edges);
  const outDeg = new Map<string, number>(nodes.map(n => [n, 0]));
  for (const [f] of edges) outDeg.set(f, (outDeg.get(f) ?? 0) + 1);

  const candidates: RefactorCandidate[] = nodes.map(n => {
    const c = cent[n] ?? 0;
    const coh = cohesion[n] ?? 1;
    const score = c * (1 - coh);
    const deg = outDeg.get(n) ?? 0;
    const reason =
      deg === 0
        ? `isolated (centrality ${c.toFixed(2)}, cohesion ${coh.toFixed(2)})`
        : `high centrality ${c.toFixed(2)} + low cohesion ${coh.toFixed(2)} — ${deg} callees, consider splitting`;
    return {
      file,
      function: n,
      score: Number(score.toFixed(4)),
      reason,
      centrality: c,
      cohesion: coh,
    };
  });

  candidates.sort((a, b) => b.score - a.score);
  return { candidates: candidates.slice(0, top) };
}

export function refactor(opts: { file: string; top?: number }): RefactorResult {
  const source = fs.readFileSync(opts.file, 'utf8');
  return refactorSource(source, opts.file, opts.top ?? 5);
}
