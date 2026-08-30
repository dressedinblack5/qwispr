# TICKET-34: Hardening

**Status:** ready-for-agent
**Bloquea:** none
**Estimado:** 0.5 día

## Qué entregar
- Validación `--file` existe, `--pattern` no ReDoS (timeout), python spawn timeout 30s + maxBuffer
- `QWISPR_CALIBRATION` env documentado
- 2 tests guardrail en skills/*

## Criterios
- [ ] `qwispr search --pattern "([a-z]+)+" --files "src/**/*.ts"` no cuelga
- [ ] `qwispr vqe --qubo missing.json` error tipado
- [ ] `npm test` 2 tests nuevos pass

## Notas ponytail
No WAF/auth hasta servicio público.
