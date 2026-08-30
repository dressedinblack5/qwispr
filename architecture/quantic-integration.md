# Quantic-OpenAxe Integration Architecture

**Status**: Design Phase - Based on Track A (Landscape) + Track B (Paseo Patterns) findings  
**Date**: 2026-08-29  
**Sources**: `research/qiskit-1x-production-patterns.md`, `research/cirq-v1-patterns.md`, `research/pennylane-patterns.md`, `research/prior-art-quantum-coding-assistants.md`, Paseo pattern catalog

---

## 1. Integration Strategy: "Assistant Layer Above All"

**Core Principle**: Don't build another simulator/language/cloud. Build the *agent* that sits on top of Qiskit, Cirq, PennyLane, Braket, Classiq, etc. — providing quantum-aware completion, transpilation advisory, error mitigation automation, cost estimation, and hybrid workflow orchestration.

**Moat**: Open + Multi-backend + Agent-native + Cost-aware

---

## 2. Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         QUANTIC OPENAXE ASSISTANT                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  CIRCUIT     │  │   NOISE      │  │  BACKEND     │  │  HYBRID      │    │
│  │  AGENT       │  │  AGENT       │  │  AGENT       │  │  AGENT       │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                 │                 │            │
│         └─────────────────┼─────────────────┼─────────────────┘            │
│                           ▼                 ▼                              │
│              ┌─────────────────────────────────────────┐                   │
│              │         PASEO WORKSPACE                 │                   │
│              │  ┌───────────────────────────────────┐  │                   │
│              │  │   QUANTUM WORKSPACE ADAPTER       │  │                   │
│              │  │  - Circuit files (.qasm, .py)     │  │                   │
│              │  │  - Job tasks (backend submissions)│  │                   │
│              │  │  - Calibration data (per backend) │  │                   │
│              │  │  - IR: QASM 3.0 / QIR (unified)   │  │                   │
│              │  └───────────────────────────────────┘  │                   │
│              └─────────────────────────────────────────┘                   │
│                           │                                               │
│         ┌─────────────────┼─────────────────┐                            │
│         ▼                 ▼                 ▼                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                    │
│  │  QISKIT      │  │   CIRQ       │  │  PENNYLANE   │  ...more plugins   │
│  │  SDK PLUGIN  │  │  SDK PLUGIN  │  │  SDK PLUGIN  │                    │
│  └──────────────┘  └──────────────┘  └──────────────┘                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Quantum Workspace Model (Extends Paseo Workspace)

### 3.1 Workspace Types
```json
// openaxe.jsonc addition
{
  "workspace": {
    "types": {
      "quantum": {
        "adapter": "quantum-workspace-adapter",
        "scripts": {
          "qiskit-sim": { "command": "python -m qiskit_aer", "supervised": true },
          "cirq-sim": { "command": "python -m cirq", "supervised": true },
          "noise-sim": { "command": "python quantum_noise_server.py", "supervised": true },
          "backend-proxy": { "command": "python backend_proxy.py", "supervised": true }
        }
      }
    }
  }
}
```

### 3.2 Workspace Structure
```
quantum-project/
├── circuits/
│   ├── ansatz/
│   │   ├── hardware_efficient.py      # Qiskit/Cirq/PennyLane templates
│   │   ├── qaoa_ansatz.py
│   │   └── uccsd.py
│   ├── kernels/
│   │   └── feature_maps.py
│   └── optimization/
│       └── transpiled/                # Per-backend transpiled circuits
├── jobs/
│   ├── ibm/
│   │   ├── job_001.json               # Job metadata + results
│   │   └── calibration_2026-08-29.json
│   ├── ionq/
│   └── braket/
├── calibration/
│   ├── ibm_brisbane_2026-08-29.json
│   ├── ionq_harmony_2026-08-29.json
│   └── rigetti_ankaa_2026-08-29.json
├── paseo.json                         # Workspace scripts
├── .quantum-ir/                       # Unified IR (QASM 3 / QIR)
└── openaxe.jsonc                      # Agent/skill config
```

### 3.3 Paseo Integration
```bash
# Create quantum workspace per backend (isolated transpilation)
paseo workspace create --isolation worktree --mode branch-off --new-branch quant/ibm-brisbane --base main
paseo workspace create --isolation worktree --mode branch-off --new-branch quant/ionq-harmony --base main

# Start supervised simulation servers
paseo script start qiskit-sim --workspace <ibm-ws-id>
paseo script start noise-sim --workspace <ibm-ws-id>

# Run variational loop on schedule
paseo schedule create --cron "*/5 * * * *" "Run VQE iteration, check convergence, update params"
```

