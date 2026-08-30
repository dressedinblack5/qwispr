---
name: grover-agent
description: Grover search for code pattern matching with amplitude amplification
version: 0.1.0
author: qwispr
license: MIT
dependencies: []
exports:
  - search
  - mapToFiles
  - benchmark
cli:
  - grover
---

# grover-agent Skill

Grover's algorithm for code pattern search. O(√N) oracle queries.

## Algorithm

**Oracle**: exact string match on AST node text (placeholder).
**Amplification**: Hadamard + oracle phase flip + diffusion `2|s><s|-I`, `⌊π/4 √N⌋` iterations.
**Fallback**: classical linear scan when N < 1000 (Grover overhead not worthwhile).

## Commands

### `qwispr grover --pattern <ast-pattern> --files <glob> --output results.json`

**Output:**
```json
{
  "bitstring": [1, 0, 1],
  "iterations": 6,
  "amplified": 5,
  "matches": [{"file": "src/a.ts", "line": 1}],
  "fallback": false
}
```
