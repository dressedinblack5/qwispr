# TICKET-14: QWalk Agent — Call Graph Analysis

**Owner**: Sisyphus
**Estimate**: 2 days
**Blocks**: 18 (analyze-agent)
**Blocked by**: 02 (code-graph)

## Acceptance Criteria
- [ ] `skills/qwalk-agent/SKILL.md` with proper frontmatter
- [ ] `qwalk.ts` — `analyze(cfg, queries) → Metrics`
- [ ] Quantum walk for: reachability, centrality, diameter
- [ ] Queries: `reachable(from, to)`, `betweenness(node)`, `diameter()`
- [ ] CLI: `qwispr qwalk --file <path> --query <type> --output metrics.json`
- [ ] Quadratic speedup on graph diameter vs BFS
- [ ] Unit tests: 5 CFGs with known metrics
- [ ] `npm run test:qwalk-agent` passes

## Implementation Notes
- Adjacency matrix → walk operator
- Szegedy's quantum walk for hitting time
- Use PennyLane `qml.QubitUnitary` for walk steps
- Limited to ≤20 qubits (simulator)
- Hybrid: classical preprocessing, quantum core