# TICKET-06: Benchmark Collection — 50 Real Conflicted Lockfiles

**Owner**: Sisyphus
**Estimate**: 1 day
**Blocks**: 07, 08
**Blocked by**: 01

## Acceptance Criteria
- [ ] `benchmarks/lockfiles/` — 50 `package-lock.json` files with real conflicts
- [ ] `benchmarks/index.json` — metadata per file: `{name, source, conflictType, expectedSolvable, notes}`
- [ ] Sources: GitHub repos (search: "dependency conflict", "peer dependency", "version mismatch")
- [ ] Conflict types covered:
  - [ ] Direct version conflicts (10)
  - [ ] Peer dependency mismatches (10)
  - [ ] Transitive diamond conflicts (10)
  - [ ] Optional dependency conflicts (5)
  - [ ] Cyclic dependency conflicts (5)
  - [ ] Mixed/Complex (10)
- [ ] Each lockfile verified: `npm install` fails or produces warnings
- [ ] Script: `benchmarks/collect.sh` — reproducible download + verify
- [ ] License check: all MIT/Apache-2.0/BSD (no GPL)
- [ ] `npm run test:benchmarks` validates all 50 parse + have conflicts

## Implementation Notes
- Use GitHub API or `gh` CLI to search repos
- Filter: `package-lock.json` size 10KB-500KB
- Verify conflict: `npm install 2>&1 | grep -iE "conflict|peer|eresolve|etarget"`
- Store original + expected resolution (if known from PR fixes)
- Anonymize private repo names if needed