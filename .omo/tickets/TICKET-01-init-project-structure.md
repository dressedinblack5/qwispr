# TICKET-01: Initialize OpenAxe Project Structure

**Owner**: Sisyphus
**Estimate**: 1 day
**Blocks**: 02, 03, 06
**Blocked by**: None

## Acceptance Criteria
- [ ] `openaxe.json` created with workspace config
- [ ] `AGENTS.md` created with agent registry stubs
- [ ] Skill directory structure: `skills/{code-graph,problem-encoder,qaoa-agent,dep-agent}/SKILL.md`
- [ ] `package.json` with OpenAxe CLI + TypeScript + lint/test scripts
- [ ] `tsconfig.json` with strict mode
- [ ] `.github/workflows/ci.yml` skeleton (lint + typecheck)
- [ ] `README.md` with project overview
- [ ] `openaxe --help` runs without error
- [ ] `npm run lint` and `npm run typecheck` pass

## Implementation Notes
- Use OpenAxe's expected config format
- Skill stubs must have valid SKILL.md frontmatter
- Pin OpenAxe version to avoid breaking changes