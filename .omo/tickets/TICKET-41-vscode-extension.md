# TICKET-41: VSCode extension — qwispr-vscode

**Status:** ready-for-agent
**Bloquea:** 31 (MCP server)
**Estimado:** 1 día

## Qué entregar
- `extensions/vscode/` con `package.json` contributes `qwispr.analyze/search/testgen`, command palette → llama `qwispr mcp` via stdio (reuse `src/mcp/server.ts`) o `node dist/src/cli.js`. Webview panel para `analyze` hotSpots, inline para `search`.
- `extensions/vscode/src/extension.ts` — 1 archivo wrap, activationEvents `onStartupFinished`.
- `extensions/vscode/README.md` install local `vsix`.

## Criterios
- [ ] `extensions/vscode/package.json` existe con contributes commands `qwispr.analyze`, `qwispr.search`, `qwispr.testgen`
- [ ] `extensions/vscode/src/extension.ts` llama `analyze`/`search` via `src/skills/*` o `src/mcp/server.ts` (no duplicar lógica)
- [ ] `npm run build` raíz sigue OK (extension build aislado)
- [ ] `qwispr --help` no roto
- [ ] `extensions/vscode/README.md` documenta `vsce package` / `code --install-extension *.vsix`

## Notas ponytail
Wrap en 1 archivo `extension.ts`, no abstraer. `vsix` local basta, no marketplace. Reusar `src/mcp/server.ts` o `src/skills/*` directo.
