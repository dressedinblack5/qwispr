# TICKET-07: Classical Baseline Runner

**Owner**: Sisyphus
**Estimate**: 1 day
**Blocks**: 09
**Blocked by**: 06

## Acceptance Criteria
- [ ] `benchmarks/baselines/run-classical.ts` — runs all 50 lockfiles through:
  - [ ] `npm install --legacy-peer-deps` (capture: success/fail, time, warnings)
  - [ ] `npm dedupe` + `npm install` (capture: success/fail, time, versions)
  - [ ] `pip-tools` equivalent (if Python lockfiles in future)
  - [ ] OR-Tools CP-SAT on same QUBO (from encoder) — optimal reference
- [ ] Output: `benchmarks/results/classical.json` — array of `{lockfile, solver, success, timeMs, versions, warnings}`
- [ ] Timeout: 60s per solver per lockfile
- [ ] Parallel execution: 4 workers
- [ ] CLI: `openaxe baseline --benchmarks-dir <path> --output results/classical.json`
- [ ] `npm run baseline` completes in <10 min
- [ ] Summary script: prints pass rate, median time, version bump stats per solver

## Implementation Notes
- OR-Tools: `npm install @google-cloud/ortools` or Python subprocess
- CP-SAT model: same variables/constraints as QUBO but exact solver
- Capture `npm` output via `child_process.spawn` with timeout
- Handle `npm` version differences (v7+ has stricter peer deps)
- Store raw logs for debugging