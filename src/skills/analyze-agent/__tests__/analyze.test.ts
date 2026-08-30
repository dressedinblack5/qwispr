import { describe, it, expect } from 'vitest';
import { analyzeSource } from '../analyze';

describe('analyze', () => {
  it('builds call graph and computes centrality', () => {
    const src = `
      function main(){ a(); b(); }
      function a(){ b(); }
      function b(){}
    `;
    const r = analyzeSource(src, 'main');
    expect(r.nodes).toEqual(expect.arrayContaining(['main', 'a', 'b']));
    expect(r.edges).toEqual(
      expect.arrayContaining([
        ['main', 'a'],
        ['main', 'b'],
        ['a', 'b'],
      ])
    );
    expect(r.reachableFromEntry).toEqual(expect.arrayContaining(['main', 'a', 'b']));
    expect(r.centrality.main).toBeGreaterThan(0);
    expect(r.centrality.b).toBeGreaterThan(0);
    expect(r.diameter).toBeGreaterThanOrEqual(1);
    expect(r.hotSpots.length).toBeGreaterThan(0);
    expect(r.hotSpots).toContain('main');
  });
});
