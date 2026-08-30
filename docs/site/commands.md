# Commands

## CLI

| Command | Alias | Description |
|---------|-------|-------------|
| `qwispr analyze --file <path> [--entry <name>]` | `code-graph`, `qwalk` | Call-graph + QWalk metrics (reachability, centrality, diameter, hotSpots) |
| `qwispr search --pattern <regex> --files <glob> [--top 10]` | `grover` | Grover-ranked code search (regex + glob, amplified ranking) |
| `qwispr vqe --qubo <file> [--layers N] [--iters N]` | — | VQE ground-state solver for QUBO (test-input generation) |
| `qwispr testgen --file <path> --function <name> [--layers 2]` | `vqe` (via VQE) | VQE boundary test generation (branch-distance QUBO → VQE) |
| `qwispr refactor --file <path> [--top 5]` | — | QWalk+QML refactoring candidates (centrality × (1-cohesion)) |
| `qwispr run --task <task> [args...] [--backend ...]` | `orchestrate` | Hybrid router: `resolve\|search\|testgen\|analyze\|refactor` |
| `qwispr hardware --list` | `backend` | List backends + current device |
| `qwispr mcp` | — | MCP stdio server (tools/list + tools/call, 5 tools) |

`--backend` / `QWISPR_BACKEND`: `simulator` (default.qubit), `lightning` (lightning.qubit), `ibm` (qiskit.ibmq, stub), `braket` (braket.aws.qubit, stub). Also `QWISPR_DEVICE` passthrough (e.g. `lightning.qubit`).

`qwispr run --task resolve --qubo <file>` — QUBO dependency resolution: classical brute-force (n≤4) else QAOA.

## VS Code extension (TICKET-41)

`extensions/vscode/` — `qwispr-vscode` wraps `dist/src/cli.js`.

- `Cmd+Shift+P` → `Qwispr: Analyze File` — webview with hotSpots
- `Qwispr: Search Code` — regex+glob → quickpick
- `Qwispr: Generate Tests` — VQE inputs

Build & install:

```bash
npm run build
npm --prefix extensions/vscode install && npm --prefix extensions/vscode run build
npx --prefix extensions/vscode vsce package
code --install-extension extensions/vscode/qwispr-vscode-0.1.0.vsix
```

Config: `qwispr.cliPath` overrides CLI path; `qwispr.backend` for future use.

## Env vars

| Var | Values | Default |
|-----|--------|---------|
| `QWISPR_BACKEND` | `simulator\|lightning\|ibm\|braket` | `simulator` |
| `QWISPR_DEVICE` | device string (e.g. `lightning.qubit`) | — (derived from backend) |
| `QWISPR_LAYERS` | int | per-command `--layers` |
| `QWISPR_ITERS` | int | per-command `--iters` |
| `QWISPR_CALIBRATION` | float (e.g. `0.98`, `1.02`) | `1.0` |
| `QISKIT_TOKEN` | IBM Quantum token | — (fallback to simulator) |
| `QWISPR_QPU_DRYRUN` | `1` to simulate QPU path without token | `0` |
| `QWISPR_QPU_SHOTS` | int 1..10000 | `1024` |
| `QWISPR_TELEMETRY` | `1` to enable | `0` (off) |
| `QWISPR_TELEMETRY_PATH` | path override | `~/.qwispr/telemetry.jsonl` |
