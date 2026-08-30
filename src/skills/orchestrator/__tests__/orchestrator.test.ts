import { describe, it, expect } from 'vitest';
import { orchestrate } from '../orchestrator';

describe('orchestrator', () => {
  it('routes trivial/small to classical and larger to quantum', () => {
    const small = orchestrate({ task: 'resolve', nVars: 2 });
    expect(small.route).toBe('classical');
    expect(small.agent).toBe('qaoa-agent');

    const trivial = orchestrate({ task: 'search', nVars: 100, trivial: true });
    expect(trivial.route).toBe('classical');

    const large = orchestrate({ task: 'resolve', nVars: 10 });
    expect(large.route).toBe('quantum');
    expect(large.agent).toBe('qaoa-agent');

    const searchLarge = orchestrate({ task: 'search', nVars: 20 });
    expect(searchLarge.route).toBe('quantum');
    expect(searchLarge.agent).toBe('search-agent');
  });
});
