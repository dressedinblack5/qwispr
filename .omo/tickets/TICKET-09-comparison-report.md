# TICKET-09: Comparison Report Generator

**Owner**: Sisyphus
**Estimate**: 1 day
**Blocks**: 10
**Blocked by**: 07, 08

## Acceptance Criteria
- [ ] `benchmarks/report/generate.ts` — reads `classical.json` + `quantum.json` → `report/`
- [ ] Outputs:
  - [ ] `report/index.md` — markdown summary with tables
  - [ ] `report/index.html` — interactive HTML with charts (Chart.js)
  - [ ] `report/data.json` — merged data for further analysis
- [ ] Metrics per lockfile:
  - [ ] Classical: best solver success, time, version bumps
  - [ ] Quantum: best layer success, time, energy, version bumps
  - [ ] Delta: quantum solves where classical fails, time ratio, bump reduction
- [ ] Aggregate stats:
  - [ ] Pass rates (classical vs quantum)
  - [ ] Median/mean time ratio
  - [ ] % instances quantum-only solves
  - [ ] % instances quantum finds fewer major bumps
- [ ] Charts: scatter (classical vs quantum time), bar (pass rates), histogram (energy)
- [ ] Go/No-Go verdict: prints PASS/FAIL based on Phase 1 thresholds
- [ ] CLI: `openaxe compare --classical <path> --quantum <path> --output report/`
- [ ] `npm run compare` generates all outputs

## Implementation Notes
- Use `marked` for MD → HTML or write HTML directly
- Chart.js via CDN in HTML (no build step)
- Thresholds from plan:
  - Quantum solves ≥80% classical solves
  - Quantum solves ≥20% classical fails
  - Median quantum time ≤2x classical
  - All solutions valid
- Exit code: 0=PASS, 1=FAIL (for CI gate)