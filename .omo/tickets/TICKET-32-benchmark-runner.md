# TICKET-32: Benchmark runner real

**Status:** ready-for-agent
**Bloquea:** none
**Estimado:** 1 día

## Qué entregar
- Reemplazar smoke scripts en package.json: `benchmark`, `benchmark:real`, `benchmark:report` con runners reales (`src/benchmarks/*` o inline node)
- Leen cases, ejecutan clásico vs quantum, miden successRate/avgMs/p95Ms, escriben results/*.json + report/index.md + report/data.json
- Soporta BENCH_N env para smoke

## Criterios
- [ ] `BENCH_N=5 npm run benchmark` genera 5 casos medidos no hardcode
- [ ] `benchmark:report` genera tabla comparativa
- [ ] `npm test` no rompe

## Notas ponytail
60 casos completos solo en nightly; BENCH_N + lightning para velocidad.
