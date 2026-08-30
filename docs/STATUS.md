# Phase 2 Status — qwispr

All tickets 01–24 completed.

| Ticket | Title | Status |
|--------|-------|--------|
| TICKET-01 | Init project structure | ✅ |
| TICKET-02 | code-graph skill | ✅ (via analyze-agent regex fallback + qwalk) |
| TICKET-03 | problem-encoder skill | ✅ (via testgen branch-distance QUBO) |
| TICKET-04 | qaoa-agent skill | ✅ (`src/skills/qaoa-agent/qaoa.py` + `qaoa.ts`) |
| TICKET-05 | dep-agent skill | ✅ (`run --task resolve` → QAOA/classical) |
| TICKET-06 | benchmark collection | ✅ (`npm run benchmark` / `benchmark:real` / `benchmark:report`) |
| TICKET-07 | classical baseline runner | ✅ (orchestrator classical branch, brute-force n≤4) |
| TICKET-08 | quantum runner | ✅ (VQE/QAOA via PennyLane, lightning fallback) |
| TICKET-09 | comparison report generator | ✅ (`benchmark:report` → `report/index.md`, nightly artifact) |
| TICKET-10 | CI pipeline integration | ✅ (`.github/workflows/nightly.yml`) |
| TICKET-11 | grover-agent | ✅ (`src/skills/grover-agent/grover.ts`) |
| TICKET-12 | search-agent (grover/search) | ✅ (`qwispr search` / `qwispr grover`) |
| TICKET-13 | qwalk-agent | ✅ (`src/skills/qwalk-agent/qwalk.ts`) |
| TICKET-14 | analyze-agent (qwalk/analyze) | ✅ (`qwispr analyze` / `code-graph` / `qwalk`) |
| TICKET-15 | vqe-agent | ✅ (`qwispr vqe`, `src/skills/vqe-agent/vqe.py`) |
| TICKET-16 | testgen-agent (vqe/testgen) | ✅ (`qwispr testgen`) |
| TICKET-17 | refactor-agent | ✅ (`qwispr refactor`) |
| TICKET-18 | orchestrator (run/orchestrate) | ✅ (`qwispr run` / `orchestrate`) |
| TICKET-19 | hardware/backend abstraction | ✅ (`qwispr hardware` / `backend`, `QWISPR_BACKEND`/`QWISPR_DEVICE`) |
| TICKET-20 | lightning device support | ✅ (`lightning.qubit` with `default.qubit` fallback) |
| TICKET-21 | nightly workflow polish | ✅ (schedule + manual dispatch, artifact upload) |
| TICKET-22 | CLI polish + aliases | ✅ (all aliases in `src/cli.ts`, `qwispr --help`) |
| TICKET-23 | docs polish | ✅ (README Quickstart + commands + benchmarks + lightning note) |
| TICKET-24 | final verification | ✅ (build + tests green, see README) |

## Verification (2026-08-29)

- `npm run build` — pass (tsc)
- `npx vitest run` — 7/7 pass (hardware, search, refactor, orchestrator, analyze, testgen, vqe)
- `qwispr --help` — lists all commands + aliases
- `qwispr hardware --list` — shows backends + env

## Fase 3 — Productización (2026-08-29)

| Ticket | Title | Status |
|--------|-------|--------|
| TICKET-31 | MCP server `qwispr mcp` | ✅ (stdio JSON-RPC tools/list+call, 5 tools, `ponytail: manual JSON-RPC`) |
| TICKET-32 | Benchmark runner real | ✅ (`scripts/benchmark.js` BENCH_N, classical vs quantum timed, synthetic/real/report) |
| TICKET-33 | Packaging & release | ✅ (package.json files+prepublishOnly, Dockerfile node:20-slim+python+pennylane, release.yml v*) |
| TICKET-34 | Hardening | ✅ (guard.ts assertFileExists/assertSafePattern/spawnWithTimeout 30s, QWISPR_CALIBRATION, 2 guard tests) |

### Verificación Fase 3
- `npm run build` — pass tsc
- `npx vitest run` — 8 files 9 tests pass
- `BENCH_N=2 npm run benchmark` — 2 casos medidos (no hardcode), successRate 0.5, p95Ms
- `benchmark:report` — report/index.md + data.json tabla
- `echo tools/list | qwispr mcp` — 5 tools analyze/search/testgen/refactor/hardware
- `npm pack --dry-run` — README + dist/src/cli.js + 60 files
- `qwispr --help` — 8 comandos + aliases + mcp
- `qwispr search --pattern "([a-z]+)+"` — rechazado ponytail ReDoS, no cuelga
- `qwispr vqe --qubo missing.json` — `qwispr: file not found` tipado

## Fase 4 — IDE + Autotuning (2026-08-29)

| Ticket | Title | Status |
|--------|-------|--------|
| TICKET-41 | VSCode extension `qwispr-vscode` | ✅ (`extensions/vscode/` wrap MCP, 3 commands, `vsce package` / `code --install-extension`) |
| TICKET-42 | Learning loop telemetry + auto-tune | ✅ (`~/.qwispr/telemetry.jsonl` opt-in `QWISPR_TELEMETRY=1`, `getAdaptiveThreshold()` clamp 2..8) |
| TICKET-43 | QPU pilot stub + mitigation | ✅ (`src/skills/hardware/qpu.ts` dryRun/fallback, `applyReadoutMitigation` 2×2, `QWISPR_QPU_SHOTS`/`QISKIT_TOKEN`) |
| TICKET-44 | Docs site VitePress | ✅ (`docs/site/` index/commands/benchmarks/learning, `npm run docs:build` → `dist/index.html`) |

### Verificación Fase 4
- `npm run build` — pass tsc
- `npx vitest run` — 10 files 16 tests pass (incl. learning 2, qpu 5, guard 2)
- `npm --prefix extensions/vscode run build` — pass (tsc -p .)
- `QWISPR_TELEMETRY=1 qwispr run --task analyze` → `~/.qwispr/telemetry.jsonl` append 1 línea; sin env no escribe
- `QWISPR_BACKEND=ibm qwispr hardware --list` — warning + fallback simulator; `QWISPR_QPU_DRYRUN=1` → `dry-run: simulated QPU path`
- `npm run docs:build` — vitepress 1.6.4 → `docs/site/.vitepress/dist/index.html` (18K)
- `qwispr --help` — 8 comandos + mcp, `hardware --list` con qpuStatus
