# TICKET-42: Learning loop — telemetry JSONL + auto-tune

**Status:** ready-for-agent
**Bloquea:** none (usa orchestrator 20)
**Estimado:** 0.5 día

## Qué entregar
- `src/skills/learning/telemetry.ts` — append cada `qwispr run` → `{ts, task, route, nVars, wallMs, success}` en `~/.qwispr/telemetry.jsonl` (opt-in `QWISPR_TELEMETRY=1`, default off, solo local). Helpers `appendEvent`, `readRecent(n=100)`.
- `src/skills/orchestrator/orchestrator.ts` — lee últimos 100 eventos y ajusta threshold `nVars≤k`: si quantum avg >2× classical sin ganancia successRate → k++, si quantum mejor → k-- (clamp 2..8). `getAdaptiveThreshold()` + `// ponytail: JSONL + heurística, DB si >10k eventos/día`.
- `src/cli/orchestrator.ts` — wiring `appendEvent` tras cada `run` si `QWISPR_TELEMETRY=1`.
- `src/skills/learning/SKILL.md` 6 líneas.
- 1 test vitest simula 20 eventos sintéticos y verifica threshold se mueve.

## Criterios
- [ ] `QWISPR_TELEMETRY=1 qwispr run --task analyze --file src/cli.ts` deja línea en `~/.qwispr/telemetry.jsonl`
- [ ] Sin env no escribe (default off)
- [ ] Tras 20 runs sintéticos donde quantum >2× lento sin ganancia, `getAdaptiveThreshold()` >4
- [ ] `npm run build` OK, `npm test` OK
- [ ] `// ponytail: JSONL + heurística` presente

## Notas ponytail
JSONL + heurística basta, no DB/dashboard/ML.
