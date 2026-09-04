---
name: refactor-agent
description: QWalk plus QML refactoring suggestions; high centrality plus low cohesion means split candidate
---

# refactor-agent — QWalk + QML refactoring suggestions
Wraps `qwalk-agent` centrality + `qml-agent` cohesion (heuristic fallback) for `qwispr refactor`.
`refactor({file, top})` → `{candidates: {file, function, score, reason}[]}` where `score = centrality * (1 - cohesion)`.
Suggests only; never auto-applies. High centrality + low cohesion = split candidate.
CLI: `qwispr refactor --file src/foo.ts [--top 5]`
Example: `qwispr refactor --file src/foo.ts --top 3` → `{candidates:[{function:"god", score:0.83, reason:"..."}]}`
