---
name: qml-agent
description: QML bug/clone detection via quantum kernel (QSVM) with RBF stand-in
version: 0.1.0
author: qwispr
license: MIT
dependencies:
  - pennylane
exports:
  - classify
cli:
  - qml
---

# qml-agent Skill

Quantum kernel classifier for code fragments (buggy vs clean, clone detection).

## Algorithm

**Feature map**: `U(x) = Π RY(x_j)` where `x` = normalized vector [token count, AST depth, n-gram hash buckets] → RY angles `[0,π]`
**Kernel**: `K(x,y) = |⟨0|U†(x)U(y)|0⟩|²` simulated as RBF `exp(-γ||x-y||²)` (ponytail: swap `qml.kernels` when HW needed)
**Classifier**: nearest-centroid on quantum kernel features (no sklearn)

## Commands

### `qwispr qml --train <dir> --predict <file> --output preds.json`

Train dir: JSON array or directory of source files (label inferred from `eval` presence or filename). Predict file: source file to classify.

**Output:**
```json
{
  "predictions": ["buggy", "clean", ...],
  "kernelMatrix": [[1, 0.8], [0.8, 1]]
}
```
