/** Grover amplitude amplification simulation — analytic, no quantum backend. */
export function groverIterations(n: number, m: number): number {
  if (m <= 0 || m >= n) return 0;
  return Math.round((Math.PI / 4) * Math.sqrt(n / m));
}

export function groverProbabilities(n: number, marked: boolean[], iterations?: number): number[] {
  const m = marked.filter(Boolean).length;
  if (n === 0) return [];
  if (m === 0 || m === n) return marked.map(() => 1 / n);
  const k = iterations ?? groverIterations(n, m);
  const theta = Math.asin(Math.sqrt(m / n));
  const angle = (2 * k + 1) * theta;
  const pMarked = Math.pow(Math.sin(angle), 2) / m;
  const pUnmarked = Math.pow(Math.cos(angle), 2) / (n - m);
  return marked.map((v) => (v ? pMarked : pUnmarked));
}

export function groverSearch<T>(items: T[], oracle: (x: T) => boolean, iterations?: number) {
  const marked = items.map(oracle);
  const probabilities = groverProbabilities(items.length, marked, iterations);
  let amplifiedIndex = -1;
  let maxP = -1;
  probabilities.forEach((p, i) => { if (p > maxP) { maxP = p; amplifiedIndex = i; } });
  if (marked.filter(Boolean).length === 0) amplifiedIndex = -1;
  return { amplifiedIndex, probabilities };
}
