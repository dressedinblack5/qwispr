# orchestrator — hybrid classical/quantum router
`orchestrate({task, nVars, trivial})` → `{route, reason, agent}`; `nVars<=4` or trivial → classical else quantum.
Maps `resolve→qaoa-agent, search→search-agent, testgen→testgen-agent, analyze→analyze-agent, refactor→refactor-agent`.
CLI: `qwispr run --task <task> [--vars N] [--trivial] [agent args]` or `qwispr orchestrate --task <task> ...`
Example: `qwispr run --task search --pattern TODO --files "src/**/*.ts"` → `{route:"classical", agent:"search-agent", result:{hits}}`
Thresholds deterministic; `QWISPR_DEVICE` respected by quantum agents (lightning.qubit→default.qubit).
