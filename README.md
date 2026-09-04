<p align="center">
  <img src="https://img.shields.io/npm/v/qwispr?color=6e56cf&label=" alt="npm version" />
  <img src="https://img.shields.io/github/actions/workflow/status/qwispr/qwispr/ci.yml?branch=main&label=CI" alt="CI status" />
  <img src="https://img.shields.io/npm/l/qwispr?color=6e56cf" alt="license" />
  <img src="https://img.shields.io/badge/ponytail-full-6e56cf" alt="ponytail" />
  <img src="https://img.shields.io/badge/quantum-PennyLane-6e56cf" alt="quantum" />
</p>

# qwispr — Hybrid Quantum/Classical Code Intelligence

> **Routes software engineering problems to quantum algorithms (QAOA, VQE, Grover, QWalk, QSVM) on PennyLane simulators with deterministic classical fallback.**

qwispr is a CLI + MCP server that treats SE problems as optimization/quantum problems: dependency conflicts → QAOA, test generation → VQE, code search → Grover amplification, call-graph analysis → QWalk, refactoring → QWalk+QSVM. Runs locally on `default.qubit`/`lightning.qubit` — no cloud credentials required.

## Table of Contents

- [Quickstart](#quickstart)
- [Installation](#installation)
- [Commands](#commands)
- [Problem → Algorithm Map](#problem--algorithm-map)
- [MCP Server](#mcp-server)
- [VS Code Extension](#vs-code-extension)
- [Benchmarks](#benchmarks)
- [Environment Variables](#environment-variables)
- [Architecture](#architecture)
- [Ponytail Minimalism](#ponytail-minimalism)
- [Contributing](#contributing)
- [License](#license)

---

## Quickstart

```bash
# Install
npm i -g qwispr

# 1. Analyze a file (call-graph + QWalk metrics)
qwispr analyze --file src/cli.ts --entry main

# 2. Search with Grover amplification
qwispr search --pattern "eval|dangerous" --files "src/**/*.ts" --top 10

# 3. Resolve dependency conflict (QUBO → QAOA)
echo '{"Q":[[1,-2],[-2,1]]}' > qubo.json
qwispr run --task resolve --qubo qubo.json --vars 2

# 4. Generate test inputs that hit branches (VQE)
qwispr testgen --file src/utils.ts --function parseJson --layers 2

# 5. Get refactoring suggestions (QWalk+QSVM)
qwispr refactor --file src/cli.ts --top 5

# 6. Run MCP server (for VS Code / Claude / etc.)
qwispr mcp --stdio
```

---

## Installation

| Method | Command |
|--------|---------|
| **npm (global)** | `npm i -g qwispr` |
| **npx (no install)** | `npx qwispr --help` |
| **Docker** | `docker run --rm ghcr.io/qwispr/qwispr:latest --help` |
| **From source** | `git clone https://github.com/qwispr/qwispr && cd qwispr && npm ci && npm run build` |

**Requirements:**
- Node.js ≥ 20
- Python ≥ 3.11 + PennyLane (auto-installed via pip on first quantum run)
- **Fallback**: `QWISPR_DEVICE=default.qubit` runs pure Python (no C++ deps)

---

## Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `analyze` | `qwalk` | Call-graph + QWalk metrics (reachability, centrality, diameter, hotSpots; diameter `-1` = disconnected) |
| `search` | `grover` | Grover-ranked regex search over glob |
| `vqe` | — | VQE ground-state for QUBO |
| `testgen` | — | VQE boundary test inputs for a function |
| `refactor` | — | QWalk+QML refactoring candidates |
| `run` | `orchestrate` | Hybrid router (classical vs quantum) |
| `hardware` | `backend` | List backends + current device |
| `mcp` | — | stdio JSON-RPC server (5 tools) |

**Global options:**
```
--backend simulator|lightning   (also QWISPR_BACKEND env)
--help, -h                      show help
```

---

## Problem → Algorithm Map

| SE Problem | Quantum Algorithm | Skill | How it Works |
|------------|-------------------|-------|--------------|
| **Dependency resolution** (lockfile conflicts) | **QAOA** | `qaoa-agent` | QUBO → Ising Hamiltonian → `RZZ/RZ + RX` mixer, GradientDescent optimizer |
| **Code search** (AST/regex patterns) | **Grover** | `grover-agent` + `search-agent` | Analytic Grover iteration (`π/4√(N/M)`) amplifies matching hits |
| **Test generation** (branch coverage) | **VQE** | `vqe-agent` + `testgen-agent` | Branch-distance QUBO → hardware-efficient ansatz `RY/RZ+CNOT` → parameter-shift |
| **Call-graph analysis** (reachability, centrality) | **QWalk** | `qwalk-agent` + `analyze-agent` | BFS + BTree + Floyd (classical fallback; quantum coin+shift for n≤8) |
| **Refactoring suggestions** (god functions) | **QWalk + QSVM** | `refactor-agent` | Centrality × (1 − cohesion) via simulated RBF kernel |
| **Fragment classification** (buggy/clean) | **QSVM** | `qml-agent` | Token/AST/n-gram → RY angles → RBF `|⟨0\|U†U\|0⟩|²` nearest-centroid |

---

## MCP Server

qwispr exposes 5 tools via stdio JSON-RPC (MCP protocol):

```bash
# Start server
qwispr mcp --stdio

# List tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | qwispr mcp --stdio

# Call analyze
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"analyze","arguments":{"file":"src/cli.ts"}}}' | qwispr mcp --stdio
```

| Tool | Description |
|------|-------------|
| `analyze` | Call-graph + QWalk metrics |
| `search` | Grover-ranked regex search |
| `testgen` | VQE boundary test generation |
| `refactor` | QWalk+QML refactoring candidates |
| `hardware` | List backends + current device |

**Register with OpenAxe:**
```bash
openaxe mcp add qwispr --cwd . -- node dist/cli.js mcp --stdio
openaxe mcp list  # shows qwispr ✓ connected
```

---

## VS Code Extension

```bash
cd extensions/vscode
npm ci && npm run build    # produces dist/extension.js
vsce package               # creates qwispr-vscode-0.1.0.vsix
code --install-extension qwispr-vscode-0.1.0.vsix
```

**Commands:**
- `qwispr.analyze` — call-graph + QWalk webview (hotSpots table)
- `qwispr.search` — quickpick Grover-ranked results
- `qwispr.testgen` — JSON input → boundary test cases

---

## Benchmarks

```bash
# Synthetic QUBOs (n=3..8, LCG-generated)
BENCH_N=5 npm run benchmark

# Real lockfile conflicts (react/webpack/eslint/typescript)
BENCH_N=5 npm run benchmark:real

# Generate comparison report
npm run benchmark:report  # → report/index.md + report/data.json
```

**Results (BENCH_N=2, deterministic seed):**
| Suite | Cases | Success Rate | Avg Time | p95 |
|-------|-------|--------------|----------|-----|
| synthetic | 2 | 100% | ~4s | ~4.5s |
| real | 2 | 100% | ~4s | ~4.5s |

**Speedup:** `lightning.qubit` ~2-3× faster than `default.qubit` ([benchmarks/BENCH_DEVICE_LIGHTNING.md](benchmarks/BENCH_DEVICE_LIGHTNING.md)).

```bash
QWISPR_BACKEND=lightning BENCH_N=5 npm run benchmark
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `QWISPR_BACKEND` | `simulator` | `simulator` \| `lightning` |
| `QWISPR_DEVICE` | — | Direct PennyLane device string (e.g., `lightning.qubit`) |
| `QWISPR_QPU_SHOTS` | `1024` | Shots for QPU (clamp 1..10000) |
| `QWISPR_LAYERS` | `2` | VQE/QAOA ansatz layers (honored by python workers/benchmark only; CLI `--layers` overrides) |
| `QWISPR_ITERS` | `50` | Optimizer iterations (honored by python workers/benchmark only; CLI `--iters` overrides) |
| `QWISPR_TELEMETRY` | `0` | Set `1` to enable `~/.qwispr/telemetry.jsonl` |
| `QWISPR_TELEMETRY_PATH` | `~/.qwispr/telemetry.jsonl` | Custom telemetry path |
| `QWISPR_CALIBRATION` | `1.0` | Reserved/unused (no runtime effect; no reader in code) |
| `QWISPR_QPU_DRYRUN` | `0` | Set `1` for dry-run QPU path |
| `QWISPR_ALLOW_ABSOLUTE` | `0` | Bypass workspace-root jail (search globs + analyze/refactor/testgen `--file`) |
| `QISKIT_TOKEN` | — | IBM Quantum token, reported in `hardware` status (`hasToken`); live QPU calls not implemented — set `QWISPR_QPU_DRYRUN=1` for the simulated path |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SOURCE / LOCKFILE / QUBO                 │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  code-graph   │   │problem-encoder│   │  (direct QUBO)│
│  (regex AST)  │   │(branch-dist)  │   │               │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
              ┌───────────────────────────┐
              │      ORCHESTRATOR         │
              │  nVars ≤ threshold?       │
              │  classical : quantum      │
              └───────────┬───────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
   ┌─────────────┐                 ┌─────────────┐
   │  CLASSICAL  │                 │  QUANTUM    │
   │  (brute n≤4)│                 │  PennyLane  │
   └──────┬──────┘                 │  • QAOA     │
          │                        │  • VQE      │
          │                        │  • Grover   │
          │                        │  • QWalk    │
          │                        │  • QSVM     │
          └───────────────┬────────┘
                          ▼
              ┌───────────────────────────┐
              │     BITSTRING + ENERGY    │
              └───────────┬───────────────┘
                          ▼
              ┌───────────────────────────┐
              │        DECODER            │
              │  patch / inputs / hits    │
              └───────────────────────────┘
```

**Hybrid routing threshold** adapts via telemetry (`QWISPR_TELEMETRY=1`):
- Quantum 2× slower with no gain → threshold++
- Quantum success rate > classical + 0.1 → threshold--
- Clamped to [2, 8]

---

## Ponytail Minimalism

This project follows **ponytail full** — minimal, stdlib-first, no unnecessary abstractions.

| Shortcut | Ceiling | Upgrade Path |
|----------|---------|--------------|
| Manual JSON-RPC | no SDK | `@modelcontextprotocol/sdk` if client fails |
| Regex call-graph | no tree-sitter | native parser when lands |
| BFS ≈ QWalk | classical fallback | true quantum walk n≤8 |
| Heuristic ReDoS guard | nested quantifier only | `re2` if exposed over network |
| Adaptive threshold | heuristic 2×/rate | ML when >10k events/day |

Every `// ponytail:` comment marks a deliberate ceiling with upgrade path.

**Stats:**
- 0 runtime dependencies (`dependencies: {}`)
- ~250 lines removed via audit
- 7 dev deps removed (`chalk`, `ora`, `fast-json-patch`, `tree-sitter*`, `semver`, `yaml`)
- 16/16 tests pass, 0 vulnerabilities

---

## Contributing

```bash
# 1. Fork & clone
git clone https://github.com/yourfork/qwispr
cd qwispr

# 2. Install deps
npm ci

# 3. Run checks
npm run lint      # eslint
npm run typecheck # tsc --noEmit
npm test          # vitest 16/16

# 4. Benchmarks (optional)
npm run benchmark
npm run benchmark:real

# 5. Commit (conventional commits)
git commit -m "feat: add new quantum algorithm"

# 6. PR → CI runs lint + typecheck + test + benchmark:smoke
```

**Code style:** Strict TypeScript, no `any`, no `ts-ignore`, minimal deps, ponytail ceiling comments.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built with ⚛️ PennyLane + 🦸 Ponytail on OpenAxe</strong>
</p>