# Releasing qwispr

1. `npm run build && npm test` — must pass
2. `npm version patch|minor|major` — bumps 0.1.0, creates tag v*
3. `git push --follow-tags` — pushes commit + tag
4. Tag `v*` triggers `.github/workflows/release.yml`
5. Workflow: `npm ci` → `npm run build` → `npm publish` → `docker build` → push ghcr.io
6. Check release at `https://github.com/<org>/quantna/releases` + npm + ghcr.io
7. `NODE_AUTH_TOKEN` + `GITHUB_TOKEN` required in repo secrets
8. Rollback: `npm deprecate` + delete tag `git push --delete origin vX.Y.Z`

## Branch protection

- `main` is protected: require PR + CI green (`lint`, `typecheck`, `test`, `bench-smoke`) before merge.
- Enable in GitHub: Settings → Branches → Add rule → Branch name `main` → Require status checks → select `lint`, `typecheck`, `test`, `bench-smoke` → Require pull request reviews (1).
- `workflow_dispatch` with `full:true` runs 60-case benchmark; nightly runs full suite.
