# Fase 4 — IDE + Autotuning (ponytail)

**Objetivo:** qwispr usable dentro del editor y que aprende de uso, sin saltar directo a QPU caro.

**No-objetivo Fase 4:** QPU real IBM/Braket a escala, docs site con hosting, marketplace publish. Dejar para Fase 5 si hay tracción.

## Estado previo
Fase 3: MCP stdio 5 tools, benchmark runner real BENCH_N, packaging npm+docker, hardening guard 30s+ReDoS, QWISPR_CALIBRATION. Build ✓ 8/9 tests ✓.

## Ladder
1. ¿Necesita existir? QPU real → no, simulador + lightning cubre 95% casos (n≤8). VSCode sí → MCP ya existe, envolverlo es 1 día.
2. ¿Existe en codebase? Reusar `src/mcp/server.ts` para VSCode, `src/skills/orchestrator/router.ts` para learning.
3. Stdlib → `vscode` API + `node:fs` para telemetría local JSONL, no DB.
4. No añadir deps: `vscode` extension API ya trae todo; telemetría en `~/.qwispr/telemetry.jsonl`.

## Tickets tracer-bullet (4, orden)

### TICKET-41 VSCode extension — `qwispr-vscode`
- **Entrega:** `extensions/vscode/` con `package.json` contributes `qwispr.analyze/search/testgen`, command palette → llama `qwispr mcp` via stdio (reuse server) o `node dist/src/cli.js`. Webview panel para `analyze` hotSpots, inline lens para `search`.
- **Criterio:** `code --install-extension qwispr-vscode-0.1.0.vsix` carga, `Cmd+Shift+P Qwispr: Analyze File` muestra centrality; `npm run build` en extension ok.
- **Skip:** Marketplace publish, web extension — `vsix` local basta.
- **Bloquea:** nada (usa 31).

### TICKET-42 Learning loop — `~/.qwispr/telemetry.jsonl` + auto-tune
- **Entrega:** `src/skills/learning/telemetry.ts` append cada `qwispr run` → `{ts, task, route, nVars, wallMs, success}`. `src/skills/orchestrator/orchestrator.ts` lee últimos 100 eventos y ajusta threshold `nVars≤4 → ≤k` si quantum >2× más lento sin ganancia.
- **Criterio:** `qwispr run --task search` deja línea en `~/.qwispr/telemetry.jsonl`; tras 20 runs sintéticos threshold se mueve; 1 test vitest simula telemetría.
- **Skip:** DB, dashboard, ML — JSONL + heurística basta. `# ponytail: JSONL + heurística, DB si >10k eventos/día`.
- **Bloquea:** 41? no.

### TICKET-43 Hardware QPU pilot (stub + error mitigation)
- **Entrega:** `src/skills/hardware/qpu.ts` pilot: si `QWISPR_BACKEND=ibm` y `QISKIT_TOKEN` presente, transpila QUBO→Qiskit via `qiskit-ibm-runtime` stub (python import opcional, fallback a simulator con warning). Añade readout mitigation simple (matrix 2×2) y documenta `QWISPR_QPU_SHOTS`.
- **Criterio:** Sin token → warning + fallback simulator (no crash); con `QWISPR_QPU_DRYRUN=1` simula QPU path; 1 test mock.
- **Skip:** Queue, cost control, real calibration — pilot solo.
- **Bloquea:** nada.

### TICKET-44 Docs site (VitePress minimal)
- **Entrega:** `docs/site/` VitePress con `index.md` (quickstart), `commands.md` (tabla README), `benchmarks.md` (gráfico report/data.json). `npm run docs:build` genera `dist-docs/`.
- **Criterio:** `npm run docs:build` → `dist-docs/index.html` existe; `npm run docs:dev` levanta 5173.
- **Skip:** Hosting (GH Pages), search algolia.
- **Bloquea:** 41,42 (para documentarlos).

## Orden + paralelismo
41 + 42 + 43 en paralelo → 44 al final.

## Riesgos ponytail
- VSCode API cambia — wrap en 1 archivo `extension.ts`, no abstraer.
- Telemetría sin consentimiento — opt-in `QWISPR_TELEMETRY=1` default off, solo local.

## Métricas go/no-go Fase 4
- Extension instalada local muestra analyze en <2s.
- Tras 20 runs, threshold auto-tune se mueve sin romper routing.
- QPU dry-run no crashea sin token.
