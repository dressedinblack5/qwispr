# Fase 3 — Productización qwispr (ponytail)

**Objetivo:** qwispr pasa de prototipo local a herramienta usable por otros: MCP, benchmarks reales, package.

**No-objetivo Fase 3:** VSCode extension completa, hardware real IBM/Braket, learning loop. Dejar para Fase 4 si tracción.

## Estado previo
Fase 1 (TICKET 01-10): init, code-graph regex fallback, QAOA stub/sim, dep-agent, benchmarks smoke, CI.
Fase 2 (11-24): QAOA real PennyLane, Grover, QWalk, VQE, search/testgen/analyze/refactor composition, orchestrator, hardware backend (sim/lightning/ibm/braket stub), nightly, docs. Build ✓ tests 7/7 ✓.

## Ladder (qué NO hacer)
1. ¿Necesita existir? VSCode extension → no, MCP cubre Claude/Codex/Cursor ya.
2. ¿Existe en codebase? Reusar `src/cli/*.ts` como handlers MCP, no duplicar.
3. Stdlib → `node:fs`, `child_process` para runners; `npm pack`, `docker` para publish.
4. No añadir deps: `@modelcontextprotocol/sdk` solo si el ticket lo justifica, si no stdio JSON.

## Tickets tracer-bullet (4, orden topológico)

### TICKET-31 MCP server — `qwispr mcp`
- **Entrega:** `src/mcp/server.ts` stdio JSON-RPC, expone `analyze, search, testgen, refactor, hardware` como `tools/list` + `tools/call`. Reusa `src/cli/*.ts` handlers. `qwispr mcp --stdio` arranca servidor. `skills/mcp/SKILL.md`.
- **Criterio:** `npx qwispr mcp` responde a `{"jsonrpc":"2.0","method":"tools/list"}` con 5 tools; `tools/call` para `search` devuelve hits; build pass.
- **Skip:** SDK oficial si stdio manual basta; añadir cuando cliente lo exija.
- **Bloquea:** nada.

### TICKET-32 Benchmark runner real
- **Entrega:** Reemplaza `package.json` smoke scripts (`benchmark`, `benchmark:real`, `benchmark:report`) por runners reales: leen `benchmarks/synthetic/*.json` + `benchmarks/real/*.json` (o `results/` actuales), ejecutan clásico vs quantum (QAOA/VQE/Grover), miden `successRate`, `avgMs`, `p95Ms`, escriben `results/*.json` + `report/index.md` + `report/data.json`. Soporta `BENCH_N=5` para smoke en CI.
- **Criterio:** `BENCH_N=5 npm run benchmark` genera `results/synthetic.json` con 5 casos medidos (no hardcode 1); `benchmark:report` genera tabla comparativa; `npm test` no rompe.
- **Skip:** 60 casos completos → nightly, no en PR; estadística avanzada (CI, effect size) cuando n≥20 real.
- **Bloquea:** 31? no.

### TICKET-33 Packaging & release
- **Entrega:** `npm publish` ready (`files`, `bin`, `prepublishOnly: build`), `Dockerfile` minimal (`node:20-slim` + `python:3.11-slim` + pennylane), `RELEASING.md`, GitHub Release workflow (`release.yml` tag `v*` → npm + docker + artifact).
- **Criterio:** `npm pack --dry-run` lista `dist/` + `README`; `docker build -t qwispr:smoke .` corre `qwispr --help`; `release.yml` existe.
- **Skip:** Homebrew, PyPI separado — añadir con demanda.
- **Bloquea:** 31,32 (para incluirlos).

### TICKET-34 Hardening (validación + sandbox + calibración)
- **Entrega:** Guardrails en `src/skills/*/`: valida `--file` existe y `--pattern` no ReDoS, sandbox `python` spawn con timeout 30s + `maxBuffer`, knob calibración hardware (`QWISPR_CALIBRATION` env documentado) para drifts físicos.
- **Criterio:** `qwispr search --pattern "([a-z]+)+" --files "src/**/*.ts"` no cuelga (timeout); `qwispr vqe --qubo missing.json` error tipado; `npm test` añade 2 tests de guardrail.
- **Skip:** WAF, rate-limit, auth — no es servicio público aún.
- **Bloquea:** nada, va en paralelo.

## Orden + paralelismo
31 + 32 + 34 en paralelo → 33 al final (requiere 31,32).

## Riesgos ponytail
- MCP stdio manual puede incompatibilizar con SDK → dejar `ponytail: manual JSON-RPC, migrar a @modelcontextprotocol/sdk si cliente falla`.
- Runner real lento (VQE ~3s/caso) → `BENCH_N` + `lightning.qubit` + timeout, ya bench 2-3×.

## Métricas go/no-go Fase 3
- `qwispr mcp` usable desde Claude Desktop / Codex sin cambios.
- `benchmark:real` con n≥5 casos reales <2min con lightning.
- `npm pack` + `docker build` verde.