---

## 4. Agent Specialization (OpenAxe Agents + Paseo Profiles)

### 4.1 Agent Registry (openaxe.jsonc)
```json
{
  "agent": {
    "circuit-agent": {
      "description": "Qiskit/Cirq/PennyLane circuit construction, transpilation, optimization",
      "mode": "subagent",
      "model": "anthropic/claude-opus-4",
      "permission": { "allow": ["skill:quantum-circuit", "skill:quantum-transpiler"] }
    },
    "noise-agent": {
      "description": "Noise modeling, error mitigation (ZNE, PEC, readout), calibration analysis",
      "mode": "subagent",
      "model": "anthropic/claude-opus-4",
      "permission": { "allow": ["skill:quantum-noise", "skill:quantum-mitigation"] }
    },
    "backend-agent": {
      "description": "Backend selection, queue monitoring, cost/fidelity tradeoffs, transpilation advisory",
      "mode": "subagent",
      "model": "anthropic/claude-opus-4",
      "permission": { "allow": ["skill:quantum-backend", "skill:quantum-cost"] }
    },
    "hybrid-agent": {
      "description": "VQE/QAOA/quantum-ML loop orchestration, classical optimizer integration",
      "mode": "subagent",
      "model": "anthropic/claude-opus-4",
      "permission": { "allow": ["skill:quantum-hybrid", "skill:quantum-optimizer"] }
    }
  },
  "experimental": {
    "subagent_depth_limit": 3
  }
}
```

### 4.2 Paseo Advisor Profiles
```yaml
# ~/.paseo/profiles/quantum-circuit.yaml
name: "Quantum Circuit Design"
provider: "anthropic/claude-opus-4"
notes: "Specialized in Qiskit/Cirq/PennyLane circuit construction, transpiler pass optimization, hardware-efficient ansatz design"
---

# ~/.paseo/profiles/quantum-noise.yaml
name: "Quantum Noise & Mitigation"
provider: "google/gemini-3.5-pro"
notes: "Expert in noise modeling (depolarizing, thermal, readout), error mitigation (ZNE, PEC, CDR), calibration data interpretation"
---

# ~/.paseo/profiles/quantum-backend.yaml
name: "Quantum Backend Strategy"
provider: "openai/gpt-5.4"
notes: "Backend selection, queue analysis, cost estimation, cross-platform transpilation comparison"
```

Usage: `paseo advisor --profile quantum-circuit "Review this 50-qubit ansatz for IBM Brisbane"`

---

## 5. Skill System Extensions

### 5.1 Skill Directory Structure
```
~/.agents/skills/
├── quantum-circuit/
│   ├── SKILL.md
│   ├── reference/
│   │   ├── qiskit-transpiler-passes.md
│   │   ├── cirq-transformers.md
│   │   └── pennylane-templates.md
│   └── scripts/
│       └── transpile_compare.py
├── quantum-noise/
│   ├── SKILL.md
│   ├── reference/
│   │   ├── noise-models.md
│   │   ├── mitigation-techniques.md
│   │   └── calibration-parsing.md
│   └── scripts/
│       └── zne_runner.py
├── quantum-backend/
│   ├── SKILL.md
│   ├── reference/
│   │   ├── backend-comparison.md
│   │   ├── queue-monitoring.md
│   │   └── cost-models.md
│   └── scripts/
│       └── cost_estimator.py
├── quantum-hybrid/
│   ├── SKILL.md
│   ├── reference/
│   │   ├── vqe-patterns.md
│   │   ├── qaoa-patterns.md
│   │   └── qml-patterns.md
│   └── scripts/
│       └── loop_orchestrator.py
└── quantum-cost/
    ├── SKILL.md
    └── reference/
        └── pricing-models.md
```

### 5.2 Skill Discovery
```json
// openaxe.jsonc
{
  "skills": {
    "paths": ["./skills", "~/.agents/skills"],
    "urls": ["https://github.com/quantna/quantum-skills"]  // for team sharing
  }
}
```

---

## 6. Unified Intermediate Representation (IR)

