# TICKET-04: qaoa-agent Skill — PennyLane QAOA Implementation

**Owner**: Sisyphus
**Estimate**: 2 days
**Blocks**: 05, 08
**Blocked by**: 03

## Acceptance Criteria
- [ ] `skills/qaoa-agent/SKILL.md` with proper frontmatter
- [ ] `qaoa.ts` — `solve(qubo, options) → {bitstring: number[], energy: number, params: number[]}`
  - [ ] PennyLane `default.qubit` simulator backend
  - [ ] QAOA circuit: p layers (configurable, default p=2)
  - [ ] Cost Hamiltonian from QUBO: `H_C = Σ Q_ij Z_i Z_j + Σ Q_ii Z_i`
  - [ ] Mixer Hamiltonian: `H_M = Σ X_i`
  - [ ] Optimizer: COBYLA (gradient-free) + SPSA fallback
  - [ ] Shots: configurable (default 1000)
- [ ] `optimizer.ts` — shared optimizer config + callbacks
- [ ] CLI: `openaxe qaoa --qubo <qubo.json> --output result.json --layers 2`
- [ ] Unit tests: 5 QUBO fixtures (MaxCut, MIS, random) with known optima
- [ ] `npm run test:qaoa-agent` passes
- [ ] Returns best bitstring + energy + optimization trajectory

## Implementation Notes
- PennyLane `qml.qaoa` module for circuit construction
- QUBO → Ising: `x_i = (1 - Z_i)/2` substitution
- Handle sparse QUBO efficiently (only non-zero terms)
- Track best sample across shots + optimizer iterations
- Warm-start: use classical greedy solution as initial params