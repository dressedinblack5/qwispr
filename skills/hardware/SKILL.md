---
name: hardware
description: Quantum hardware backend abstraction (simulator, lightning.qubit) with QPU pilot stub
version: 0.1.0
author: qwispr
license: MIT
exports:
  - Backend
  - getBackend
  - getDeviceString
  - getQpuStatus
  - applyReadoutMitigation
  - runQpuOrFallback
cli:
  - hardware
  - backend
---

# hardware Skill

Backend abstraction for PennyLane devices with QPU pilot.

## Backends

| Backend | PennyLane Device | Notes |
|---------|------------------|-------|
| `simulator` | `default.qubit` | Pure Python, no deps |
| `lightning` | `lightning.qubit` | C++ accelerated, ~2-3× faster |

## Environment Variables

- `QWISPR_BACKEND`: `simulator` | `lightning`
- `QWISPR_DEVICE`: Direct device string override (e.g., `lightning.qubit`)
- `QWISPR_QPU_SHOTS`: Shots for QPU (1..10000, default 1024)
- `QISKIT_TOKEN`: IBM Quantum token for QPU pilot
- `QWISPR_QPU_DRYRUN`: Set `1` for dry-run QPU path

## Commands

### `qwispr hardware --list` / `qwispr backend --list`

Lists available backends with current device and QPU status.