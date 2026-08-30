---
name: qaoa-agent
description: QAOA implementation using PennyLane for combinatorial optimization
version: 0.1.0
author: qwispr
license: MIT
dependencies:
  - pennylane
  - numpy
exports:
  - solveQAOA
  - QAOAOptions
  - QAOAResult
cli:
  - qaoa
---

# qaoa-agent Skill

Quantum Approximate Optimization Algorithm for QUBO problems.

## Algorithm

**Cost Hamiltonian**: `H_C = Σ Q_ij Z_i Z_j + Σ Q_ii Z_i` (from QUBO matrix)
**Mixer Hamiltonian**: `H_M = Σ X_i`
**Ansatz**: `|ψ(γ,β)⟩ = Π_{l=1}^p e^{-iβ_l H_M} e^{-iγ_l H_C} |+⟩^⊗n`

**Optimization**: COBYLA (gradient-free) with SPSA fallback.

## Commands

### `qwispr qaoa --qubo <qubo.json> --output result.json --layers 2 --shots 1000`

**Output:**
```json
{
  "bitstring": [1, 0, 1, 0, ...],
  "energy": -42.5,
  "params": {"gammas": [...], "betas": [...]},
  "trajectory": [{"iteration": 0, "energy": -10.2}, ...],
  "metadata": {"layers": 2, "shots": 1000, "optimizer": "COBYLA", "timeMs": 1500}
}
```