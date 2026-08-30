# TICKET-17: TestGen Agent — Test Generation (composes VQE)

**Owner**: Sisyphus
**Estimate**: 1 day
**Blocks**: None
**Blocked by**: 13 (vqe-agent), 02 (code-graph)

## Acceptance Criteria
- [ ] `skills/testgen-agent/SKILL.md` with proper frontmatter
- [ ] `testgen-agent.ts` — `generateTests(file, function, targetCoverage) → TestFile`
- [ ] Composes: code-graph (CFG) + vqe-agent (variational inputs)
- [ ] Outputs: Jest/Mocha test file with assertions
- [ ] Handles: sync/async, sync/async, promises, callbacks
- [ ] CLI: `qwispr testgen --file src/utils.ts --function parseDate --coverage 0.9`
- [ ] Unit tests: 5 functions → valid test files
- [ ] Benchmark: coverage achieved vs manual tests

## Implementation Notes
- Extract CFG → identify uncovered branches
- VQE generates inputs for each uncovered branch
- Generate assertions from return values / side effects
- Template: `expect(fn(input)).toBe(expected)`
- Merge multiple inputs per test case