---
name: dep-agent
description: Orchestrates dependency resolution via quantum optimization
version: 0.1.0
author: qwispr
license: MIT
dependencies:
  - problem-encoder
  - qaoa-agent
  - fast-json-patch
exports:
  - resolveDependencies
  - DependencyResolutionOptions
  - ResolutionResult
cli:
  - resolve-deps
---

# dep-agent Skill

End-to-end dependency conflict resolution using quantum optimization.

## Pipeline

1. **Encode**: `problem-encoder.encodeDependencies(lockfile)` → QUBO + varMap
2. **Solve**: `qaoa-agent.solveQAOA(qubo)` → bitstring
3. **Decode**: Map bitstring → selected versions per package
4. **Validate**: Check all hard constraints satisfied
5. **Patch**: Generate RFC 6902 JSON Patch for `package-lock.json`

## Commands

### `qwispr resolve-deps --lockfile <path> --output patched-lockfile.json [--dry-run]`

**Output:** Patched `package-lock.json` with resolved versions.

**Fallback**: If QAOA fails or returns invalid solution → classical greedy + warning.