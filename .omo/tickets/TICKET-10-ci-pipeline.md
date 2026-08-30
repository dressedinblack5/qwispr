# TICKET-10: CI Pipeline Integration

**Owner**: Sisyphus
**Estimate**: 1 day
**Blocks**: None (final)
**Blocked by**: 05, 09

## Acceptance Criteria
- [ ] `.github/workflows/ci.yml` with jobs:
  - [ ] `lint` — `npm run lint` (ESLint + Prettier)
  - [ ] `typecheck` — `npm run typecheck` (tsc --noEmit)
  - [ ] `test` — `npm run test` (all unit tests)
  - [ ] `smoke` — runs 5 lockfile subset through full pipeline (encoder→QAOA→decoder→validate) — must pass
  - [ ] `benchmark` — **manual dispatch only** — runs full 50-case pipeline, uploads `report/` as artifact
- [ ] Smoke test: 5 curated lockfiles in `benchmarks/smoke/` (fast, diverse)
- [ ] Benchmark job: `if: github.event_name == 'workflow_dispatch'` + timeout 60 min
- [ ] Artifact retention: 30 days for reports
- [ ] Badge: README shows CI status + benchmark pass rate (from latest artifact)
- [ ] Dependabot: weekly npm updates + auto-merge patch
- [ ] `npm run ci:smoke` runs locally (subset)
- [ ] `npm run ci:full` runs locally (full, ~30 min)

## Implementation Notes
- GitHub Actions: `ubuntu-latest`, Node 20, cache `~/.npm` + `node_modules`
- PennyLane simulator is pure Python — need Python 3.11 + `pip install pennylane` in CI
- Use `actions/setup-python` + `pip cache`
- Smoke test fixtures: copy 5 from benchmarks/lockfiles/ to benchmarks/smoke/
- Full benchmark downloads artifacts from previous run for comparison tracking