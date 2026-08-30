# TICKET-15: QML Agent — Bug Detection / Clone Detection

**Owner**: Sisyphus
**Estimate**: 2 days
**Blocks**: 19 (ml-features)
**Blocked by**: 02 (code-graph)

## Acceptance Criteria
- [ ] `skills/qml-agent/SKILL.md` with proper frontmatter
- [ ] `qml.ts` — `classify(codeFragments, labels) → Predictions`
- [ ] Quantum kernel (QSVM) for code similarity
- [ ] Features: AST paths, token n-grams, CFG motifs
- [ ] CLI: `qwispr qml --train <dir> --predict <file> --output preds.json`
- [ ] Tasks: buggy vs clean, clone detection, pattern classification
- [ ] Unit tests: 100 labeled fragments, accuracy > random
- [ ] `npm run test:qml-agent` passes
- [ ] Benchmark: vs CodeBERT on Defects4J subset

## Implementation Notes
- Feature map: `U(x) = Π exp(i x_j H_j)` 
- Kernel: `K(x,y) = |⟨0|U†(x)U(y)|0⟩|²`
- PennyLane `qml.kernels` module
- Classical SVM on quantum kernel matrix
- NISQ-friendly: shallow circuits, few qubits