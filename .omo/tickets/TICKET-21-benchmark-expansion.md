# TICKET-21: Benchmark Expansion — Real Codebases

**Owner**: Sisyphus
**Estimate**: 1 day
**Blocks**: None
**Blocked by**: 06 (benchmark collection)

## Acceptance Criteria
- [ ] `benchmarks/real/` — 20 real npm packages with conflicts
- [ ] Sources: GitHub `npm install` failures, Dependabot PRs
- [ ] `benchmarks/collect-real.sh` — reproducible collection
- [ ] `benchmarks/validate-real.sh` — verify conflicts
- [ ] `benchmarks/suites/` — task suites: resolve, refactor, search, testgen
- [ ] CI: `npm run benchmark:real` runs full suite
- [ ] Report: comparison with synthetic benchmarks

## Implementation Notes
- Search: `gh api search/code?q="ERESOLVE" --jq '.items[].repository.full_name'`
- Clone, `npm install`, capture lockfile
- Filter: 10KB-500KB, MIT/Apache/BSD license
- Anonymize private names if needed