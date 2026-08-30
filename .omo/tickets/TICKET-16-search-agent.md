# TICKET-16: Search Agent — Code Pattern Search (composes Grover)

**Owner**: Sisyphus
**Estimate**: 1 day
**Blocks**: None
**Blocked by**: 12 (grover-agent), 02 (code-graph)

## Acceptance Criteria
- [ ] `skills/search-agent/SKILL.md` with proper frontmatter
- [ ] `search-agent.ts` — `search(pattern, files) → Matches[]`
- [ ] Composes: code-graph (AST) + grover-agent (quantum search)
- [ ] Patterns: function name, call signature, JSX component, import path
- [ ] CLI: `qwispr search "React.useState" --type call --output matches.json`
- [ ] Returns: file, line, column, matched text, context
- [ ] Unit tests: 5 pattern types on test codebase
- [ ] Benchmark: vs ripgrep on 100K LOC

## Implementation Notes
- Parse pattern → AST query
- Encode AST nodes as oracle
- Grover iterations: π/4 √N
- Decode results → source locations
- Fallback: classical if N < 1000