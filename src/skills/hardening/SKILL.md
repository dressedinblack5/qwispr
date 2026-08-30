# hardening — guardrails (validation + sandbox + calibration)
`assertFileExists(path)` throws `qwispr: file not found: <path>` if missing.
`assertSafePattern(regex)` rejects ReDoS via heuristic (nested quantifier `([a-z]+)+`); `// ponytail: heuristic ReDoS check, upgrade to re2 if needed`.
`spawnWithTimeout(cmd,args,opts)` enforces 30s timeout + 1MB maxBuffer, kills child on expiry; ENOENT → `qwispr: python not found`.
Usage: `search` validates glob + pattern before scan; `vqe`/`qaoa` validate qubo file + spawn python with timeout.
Env: `QWISPR_CALIBRATION` (float, default `1.0`) — calibration knob for physical drift (clock/sensor/PCA9685 skew); e.g. `0.98` if device runs fast, `1.02` if slow.
Applied as multiplier on timings/energies; tune without code change for real hardware drift.
