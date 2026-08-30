# Review Fixes — qwispr (post-review 2026-08-29)

**Objetivo:** pasar Review FAILED → PASSED arreglando 2 P0 bloqueantes + 3 CRITICAL + CVEs sin re-arquitectura.

**Origen:** 5-agente review (Goal FAIL, QA FAIL, Quality FAIL, Security FAIL, Context FAIL). Runtime PASS, dev FAIL.

**No-objetivo:** re-escribir QAOA pesado, benchmarks 50 casos reales completos, docs HTML charts full — ponytail minimal fixes que desbloquean publish.

## Tickets tracer-bullet (9, orden)

| Ticket | Bloquea | Entrega |
|---|---|---|
| 51 fix-qaoa-contract | — | qaoa.py stdin+bitstring/energy |
| 52 fix-testgen-typed | — | testgen regex TS typed + escape fn |
| 53 fix-qpu-spawnsync | — | qpu.ts spawnWithTimeout + import |
| 57 security-hardening-search-guard | — | jail glob + ReDoS hardening |
| 58 dev-cve-bump | — | vitest/vite bump + audit |
| 54 wire-adaptive-threshold | 51 | cli/orchestrator → orchestrateAdaptive |
| 55 strict-ts-cleanup | 51,52,53 | any→unknown, require→import, NaN/JSON guards |
| 56 benchmark-determinism-report | 51 | determinismo + report completo |
| 59 docker-ci-git | 58 | Dockerfile qpu.py + ci.yml + git init |

**Topo order:** 51,52,53,57,58 → 54,55,56 → 59
**Paralelismo máx:** 5 (51+52+53+57+58) → 3 (54+55+56) → 1 (59)
**Estimado:** 1-2 días ponytail (cada ticket 0.5-1 día, total 4-6h hacks pequeños)
