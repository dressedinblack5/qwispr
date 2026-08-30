# TICKET-13: VQE Agent — Test Input Generation

**Owner**: Sisyphus
**Estimate**: 2 days
**Blocks**: 17 (testgen-agent)
**Blocked by**: 02 (code-graph), 04 (qaoa-agent)

## Acceptance Criteria
- [ ] `skills/vqe-agent/SKILL.md` with proper frontmatter
- [ ] `vqe.ts` — `generateInputs(targetFunction, coverageTarget) → TestCase[]`
- [ ] Variational circuit for high-dimensional input space
- [ ] Cost function: branch coverage + path diversity
- [ ] CLI: `qwispr vqe --file <path> --function <name> --coverage 0.9 --output tests.json`
- [ ] Supports: primitive args, objects, arrays, async functions
- [ ] Unit tests: 5 functions with known hard-to-reach branches
- [ ] `npm run test:vqe-agent` passes
- [ ] Benchmark: vs AFL/fuzz on 10 functions

## Implementation Notes
- Parameterized circuit: RY(θ) rotations per input dimension
- Cost: negative branch coverage (minimize)
- Optimizer: COBYLA/SPSA
- Decode: measurement → concrete input values
- Validate: run generated tests, check coverage