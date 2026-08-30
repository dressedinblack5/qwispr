# Learning loop

Opt-in telemetry + adaptive threshold. No DB, no dashboard — JSONL + heuristic.

## Telemetry

Disabled by default. Enable:

```bash
QWISPR_TELEMETRY=1 npx qwispr run --task search --pattern "TODO" --files "src/**/*.ts"
cat ~/.qwispr/telemetry.jsonl
```

Each `qwispr run` appends one JSON line to `~/.qwispr/telemetry.jsonl` (override with `QWISPR_TELEMETRY_PATH`):

```json
{"ts": 1724450000000, "task": "search", "route": "quantum", "nVars": 5, "wallMs": 120, "success": true}
```

Fields: `ts`, `task`, `route` (`classical`|`quantum`), `nVars`, `wallMs`, `success`.

Implementation: `src/skills/learning/telemetry.ts` — `appendEvent`, `readRecent(n=100)`, `clearTelemetry`. Ignores bad lines, creates `~/.qwispr/` if missing.

## Adaptive threshold

`src/skills/orchestrator/orchestrator.ts` reads last 100 events and adjusts the classical/quantum cutoff (`nVars≤4 → ≤k`) if quantum is >2× slower without success gain. After ~20 runs the threshold moves automatically.

```ts
import { readRecent } from "../learning/telemetry";
// heuristic: if quantum avg wallMs > 2× classical and successRate not better → raise threshold
```

> ponytail: JSONL + heurística, DB si >10k eventos/día

## Privacy

- Opt-in only (`QWISPR_TELEMETRY=1`), default off.
- Local file only, never sent.
- Clear: `rm ~/.qwispr/telemetry.jsonl` or `clearTelemetry()`.
