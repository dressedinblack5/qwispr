# TICKET-56: Benchmark determinism + report completo

**Status:** ready-for-agent
**Bloquea:** 51 (QAOA fix afecta quantum runner)
**Estimado:** 0.5 día
**Severidad review:** MAJOR (Goal PARTIAL, Context #4, QA #3)

## Qué entregar
- `scripts/benchmark.js`: hacer determinístico (semilla fija LCG ya existe, fijar `ns` y `Q` generación), aumentar `runQuantum` a `--layers 2 --iters 50` o timeout 10s para que `successRate` no sea 0 nondet. `success` con tolerancia `1e-6` pero comparar con fallback brute n≤10; si `pennylane` falta, `solver: classical` no `success:true` silencioso.
- `report/index.md` + `report/data.json`: añadir 1 fila por caso (no solo 2 agregadas) o al menos `successRate` estable; `generatedAt` ya existe. Si no HTML/charts, documentar ponytail skip en README. O crear `benchmarks/README.md` explicando synthetic vs real y `BENCH_N`.
- O crear `benchmarks/case-*.json` con 5 casos fijos si `BENCH_N` sin `benchmarks/` dir.

## Criterios
- [ ] `BENCH_N=2 npm run benchmark` 2 corridas sucesivas → mismo `successRate` (determinístico, no 0→1 random)
- [ ] `BENCH_N=2 npm run benchmark && BENCH_N=2 npm run benchmark:real && npm run benchmark:report` genera `report/index.md` con tabla y `report/data.json` con `generatedAt` y `cases.length===4`
- [ ] `scripts/benchmark.js` usa `--layers 2 --iters 50` o documenta `--iters 20` low success esperado — `report` no miente
- [ ] `npm run build` y `npx vitest run` siguen pass

## Notas ponytail
No crear 50 casos reales; 5 fijos con semilla basta. `# ponytail: 5 deterministic QUBOs, 50 reales when dataset ready`
