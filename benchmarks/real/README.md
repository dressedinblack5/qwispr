# Real Benchmarks — Synthetic vs Real

Curated from actual `npm ERESOLVE` failures (minimal reproductions). All packages MIT/Apache-2.0/BSD.

## Cases

| # | File | Conflict | Solvable | License |
|---|------|----------|----------|---------|
| 1 | real-01-react-peer.json | react 17 vs 18 (`@mui/material@4` peer `^17` vs `react@18`) | false | MIT |
| 2 | real-02-webpack-peer.json | webpack 4 vs 5 (`html-webpack-plugin@4` peer `^4` vs `webpack@5`) | false | MIT |
| 3 | real-03-eslint-peer.json | eslint 7 vs 8 (`@typescript-eslint/parser@5` peer `^7` vs `eslint@8`) | false | MIT |
| 4 | real-04-typescript-peer.json | typescript 4 vs 5 (`ts-loader@8` peer `^4` vs `ts@5`) | false | Apache-2.0 |
| 5 | real-05-diamond-deps.json | diamond (`express` + `apollo-server-express` shared deps) | true | MIT |

Reproduce: `npm install <deps>` per `_qwispr.repro` in each file — expect `ERESOLVE` output in `_qwispr.eresolve`.

## Synthetic vs Real

| Metric | Synthetic (`benchmarks/lockfiles/`, n=60) | Real (`benchmarks/real/`, n=5) |
|--------|------------------------------------------|-------------------------------|
| Avg size | ~1.3 KB (721 B–3.1 KB) | ~1.6 KB (1.2–1.7 KB) |
| Packages (n vars) | 3–8 (avg ~4) | 3–5 (avg 4) |
| Conflict types | 6 synthetic patterns | 2 types (peer, diamond) from real ERESOLVE |
| Solve time | trivial (<1 ms, brute force) | same order — small n, but peer constraints are real semver ranges |
| Source | generated | curated minimal repros of public npm failures |

Real cases are smaller but harder: peer ranges are actual semver from registry, not synthetic placeholders. Synthetic covers breadth (cyclic, optional, complex-mixed); real covers fidelity.

## Usage

```bash
benchmarks/collect-real.sh      # regenerate (reproducible, no token needed)
benchmarks/validate-real.sh     # bash validation
npm run benchmark:real          # tsx validation (CI)
```
