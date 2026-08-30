# TICKET-03: problem-encoder Skill — npm Lockfile → QUBO Encoder

**Owner**: Sisyphus
**Estimate**: 2 days
**Blocks**: 04, 05
**Blocked by**: 01

## Acceptance Criteria
- [ ] `skills/problem-encoder/SKILL.md` with proper frontmatter
- [ ] `dep-encoder.ts` — `encode(lockfilePath) → {qubo: number[][], varMap: Map<string,number>, constraints: Constraint[]}`
- [ ] Variables: one per `package@version` candidate (from lockfile `dependencies` + `optionalDependencies`)
- [ ] Constraints encoded as QUBO penalties:
  - [ ] Exactly one version per package (one-hot)
  - [ ] Version satisfies all dependents' range requirements
  - [ ] Peer dependency compatibility
  - [ ] No duplicate packages (deduplication)
- [ ] Objective: minimize major version bumps + minimize total packages
- [ ] CLI: `openaxe encode-deps --lockfile <path> --output qubo.json`
- [ ] Unit tests: 10 lockfile fixtures (simple, conflicts, peer deps, optional, cyclic)
- [ ] `npm run test:problem-encoder` passes
- [ ] Round-trip: decode QUBO solution → valid `package-lock.json` patch

## Implementation Notes
- Parse `package-lock.json` v2/v3 format
- Use `semver` for range checking
- QUBO matrix: `n_variables × n_variables` (sparse → dense for PennyLane)
- Variable mapping: `pkg@ver` → index (persist in varMap for decoding)
- Penalty weights: tune so hard constraints >> objective