# TICKET-11: Real PennyLane QAOA Implementation

**Owner**: Sisyphus
**Estimate**: 2 days
**Blocks**: 12, 13
**Blocked by**: 04 (MVP QAOA)

## Acceptance Criteria
- [ ] `src/skills/qaoa-agent/qaoa.py` uses real PennyLane QAOA (not simulated annealing)
- [ ] Proper parameter-shift gradient for optimizer
- [ ] COBYLA/SPSA optimizers from PennyLane
- [ ] Configurable layers (p=1,2,3), shots (100-10000)
- [ ] Returns trajectory, best params, bitstring, energy
- [ ] Unit tests: MaxCut, random QUBO with known optima
- [ ] `npm run test:qaoa-agent` passes
- [ ] Benchmark: compare real vs simulated on 60 lockfiles

## Implementation Notes
- Use `qml.qaoa` module for circuit construction
- QUBO → Ising: `x_i = (1 - Z_i)/2` substitution
- `default.qubit` simulator with shots
- Gradient: parameter-shift rule
- Handle sparse QUBO efficiently