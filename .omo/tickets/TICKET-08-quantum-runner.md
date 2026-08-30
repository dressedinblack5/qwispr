# TICKET-08: Quantum Runner — QAOA on Simulator + Validation

**Owner**: Sisyphus
**Estimate**: 1 day
**Blocks**: 09
**Blocked by**: 04, 06

## Acceptance Criteria
- [ ] `benchmarks/runners/run-quantum.ts` — runs all 50 lockfiles through:
  - [ ] `problem-encoder.encode()` → QUBO
  - [ ] `qaoa-agent.solve()` with p=1,2,3 (configurable)
  - [ ] Decode bitstring → version assignment
  - [ ] Validate: all hard constraints satisfied
  - [ ] Capture: success, time, energy, layers, shots, optimizer iterations
- [ ] Output: `benchmarks/results/quantum.json` — array of `{lockfile, layers, success, timeMs, energy, versions, valid}`
- [ ] Retry logic: 3 seeds per lockfile, keep best valid
- [ ] Fallback: if no valid after retries → mark failed, log best energy
- [ ] CLI: `openaxe quantum-run --benchmarks-dir <path> --output results/quantum.json --layers 1,2,3`
- [ ] `npm run quantum-run` completes in <30 min (simulator is fast)
- [ ] Parallel: 4 workers, each with isolated PennyLane device

## Implementation Notes
- PennyLane `default.qubit` is deterministic with seed
- Use `qml.numpy.random.seed()` for reproducibility
- Validate using encoder's constraint checker (reuse from dep-agent)
- Track best valid across seeds + layers
- Memory: QUBO matrices up to ~500×500 (fit in RAM)