# qwispr-vscode

Minimal VS Code wrapper for [qwispr](../..) — delegates to `dist/src/cli.js` (no logic duplicated).

## Build & install locally

```bash
npm run build              # at repo root — builds dist/src/cli.js
npm --prefix extensions/vscode install
npm --prefix extensions/vscode run build
npx --prefix extensions/vscode vsce package   # or: npm exec --prefix extensions/vscode vsce package
code --install-extension extensions/vscode/qwispr-vscode-0.1.0.vsix
```

Requires `vsce`: `npm i -g @vscode/vsce` if missing.

## Use

`Cmd+Shift+P` → `Qwispr: Analyze File` (webview with hotSpots), `Qwispr: Search Code` (regex+glob → quickpick), `Qwispr: Generate Tests` (VQE inputs).

Config: `qwispr.cliPath` overrides CLI path; `qwispr.backend` for future use.
