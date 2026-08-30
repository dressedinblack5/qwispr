# qwispr — hybrid quantum/classical code intelligence

Hybrid router that picks classical vs quantum execution per task. Classical for small/trivial, quantum (VQE/QAOA/Grover/QWalk) for larger.

## Quickstart

```bash
npm ci
npm run build
npx qwispr --help

# examples
npx qwispr analyze --file src/cli.ts --entry main
npx qwispr search --pattern "TODO" --files "src/**/*.ts"
npx qwispr testgen --file src/skills/analyze-agent/analyze.ts --function analyzeSource
npx qwispr refactor --file src/skills/analyze-agent/analyze.ts --top 3
npx qwispr hardware --list
QWISPR_BACKEND=lightning npx qwispr vqe --qubo qubo.json --layers 2 --iters 50
npx qwispr run --task search --pattern "eval" --files "src/**/*.ts"
```

Install Python deps for VQE/QAOA: `pip install pennylane` (optional — falls back to heuristic/classical if missing).

## Next

- [Commands](/commands) — all CLI commands, aliases, env vars, VS Code extension
- [Benchmarks](/benchmarks) — synthetic vs real, BENCH_N, lightning, nightly
- [Learning](/learning) — telemetry opt-in and adaptive threshold

## Local docs

```bash
npm run docs:dev   # http://localhost:5173
npm run docs:build # → docs/site/.vitepress/dist/
```
