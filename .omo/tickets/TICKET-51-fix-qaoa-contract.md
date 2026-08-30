# TICKET-51: Fix QAOA contract — stdin + bitstring/energy

**Status:** ready-for-agent
**Bloquea:** nada
**Estimado:** 0.5 día
**Severidad review:** CRITICAL P0 (Goal, QA, Quality #1)

## Qué entregar
- `src/skills/qaoa-agent/qaoa.py`: soporta `--qubo -` (stdin JSON como `vqe.py:81-87`), no solo `open(args.qubo)`. Si stdin, `json.load(sys.stdin)`. Retorna `{bitstring, energy, trajectory?}` no `{h,J,offset}`. Reusar lógica `vqe.py` (brute fallback n≤10, sino QAOA ansatz IsingZZ+RZ+RX) o llamar vía `qubo_to_ising` + optimization loop. Manejar `QWISPR_LAYERS`/`QWISPR_ITERS` env sin crash (try int).
- `src/skills/qaoa-agent/qaoa.ts`: arreglar `spawnWithTimeout` para stdin, parsear stdout tipado `QaoaResult{bitstring:string, energy:number}`. Si `n≤10` fallback a brute en py, no lanzar error.
- `src/skills/qaoa-agent/__tests__/qaoa.test.ts`: 2 casos (n=2 ground truth, n=5 no crash) — evita regresión.

## Criterios
- [ ] `echo '{"Q":[[ -1,2],[2,-1]]}' | python3 src/skills/qaoa-agent/qaoa.py --qubo - --layers 1 --iters 5` retorna JSON con `bitstring` y `energy` (no FileNotFoundError, no `{h,J}`)
- [ ] `node dist/src/cli.js run --task resolve --qubo /tmp/qubo10.json --vars 10` (10x10) retorna `route:quantum` y `result.bitstring` sin crash (puede fallback brute)
- [ ] `qfispr run --task resolve --qubo /tmp/qubo2.json --vars 2` sigue `route:classical`
- [ ] `npm run build` y `npx vitest run src/skills/qaoa-agent` 2/2 pass
- [ ] `qaoa.py` maneja `QWISPR_LAYERS=foo` sin traceback (fallback a default)

## Notas ponytail
Reuse `vqe.py` get_device + brute fallback. No implementar QAOA pesado nuevo si brute cubre n≤10. `# ponytail: qaoa reuses vqe fallback, full QAOA when n>10 demanded`
