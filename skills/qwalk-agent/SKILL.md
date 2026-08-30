---
name: qwalk-agent
description: Szegedy quantum walk for call graph analysis — reachability, centrality, diameter
version: 0.1.0
author: qwispr
license: MIT
dependencies:
  - pennylane
  - numpy
exports:
  - analyze
cli:
  - qwalk
---

# qwalk-agent Skill

Szegedy quantum walk stub for CFG analysis. Classical BFS/Brandes/Floyd wrapped as quantum walk with Hadamard coin unitary `qml.QubitUnitary`.

## Algorithm

**Coin**: Hadamard `H` on coin register
**Shift**: `S` from adjacency matrix via `qml.QubitUnitary`
**Walk**: `U = S · (C ⊗ I)` truncated to 10 steps — honest stub, classical fallback for n>20.

## Commands

### `qwispr qwalk --file <path> --query <type> --output metrics.json`

Queries: `reachable(from,to)`, `betweenness(node)`, `diameter()`

**Output:**
```json
{
  "metrics": {"reachable": true, "centrality": {"B": 0.5}, "diameter": 2}
}
```
