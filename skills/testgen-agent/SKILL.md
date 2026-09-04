---
name: testgen-agent
description: VQE boundary test-input generation for qwispr testgen
---

# testgen-agent — VQE boundary test generation
Wraps `vqe-agent` + AST branch-distance QUBO for `qwispr testgen`.
`generateTestInputs({file, functionName, layers})` → `{inputs: any[][], coverageHint}`.
QUBO encodes `if(x>0)` as distance `-x` (minimize → boundary), solved via VQE.
CLI: `qwispr testgen --file src/foo.ts --function myFn [--layers 2]`
Example: `qwispr testgen --file src/foo.ts --function add` → `{inputs:[[1,0]], coverageHint:"..."}`