**Problem**: Qiskit `QuantumCircuit` ≠ Cirq `Circuit` ≠ PennyLane `QNode` ≠ Braket `Circuit` ≠ Classiq `Qmod` ≠ QIR

**Solution**: Internal canonical IR = **OpenQASM 3.0** + **QIR (LLVM)** with metadata annotations

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Qiskit     │     │              │     │  Qiskit     │
│  Circuit    │────▶│  QASM 3.0    │────▶│  Circuit    │
└─────────────┘     │  (canonical) │     └─────────────┘
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Cirq      │     │ PennyLane   │     │  Braket     │
│  Circuit    │     │   QNode     │     │  Circuit    │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 6.1 IR Metadata Schema
```json
{
  "circuit": {
    "num_qubits": 50,
    "depth": 400,
    "two_qubit_gate_count": 1200,
    "measurement_qubits": [0, 1, 2, ..., 49],
    "parameters": [{"name": "θ", "shape": [100]}],
    "annotations": {
      "entanglement_structure": "hardware_efficient",
      "estimated_fidelity_ibm": 0.02,
      "estimated_fidelity_ionq": 0.15,
      "transpilation_hints": ["avoid_swap_on_heavy_hex", "prefer_cz_over_cnot"]
    }
  }
}
```

### 6.2 Assistant Workflow
1. User writes in preferred SDK (Qiskit/Cirq/PennyLane)
2. Assistant auto-translates to QASM 3.0 IR
3. Transpilation advisor runs on IR for each target backend
4. User selects backend → assistant transpiles IR → target SDK
5. Execution → results → feedback loop to IR annotations

---

## 7. Context Management for Large Circuits

**Challenge**: 1000+ qubit circuits = huge QASM (100k+ lines). Exceeds agent context windows.

### 7.1 Strategy: Streaming + Chunked Context
```python
# In compaction/tool-outputs/<sessionID>/
circuit_001/
├── header.qasm          # 2k lines - module decl, includes, qubit decl
├── body_part_001.qasm   # 2k lines - first 500 gates
├── body_part_002.qasm   # 2k lines - next 500 gates
├── ...
├── tail.qasm            # 2k lines - measurements
├── metadata.json        # IR metadata (num_qubits, depth, annotations)
└── preview.txt          # 2k char summary for context
```

### 7.2 Compression Hook
```python
# In compaction plugin
def compress_quantum_circuit(tool_output: str, session_id: str) -> str:
    if is_qasm_output(tool_output):
        # Spill full QASM to disk
        spill_path = f"compaction/tool-outputs/{session_id}/circuit_{hash(tool_output)}.qasm"
        write_file(spill_path, tool_output)
        
        # Keep preview + metadata in context
        preview = extract_preview(tool_output, 2000)
        metadata = extract_ir_metadata(tool_output)
        return f"[CIRCUIT SPILLED: {spill_path}]\n{preview}\n\nMETADATA: {json.dumps(metadata)}"
    return tool_output
```

### 7.3 Handoff Briefing Template
```markdown
## Task: Optimize 50-qubit VQE ansatz for IBM Brisbane

## Context
- Backend: IBM Brisbane (127 qubit, heavy-hex)
- Current fidelity estimate: 0.02 (depth 400)
- Target: <0.05 error rate, depth <200

## Relevant files
- `circuits/ansatz/hardware_efficient.py` — 50q, 6 layers, 300 params
- `calibration/ibm_brisbane_2026-08-29.json` — T1/T2, readout error, CX error map
- `.quantum-ir/ansatz_001.qasm` — 400 depth, 1200 2q gates (SPILLED)

## Current state
- Circuit constructed, transpiled with optimization_level=3
- ZNE mitigation planned (3 noise factors)
- Backend queue: 45 min estimated wait

## What was tried
- SuzukiTrotter decomposition (depth 400)
- SabreLayout + SabreSwap (routing overhead 1.8x)
- JAX-based gradient (lightning.gpu)

## Decisions
- Use `generate_preset_pass_manager(target=backend.target)` only
- Target optimization_level=2 for fidelity/depth tradeoff
- Switch to `lightning.gpu` for gradient computation

## Acceptance criteria
- Transpiled depth < 250 on Brisbane
- Estimated fidelity > 0.05
- Wall time < 10 min (including queue)

## Constraints
- Qiskit 1.4+ only (2.0-safe)
- Must use SamplerV2/EstimatorV2 PUB model
- No `qiskit.execute()` legacy
```

