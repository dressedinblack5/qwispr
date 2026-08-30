// ponytail: classical BFS/degree approximates quantum walk metrics; swap to true QWalk when backend ready
export function bfsReachable(adj: Map<string, string[]>, entry: string): string[] {
  if (!adj.has(entry)) return [];
  const visited = new Set<string>([entry]);
  const q = [entry];
  while (q.length) {
    const cur = q.shift()!;
    for (const nb of adj.get(cur) ?? []) {
      if (!visited.has(nb)) { visited.add(nb); q.push(nb); }
    }
  }
  return [...visited];
}

export function centrality(nodes: string[], edges: [string, string][]): Record<string, number> {
  const deg = new Map<string, number>(nodes.map(n => [n, 0]));
  for (const [f, t] of edges) {
    deg.set(f, (deg.get(f) ?? 0) + 1);
    deg.set(t, (deg.get(t) ?? 0) + 1);
  }
  const max = Math.max(1, ...deg.values());
  const out: Record<string, number> = {};
  for (const n of nodes) out[n] = (deg.get(n) ?? 0) / max;
  return out;
}

export function diameter(nodes: string[], adj: Map<string, string[]>): number {
  let maxD = 0;
  for (const s of nodes) {
    const dist = new Map<string, number>([[s, 0]]);
    const q = [s];
    while (q.length) {
      const cur = q.shift()!;
      for (const nb of adj.get(cur) ?? []) {
        if (!dist.has(nb)) { dist.set(nb, dist.get(cur)! + 1); q.push(nb); }
      }
    }
    for (const d of dist.values()) if (d > maxD) maxD = d;
  }
  return maxD;
}

export function hotSpots(cent: Record<string, number>, k = 3): string[] {
  return Object.entries(cent).sort((a, b) => b[1] - a[1]).slice(0, k).map(([n]) => n);
}

export function buildAdj(nodes: string[], edges: [string, string][]): Map<string, string[]> {
  const m = new Map<string, string[]>(nodes.map(n => [n, []]));
  for (const [f, t] of edges) m.get(f)?.push(t);
  return m;
}
