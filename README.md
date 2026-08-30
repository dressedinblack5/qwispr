# qwispr — hybrid quantum/classical code intelligence

CLI + MCP server that routes SE problems to quantum algorithms (QAOA, Grover, VQE, QWalk, QSVM) on PennyLane simulators with classical fallback.

```bash
npx qwispr analyze --file src/cli.ts
npx qwispr search --pattern "TODO" --files "src/**/*.ts"
npx qwispr vqe --qubo qubo.json --layers 2 --iters 50
npx qwispr testgen --file src/foo.ts --function myFn
npx qwispr refactor --file src/foo.ts
npx qwispr run --task resolve --qubo qubo.json --vars 10
npx qwispr hardware --list
npx qwispr mcp --stdio
```

## Install

```bash
npm i -g qwispr
# or
docker run ghcr.io/<org>/qwispr:latest
```

Requires: Node 20+, Python 3.11+, PennyLane (auto-installed via pip, or set `QWISPR_DEVICE=default.qubit` for no-Python fallback).

## Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `analyze` | `code-graph`, `qwalk` | Call-graph + QWalk metrics (reachability, centrality, diameter, hotSpots) |
| `search` | `grover` | Grover-ranked regex search over glob |
| `vqe` | — | VQE ground-state for QUBO |
| `testgen` | — | VQE boundary test inputs for a function |
| `refactor` | — | QWalk+QML refactoring candidates |
| `run` | `orchestrate` | Hybrid router (classical vs quantum) |
| `hardware` | `backend` | List backends + current device |
| `mcp` | — | stdio JSON-RPC server (5 tools) |

All commands support `--backend simulator|lightning|ibm|braket` (via `QWISPR_BACKEND`/`QWISPR_DEVICE`).

## Quickstart

```bash
# 1. Analyze a file
qwispr analyze --file src/cli.ts --entry main

# 2. Search for patterns with Grover amplification
qwispr search --pattern "eval|dangerous" --files "src/**/*.ts" --top 10

# 3. Resolve a dependency conflict (QUBO → QAOA)
echo '{"Q":[[1,-2],[-2,1]]}' > qubo.json
qwispr run --task resolve --qubo qubo.json --vars 2

# 4. Generate test inputs that hit branches
qwispr testgen --file src/utils.ts --function parseJson --layers 2

# 5. Get refactoring suggestions
qwispr refactor --file src/cli.ts --top 5

# 6. Run MCP server (for VS Code / Claude / etc.)
qwispr mcp --stdio
```

## Benchmarks

```bash
# Synthetic QUBOs (n=3..8)
BENCH_N=5 npm run benchmark

# Real lockfile conflicts (react/webpack/eslint/typescript)
BENCH_N=5 npm run benchmark:real

# Comparison report → report/index.md + data.json
npm run benchmark:report
```

Speedup: `lightning.qubit` ~2-3× faster than `default.qubit` (see `benchmarks/BENCH_DEVICE_LIGHTNING.md`). Set `QWISPR_BACKEND=lightning` or `QWISPR_DEVICE=lightning.qubit`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `QWISPR_BACKEND` | `simulator` | `simulator`, `lightning`, `ibm`, `braket` |
| `QWISPR_DEVICE` | — | Overrides backend → PennyLane device string (e.g., `lightning.qubit`) |
| `QWISPR_QPU_SHOTS` | `1024` | Shots for QPU (clamp 1..10000) |
| `QWISPR_LAYERS` | `2` | VQE/QAOA ansatz layers |
| `QWISPR_ITERS` | `50` | Optimizer iterations |
| `QWISPR_TELEMETRY` | `0` | Set `1` to enable `~/.qwispr/telemetry.jsonl` |
| `QWISPR_TELEMETRY_PATH` | `~/.qwispr/telemetry.jsonl` | Custom telemetry path |
| `QWISPR_CALIBRATION` | `1.0` | Physical drift multiplier (knob for hardware) |
| `QISKIT_TOKEN` | — | IBM Quantum token for QPU pilot |
| `QWISPR_QPU_DRYRUN` | `0` | Set `1` for dry-run QPU path |
| `QWISPR_ALLOW_ABSOLUTE` | `0` | Allow absolute globs in search |

## Architecture

```
code / lockfile / QUBO
    │
    ├─► code-graph (regex fallback) → {nodes, edges}
    ├─► problem-encoder (branch-distance QUBO) → qubo.json
    │
    └─► orchestrator (nVars ≤ threshold? classical : quantum)
                │
          ┌─────┴─────┐
     classical    quantum (PennyLane)
     (brute n≤4)   QAOA / VQE / Grover / QWalk / QSVM
                │
           bitstring + energy
                │
           decoder → patch / inputs / hits
```

## Ponytail Notes

This project follows **ponytail full** — minimal, stdlib-first, no unnecessary abstractions. Every `// ponytail:` comment marks a deliberate ceiling with upgrade path.

Key shortcuts:
- Manual JSON-RPC (no SDK) — upgrade if client fails
- Regex call-graph (no tree-sitter) — upgrade when parser lands
- BFS approximates QWalk — true quantum walk when n≤8 hardware ready
- Heuristic ReDoS guard — `re2` if exposed over network
- Adaptive threshold heuristic — ML when >10k events/day

## License

MIT