---

## 8. Task Delegation Patterns (Kanban-Swarm)

### 8.1 Circuit Construction + Verification Flow
```python
# Create board
kanban({operation: "create_board", title: "Quantum VQE: H2 Molecule"})

# Worker: Build ansatz
kanban_swarm({
  operation: "create_worker",
  boardId: board_id,
  title: "Build UCCSD ansatz for H2",
  prompt: "Construct 12-qubit UCCSD ansatz using PennyLane qchem. Use lightning.gpu device. Return QASM 3.0 IR.",
  subagent_type: "circuit-agent",
  background: true
})

# Verifier: Noise resilience
kanban_swarm({
  operation: "create_verifier",
  boardId: board_id,
  parentId: worker_card_id,
  title: "Verify noise resilience on IBM Brisbane",
  prompt: "Load calibration data. Run noise simulation with ZNE (3 factors). Estimate fidelity. Return mitigation recommendation.",
  subagent_type: "noise-agent",
  background: true
})

# Verifier: Backend cost/queue
kanban_swarm({
  operation: "create_verifier",
  boardId: board_id,
  parentId: worker_card_id,
  title: "Backend cost & queue analysis",
  prompt: "Check IBM Brisbane queue, IonQ Harmony availability. Estimate cost for 1000 shots x 50 iterations. Compare transpilation depth.",
  subagent_type: "backend-agent",
  background: true
})
```

### 8.2 Variational Loop Orchestration
```bash
# Paseo schedule: fresh agent per iteration
paseo schedule create \
  --cron "*/5 * * * *" \
  --provider "codex/gpt-5.4" \
  "Run VQE iteration: 1) get current params 2) submit circuit batch 3) collect results 4) classical optimizer step 5) update params 6) check convergence"
```

---

## 9. Implementation Priority (Phased)

### Phase 1 (Week 1-2): Foundation
- [ ] `quantum-circuit` skill (Qiskit/Cirq/PennyLane templates, transpiler patterns)
- [ ] `quantum-backend` skill (backend comparison, cost estimator, queue monitor)
- [ ] Quantum workspace adapter (OpenAxe + Paseo)
- [ ] QASM 3.0 IR parser/generator

### Phase 2 (Week 2-3): Intelligence
- [ ] `quantum-noise` skill (noise models, ZNE/PEC/CDR automation)
- [ ] `quantum-transpiler` skill (cross-platform transpilation advisor)
- [ ] Circuit-agent + backend-agent + noise-agent registration
- [ ] Kanban-swarm workflow for circuit→noise→backend verification

### Phase 3 (Week 3-4): Hybrid Orchestration
- [ ] `quantum-hybrid` skill (VQE/QAOA loop, classical optimizer integration)
- [ ] `quantum-optimizer` skill (gradient methods, shot-adaptive)
- [ ] Hybrid-agent for end-to-end variational loops
- [ ] Paseo schedule integration for automated iterations

### Phase 4 (Month 2+): Next-Gen
- [ ] Quantum-tutor skill (adaptive learning, QuantumKatas integration)
- [ ] Self-optimizing transpiler (ML-driven pass selection)
- [ ] Collaborative quantum IDE (multi-user Paseo workspaces)
- [ ] Autonomous error mitigation discovery

---

## 10. Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| SDK API volatility (Qiskit 2.0) | High | Medium | Target stable 1.x interfaces; QASM 3.0 IR as buffer |
| Context window too small for circuits | High | High | Streaming spill + metadata preview (implemented in §7) |
| No real hardware access for testing | High | Low | Simulator-first; fake backends (FakeBrisbane, QSimSimulator) |
| Skill permission complexity | Medium | Medium | Start with `explore`-like read-only; escalate gradually |
| Multi-backend IR translation loss | Medium | High | QASM 3.0 + annotations; validate round-trip per backend |

---

## 11. Next Steps

1. **Create quantum-circuit skill** — test `skill({name:"quantum-circuit"})` + `available()`
2. **Register agents** in `openaxe.jsonc` — verify subagent depth limit
3. **Prototype kanban-swarm** — circuit worker + noise/backend verifiers
4. **Implement QASM 3.0 IR** — round-trip validation on all 3 SDKs
5. **Schedule `metis` consultation** — on architecture tradeoffs (IR granularity, agent granularity)
6. **Schedule `momus` review** — of this architecture before Phase 2