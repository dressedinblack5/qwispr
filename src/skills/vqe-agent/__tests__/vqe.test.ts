import { describe, it, expect } from 'vitest';
import { runVqe } from '../vqe';

describe('vqe', () => {
  it('finds ground state for n=2 QUBO', async () => {
    const Q = [
      [-1, 2],
      [2, -1],
    ]; // optimum -1 at 01 or 10
    const r = await runVqe({ costQubo: Q, nLayers: 2, iters: 50 });
    expect(r.bestEnergy).toBe(-1);
    expect(['01', '10']).toContain(r.bestBitstring);
    expect(r.trajectory.length).toBe(50);
  }, 30000);
});
