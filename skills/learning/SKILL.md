---
name: learning
description: Telemetry + adaptive threshold for hybrid routing
version: 0.1.0
author: qwispr
license: MIT
exports:
  - appendEvent
  - readRecent
  - clearTelemetry
  - getAdaptiveThreshold
cli:
  - (internal)
---

# learning Skill

Adaptive learning loop for hybrid classical/quantum routing.

## Telemetry

Opt-in JSONL at `~/.qwispr/telemetry.jsonl` (override via `QWISPR_TELEMETRY_PATH`).

```json
{"ts":1788053920925,"task":"search","route":"classical","nVars":0,"wallMs":11,"success":true}
```

Enable with `QWISPR_TELEMETRY=1`.

## Adaptive Threshold

`getAdaptiveThreshold()` reads recent 100 events and adjusts `nVars` threshold:

- If quantum 2× slower with no success gain → threshold++
- If quantum success rate > classical + 0.1 → threshold--
- Clamped to [2, 8]

Called by `orchestrateAdaptive()` — the default router since review fixes.