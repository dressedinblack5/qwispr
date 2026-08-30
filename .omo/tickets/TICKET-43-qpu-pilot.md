# TICKET-43: Hardware QPU pilot (stub + error mitigation)

**Status:** ready-for-agent
**Bloquea:** none (usa hardware 22)
**Estimado:** 0.5 día

## Qué entregar
- `src/skills/hardware/qpu.ts` — `getQpuStatus()`, `runQpuOrFallback(qubo, opts)` : si `QWISPR_BACKEND=ibm` y `QISKIT_TOKEN` presente intenta `qiskit-ibm-runtime` stub (python import opcional, fallback a simulator con warning si falta). Con `QWISPR_QPU_DRYRUN=1` simula QPU path sin token. Añade `applyReadoutMitigation(counts)` simple matriz 2×2 (flip 0.02) y documenta `QWISPR_QPU_SHOTS`.
- `src/skills/hardware/qpu.py` opcional stub python (try import qiskit, fallback).
- Env `QWISPR_QPU_SHOTS` (default 1024), `QWISPR_QPU_DRYRUN`, `QISKIT_TOKEN`.
- 1 test mock (sin token → fallback, dryrun → qpu path).
- README env table + `src/skills/hardware/qpu` SKILL.md.

## Criterios
- [ ] Sin token + `QWISPR_BACKEND=ibm` → warning + fallback simulator (no crash)
- [ ] `QWISPR_QPU_DRYRUN=1` simula QPU path sin token
- [ ] `applyReadoutMitigation` existe y corrige counts
- [ ] `npm run build` OK, `npm test` OK
- [ ] README documenta `QWISPR_QPU_SHOTS` / `QISKIT_TOKEN`

## Notas ponytail
Pilot solo, sin queue/cost/calibration real. `// ponytail: stub, queue/cost cuando haya tracción QPU`.
