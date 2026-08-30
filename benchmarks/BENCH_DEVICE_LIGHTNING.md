# Device Bench: default.qubit vs lightning.qubit

**Date:** 2026-08-29
**PennyLane:** 0.45.1, **lightning:** 0.45.0
**Context:** Qwispr QAOA dep-conflict (n=2..7, p=2, GradientDescent 0.1, parameter-shift, `qml.probs`)
**Repro:** `python3 /tmp/bench_real2.py` + `python3 /tmp/bench_qaoa2.py` (synthetic random QUBOs)

## Real QUBOs (encoded lockfiles)

| lockfile | n | default 10 iters | lightning 10 iters | speedup | 50 iters extrap. |
|---|---|---|---|---|---|
| `direct-conflict-1` | 2 | 0.21s | 0.12s | **1.8×** | 1.1s → 0.6s |
| `peer-conflict-1` | 3 | 0.55s | 0.26s | **2.1×** | 2.7s → 1.3s |
| `complex-mixed-1` | 7 | 1.43s | 0.66s | **2.2×** | 7.1s → 3.3s |

`shots=None` (analytic) only ~10% faster — bottleneck is `parameter-shift` (2·2p evals/iter), not sampling.

## Synthetic QUBOs (dense random, 60% non-zero)

| case | default | lightning | speedup |
|---|---|---|---|
| n=3, 10 iters, shots=1000 | 0.473s | 0.259s | 1.8× |
| n=7, 10 iters, shots=1000 | 5.812s | 2.122s | 2.7× |
| n=7, 20 iters, analytic | 18.343s | 6.235s | 2.9× |
| n=7, 20 iters, shots=1000 | 19.604s | 7.023s | 2.8× |

## Full-suite projection

`src/benchmarks/runners/run-quantum.ts` does **60 lockfiles × 3 layers = 180 QAOA runs**, `maxIterations=50`:

- **default.qubit:** ~21 min (times out)
- **lightning.qubit:** ~10 min (passes, smoke 15 runs: ~7s → ~3s)

Variance in energy between devices is expected: `shots=1000` introduces sampling noise + different autodiff paths; init params seeded identically.

## Decision

**Switch `qaoa.py` to `lightning.qubit` with fallback to `default.qubit`.**

```python
# src/skills/qaoa-agent/qaoa.py:13
import os
try:
    dev = qml.device(os.getenv("QWISPR_DEVICE", "lightning.qubit"), wires=n, shots=shots)
except Exception:
    dev = qml.device("default.qubit", wires=n, shots=shots)
```

Skipped: `adjoint` + Hamiltonian rewrite (`qml.expval(H)`) — only needed when n>12 where state-vector dominates; at n≤7 Python/qnode overhead dominates. Add when single n=10+ run >2s.

## Notes

- `adjoint` with `qml.probs` not supported on `lightning.qubit` (error). Keep `parameter-shift`.
- `shots` on device is deprecated (PennyLane 0.45) — migrate to `qml.set_shots` transform later.
- Cost term for Z_i Z_j currently `RZ(gamma*coeff)` on each wire (approx). True `RZZ = CNOT-RZ-CNOT / qml.IsingZZ` — separate fix, orthogonal to device speed.
- Best-bitstring currently `argmin(energies)` (exact brute force), not sampled `probs` — masks QAOA quality, but not perf-related.

## Verification

```bash
python3 /tmp/bench_real2.py 2>&1 | grep -E "^(===|  default|  lightning)"
python3 /tmp/bench_qaoa2.py 2>&1 | grep -E "default|lightning"
pytest # or npm run test:qaoa-agent  (after patch, p=2, shots=1000 smoke still passes)
```
