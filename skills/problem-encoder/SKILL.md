---
name: problem-encoder
description: Encodes coding problems as QUBO/Ising Hamiltonians for quantum optimization
version: 0.1.0
author: qwispr
license: MIT
dependencies:
  - semver
exports:
  - encodeDependencies
  - decodeSolution
  - validateSolution
cli:
  - encode-deps
---

# problem-encoder Skill

Encodes software engineering problems as quantum optimization problems.

## Dependency Resolution → QUBO

**Variables**: One binary variable per `package@version` candidate.

**Constraints (as penalties):**
- One-hot: exactly one version per package
- Range satisfaction: version satisfies all dependents' semver ranges
- Peer compatibility: peer deps satisfied
- Deduplication: no duplicate packages

**Objective**: Minimize major version bumps + total package count.

## Commands

### `qwispr encode-deps --lockfile <path> --output qubo.json`

**Output:**
```json
{
  "qubo": [[0, -1, ...], [-1, 2, ...], ...],
  "varMap": {"pkg@1.0.0": 0, "pkg@2.0.0": 1, ...},
  "constraints": [{"type": "one-hot", "packages": ["pkg"], "weight": 1000}]
}
```