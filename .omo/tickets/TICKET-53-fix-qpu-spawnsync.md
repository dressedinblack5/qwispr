# TICKET-53: Fix qpu.ts — spawnSync bloqueante → spawnWithTimeout

**Status:** ready-for-agent
**Bloquea:** nada
**Estimado:** 0.3 día
**Severidad review:** CRITICAL (Quality #2)

## Qué entregar
- `src/skills/hardware/qpu.ts`: reemplazar `spawnSync` por `spawnWithTimeout` de `src/skills/hardening/guard.ts` (async, 30s timeout, maxBuffer 1MB). `result:any` → `unknown` + type guard `QpuResult`. `require("node:fs")` dentro de función → `import * as fs from "node:fs"` top-level. Manejar `ENOENT python not found` tipado.
- Verificar `src/mcp/server.ts` no se bloquea en `tools/call hardware`.

## Criterios
- [ ] `grep -n spawnSync src/skills/hardware/qpu.ts` → 0 resultados
- [ ] `grep -n "require(" src/skills/hardware/qpu.ts` → 0
- [ ] `grep -n "result:any" src/skills/hardware/qpu.ts` → 0 (usa `unknown` o `QpuResult`)
- [ ] `QWISPR_BACKEND=ibm QWISPR_QPU_DRYRUN=1 qwispr hardware --list` responde <1s sin bloquear y muestra `qpuWarning`
- [ ] `npx vitest run src/skills/hardware` 6/6 pass (qpu 5 + backend 1) + `npm run build` pass

## Notas ponytail
Reusar `guard.ts` ya existente, no nuevo wrapper. `# ponytail: reuse guard spawnWithTimeout`
