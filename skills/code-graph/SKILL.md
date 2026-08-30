---
name: code-graph
description: AST/CFG/DFG extraction for JavaScript/TypeScript using Tree-sitter
version: 0.1.0
author: qwispr
license: MIT
dependencies:
  - tree-sitter
  - tree-sitter-javascript
  - tree-sitter-typescript
exports:
  - parse
  - extractCFG
  - extractDFG
cli:
  - code-graph
---

# code-graph Skill

Language-agnostic code graph extraction using Tree-sitter.

## Commands

### `qwispr code-graph --file <path> --format json`

Outputs control flow graph and data flow graph for a source file.

**Output format:**
```json
{
  "cfg": {
    "nodes": [{"id": 0, "type": "block", "start": 1, "end": 5, "text": "..."}],
    "edges": [{"from": 0, "to": 1, "type": "branch"}]
  },
  "dfg": {
    "nodes": [{"id": 0, "name": "x", "type": "variable"}],
    "edges": [{"from": 0, "to": 1, "type": "def-use"}]
  },
  "meta": {"file": "path", "language": "typescript", "lines": 100}
}
```