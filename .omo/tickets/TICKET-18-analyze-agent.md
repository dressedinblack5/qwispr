# TICKET-18: Analyze Agent — Complexity/Reachability (composes QWalk)

**Owner**: Sisyphus
**Estimate**: 1 day
**Blocks**: None
**Blocked by**: 14 (qwalk-agent), 02 (code-graph)

## Acceptance Criteria
- [ ] `skills/analyze-agent/SKILL.md` with proper frontmatter
- [ ] `analyze-agent.ts` — `analyze(file, queries) → Metrics`
- [ ] Composes: code-graph (CFG/DFG) + qwalk-agent (quantum walk)
- [ ] Metrics: cyclomatic complexity, reachability, hot paths, dead code
- [ ] CLI: `qwispr analyze --file src/index.ts --metrics complexity,reachability`
- [ ] Output: JSON + markdown summary
- [ ] Unit tests: 5 files with known metrics
- [ ] Benchmark: vs ESLint complexity on 100 files

## Implementation Notes
- CFG → adjacency matrix
- QWalk for: diameter, hitting times, centrality
- Classical fallback for >20 nodes
- DFG for: data dependencies, dead stores
- Report: table + hot path visualization