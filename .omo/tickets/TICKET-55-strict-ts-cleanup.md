# TICKET-55: Strict TS cleanup — any→unknown, require→import, NaN/JSON guards

**Status:** ready-for-agent
**Bloquea:** 51,52,53
**Estimado:** 0.5 día
**Severidad review:** MAJOR (Quality #4,5)

## Qué entregar
- Reemplazar `any` por `unknown` + narrowing en `src/mcp/server.ts:52,73,94`, `src/skills/hardware/qpu.ts:43`, `src/skills/testgen-agent/testgen.ts:4 inputs:any`, `src/skills/hardening/guard.ts:62`, `src/skills/analyze-agent/analyze.ts:17`. `import * as fs from "node:fs"` en `vqe.ts:17`, `qaoa.ts:9`, `qpu.ts:55`.
- Guards: `cli.ts:101 JSON.parse` con try/catch → `qwispr: invalid JSON in ...`; `cli.ts:96` y `cli/*.ts` `parseInt` con `Number.isNaN` → `qwispr: invalid --top/--layers/--iters`; `vqe.py:91 int(os.environ.get(...))` con try → fallback default sin traceback; `cli.ts:125 main().catch(e=>e instanceof Error ? e.message : String(e))`.
- `QWISPR_CALIBRATION` dead code: o wire `getCalibration()` a multiplicador post-hoc en `vqe.py`/`qaoa.py` energías/timings, o eliminar export y docs claim.

## Criterios
- [ ] `grep -rn ": any" src --include="*.ts" | grep -v "node_modules" | grep -v "// ponytail"` → 0 (o solo en test mocks)
- [ ] `grep -rn "require(" src --include="*.ts"` → 0
- [ ] `node dist/src/cli.js search --pattern TODO --files "src/**/*.ts" --top foo` → `qwispr: invalid --top: foo` exit 1 no crash NaN
- [ ] `echo '{bad json' > /tmp/bad.json && node dist/src/cli.js vqe --qubo /tmp/bad.json` → `qwispr: invalid JSON` no SyntaxError stack
- [ ] `QWISPR_LAYERS=foo python3 src/skills/vqe-agent/vqe.py --qubo /tmp/q.json` no traceback
- [ ] `npm run build` (tsc --noEmit) y `npx vitest run` 10/10 pass, `npx tsc --noEmit --strict` 0 errors

## Notas ponytail
No añadir `eslint` nuevo si no existe; `unknown` + guard es 1 línea cada.
