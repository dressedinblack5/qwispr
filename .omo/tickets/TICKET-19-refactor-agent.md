# TICKET-19: Refactor Agent — Semantic Refactoring (composes QAOA)

**Owner**: Sisyphus
**Estimate**: 2 days
**Blocks**: None
**Blocked by**: 11 (real-qaoa), 02 (code-graph)

## Acceptance Criteria
- [ ] `skills/refactor-agent/SKILL.md` with proper frontmatter
- [ ] `refactor-agent.ts` — `refactor(file, goal) → Patch[]`
- [ ] Composes: code-graph (CFG/DFG) + real-qaoa (optimization)
- [ ] Goals: reduce complexity, extract function, inline, rename, dead code
- [ ] Transforms: semantics-preserving (verified by tests)
- [ ] CLI: `qwispr refactor --file src/utils.ts --goal "reduce complexity" --output patch.json`
- [ ] Unit tests: 5 refactorings verified by running tests
- [ ] Benchmark: complexity reduction vs manual

## Implementation Notes
- Encode transform sequence as permutation → QUBO
- Constraints: semantic equivalence (test passing)
- Objective: minimize complexity metric
- QAOA finds optimal transform order
- Verify: run test suite after each candidate