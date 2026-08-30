# TICKET-44: Docs site (VitePress minimal)

**Status:** ready-for-agent
**Bloquea:** 41, 42 (para documentarlos)
**Estimado:** 0.5 día

## Qué entregar
- `docs/site/` VitePress minimal: `package.json`, `.vitepress/config.ts`, `index.md` (quickstart), `commands.md` (tabla README + 41 extension), `benchmarks.md` (gráfico report/data.json + 42 learning), `learning.md` opcional.
- `package.json` scripts `docs:dev`, `docs:build` (o `docs/site/package.json`).
- `npm run docs:build` genera `docs/site/.vitepress/dist/` o `dist-docs/`.

## Criterios
- [ ] `docs/site/.vitepress/config.ts` existe
- [ ] `docs/site/index.md` quickstart + link commands/benchmarks
- [ ] `npm run docs:build` (o `npm --prefix docs/site run build`) genera `index.html`
- [ ] `npm run build` raíz sigue OK
- [ ] README linka docs site si existe

## Notas ponytail
Sin hosting GH Pages ni algolia. `vitepress` como devDependency raíz o en `docs/site`. Minimal — 3 páginas.
