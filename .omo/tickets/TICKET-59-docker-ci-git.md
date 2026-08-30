# TICKET-59: Dockerfile qpu.py + ci.yml + git init

**Status:** ready-for-agent
**Bloquea:** 58 (audit debe pasar antes de CI verde)
**Estimado:** 0.3 día
**Severidad review:** MINOR (Context #6,7, Dockerfile gap)

## Qué entregar
- `Dockerfile`: añadir `COPY src/skills/hardware/qpu.py dist/src/skills/hardware/` (o a `src/skills/hardware/` en imagen) junto a `qaoa.py`/`vqe.py`. Verificar `docker build` incluye qpu.
- `.github/workflows/ci.yml`: jobs `lint` (tsc --noEmit), `typecheck`, `test` (vitest), `bench-smoke` (BENCH_N=2), `report` artifact, `workflow_dispatch` con input `full:true` para 60 casos. Cache npm+pip. Branch protection doc en `RELEASING.md` o `docs/`.
- `git init` si no existe + `git add . && git commit -m "chore: review fixes baseline"` para trazabilidad `git log/blame`.
- `requirements.txt` con `pennylane==0.45.1 --hash` (o pinned) si existe python deps.

## Criterios
- [ ] `grep -q qpu.py Dockerfile` → 1 y `docker build --dry-run` o `cat Dockerfile` muestra COPY qpu
- [ ] `.github/workflows/ci.yml` existe con jobs lint/typecheck/test/bench-smoke y `workflow_dispatch` input `full`
- [ ] `git log --oneline -1` existe y `git status` clean
- [ ] `npm run build` y `npx vitest run` pass tras init

## Notas ponytail
`git init` solo si no existe .git; no re-escribir historia. Single stage Dockerfile sigue.
