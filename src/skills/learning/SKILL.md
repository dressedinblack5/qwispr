# Learning — telemetry + auto-tune
Opt-in `QWISPR_TELEMETRY=1` appends `{ts,task,route,nVars,wallMs,success}` to `~/.qwispr/telemetry.jsonl`.
`readRecent(n)` tails last n events; `getAdaptiveThreshold()` adjusts threshold 2..8 from avg wallMs/successRate.
Heuristic: quantum >2× slower without gain → threshold++; quantum success+0.1 → threshold--.
No DB/ML — JSONL + heurística (`telemetry.ts`).
Override path via `QWISPR_TELEMETRY_PATH` for tests.
