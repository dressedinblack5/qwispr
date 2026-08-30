# TICKET-05: dep-agent Skill — Orchestrator (Encoder → QAOA → Decoder → Patch)

**Owner**: Sisyphus
**Estimate**: 2 days
**Blocks**: 10
**Blocked by**: 03, 04

## Acceptance Criteria
- [ ] `skills/dep-agent/SKILL.md` with proper frontmatter
- [ ] `dep-agent.ts` — `resolve(lockfilePath, options) → {patchedLockfile: string, changes: Change[]}`
  - [ ] Calls `problem-encoder.encode()` → QUBO + varMap
  - [ ] Calls `qaoa-agent.solve()` → bitstring
  - [ ] Decodes bitstring via varMap → selected versions per package
  - [ ] Validates solution satisfies all hard constraints
  - [ ] Generates minimal `package-lock.json` patch (JSON Patch RFC 6902)
- [ ] CLI: `openaxe resolve-deps --lockfile <path> --output patched-lockfile.json`
- [ ] Handles QAOA failure: falls back to classical greedy + logs warning
- [ ] Unit tests: 10 lockfile fixtures → verify output valid + constraints met
- [ ] `npm run test:dep-agent` passes
- [ ] Dry-run mode: `--dry-run` shows changes without writing

## Implementation Notes
- Compose encoder + qaoa-agent via skill imports (not CLI)
- Decoder: bitstring[i]=1 → include varMap[i] in solution
- Validation: re-use encoder's constraint checker
- Patch: `fast-json-patch` for RFC 6902 ops
- Fallback: sort packages by constraint tightness, assign greedily