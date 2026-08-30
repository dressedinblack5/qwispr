# TICKET-33: Packaging & release

**Status:** ready-for-agent
**Bloquea:** 31,32
**Estimado:** 0.5 día

## Qué entregar
- package.json `files`, `bin`, `prepublishOnly: build`
- `Dockerfile` minimal node:20-slim + python3.11 + pennylane
- `RELEASING.md`
- `.github/workflows/release.yml` tag v* → npm + docker

## Criterios
- [ ] `npm pack --dry-run` lista dist/ + README
- [ ] `docker build -t qwispr:smoke .` corre `qwispr --help`
- [ ] release.yml existe

## Notas ponytail
No homebrew/pypi hasta demanda.
