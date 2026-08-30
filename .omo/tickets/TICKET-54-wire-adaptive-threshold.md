# TICKET-54: Wire adaptive threshold — orchestrateAdaptive como default

**Status:** ready-for-agent
**Bloquea:** 51 (QAOA debe funcionar para que adaptive tenga sentido quantum)
**Estimado:** 0.3 día
**Severidad review:** CRITICAL (Quality #3, Context #3)

## Qué entregar
- `src/cli/orchestrator.ts`: cambiar `orchestrate()` → `orchestrateAdaptive()` (o hacer `orchestrate` llame a `getAdaptiveThreshold()` internamente). `QWISPR_TELEMETRY=1` ya escribe telemetry; ahora routing debe leer `readRecent(100)` y ajustar threshold 4 → [2,8] según heurística (quantum 2× más lento sin ganancia → sube).
- Alternativa válida ponytail: si no se quiere adaptive, borrar `telemetry.ts`+`getAdaptiveThreshold`+`orchestrateAdaptive` y documentar threshold fijo — pero entonces actualizar `TICKET-42` docs y tests.
- Test: simular 20 eventos quantum lentos → `getAdaptiveThreshold()>4` y routing prod usa ese valor.

## Criterios
- [ ] `QWISPR_TELEMETRY=1 QWISPR_TELEMETRY_PATH=/tmp/te.jsonl qwispr run --task analyze --file src/cli.ts` escribe 1 línea; siguiente `qwispr run --task resolve --qubo /tmp/q.json --vars 5` usa threshold adaptado (>4) no 4 fijo — verificar vía log o `hardware --list`?
- [ ] `grep -n orchestrateAdaptive src/cli/orchestrator.ts` → 1+ uso (o `getAdaptiveThreshold` dentro de `orchestrate`)
- [ ] `npx vitest run src/skills/orchestrator src/skills/learning` 3/3 pass y nuevo test adaptivo prod pass
- [ ] `npm run build` pass

## Notas ponytail
1 línea: `const thr = getAdaptiveThreshold()` antes de `nVars<=thr`. No ML. `# ponytail: adaptive threshold = heurística 2× wallMs, DB si >10k/día`
