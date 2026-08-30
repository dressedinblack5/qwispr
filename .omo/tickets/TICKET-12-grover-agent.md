# TICKET-12: Grover Agent — Code Pattern Search

**Owner**: Sisyphus
**Estimate**: 2 days
**Blocks**: 16 (search-agent)
**Blocked by**: 02 (code-graph)

## Acceptance Criteria
- [ ] `skills/grover-agent/SKILL.md` with proper frontmatter
- [ ] `grover.ts` — `search(oracle, n_qubits, iterations) → bitstring`
- [ ] Oracle circuits for exact AST pattern matching
- [ ] CLI: `qwispr grover --pattern <ast-pattern> --files <glob> --output results.json`
- [ ] Handles patterns: function calls, variable declarations, imports, JSX elements
- [ ] Unit tests: 5 AST patterns on test codebase
- [ ] `npm run test:grover-agent` passes
- [ ] Benchmark: search 10K LOC codebase vs ripgrep

## Implementation Notes
- Oracle: exact match on AST node type + text
- Amplitude amplification: O(√N) queries
- Only use when oracle is cheap (O(1) circuit depth)
- Map AST nodes → qubit indices
- Return matching file:line locations