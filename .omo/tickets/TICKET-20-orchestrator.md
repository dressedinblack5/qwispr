# TICKET-20: Hybrid Orchestrator — Auto Problem Routing

**Owner**: Sisyphus
**Estimate**: 2 days
**Blocks**: None
**Blocked by**: 11, 12, 13, 14, 15 (all algorithm agents)

## Acceptance Criteria
- [ ] `skills/orchestrator/SKILL.md` with proper frontmatter
- [ ] `orchestrator.ts` — `route(task, context) → Result`
- [ ] Routes: refactor→QAOA, search→Grover, testgen→VQE, analyze→QWalk, classify→QML
- [ ] Classical pre: problem reduction, kernel extraction
- [ ] Quantum core: algorithm agent delegation
- [ ] Classical post: validation, patch application
- [ ] CLI: `qwispr quantum-assist "optimize this function"`
- [ ] Fallback: classical if quantum unavailable/fails
- [ ] Unit tests: 10 tasks → correct routing
- [ ] Benchmark: end-to-end on 20 coding tasks

## Implementation Notes
- Task classification: LLM or rule-based
- Problem encoder per task type
- Result decoder per algorithm
- Timeout: 30s per quantum subtask
- Logging: quantum vs classical time, success