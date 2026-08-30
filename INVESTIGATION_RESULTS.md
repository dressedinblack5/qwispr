# Quantic OpenAxe AI Assistant - Investigation Results

**Status**: Complete - All 4 Tracks Delivered  
**Date**: 2026-08-29  
**Investigation Period**: Single session (parallel background agents)  
**Next Phase**: Implementation planning (pending user decision)

---

## Executive Summary

This investigation establishes a comprehensive foundation for building a **Quantic Coding Assistant** as an OpenAxe/Paseo extension. The assistant sits **above** existing quantum SDKs (Qiskit, Cirq, PennyLane, Braket, etc.) providing quantum-aware code completion, transpilation advisory, error mitigation automation, cost estimation, and hybrid workflow orchestration.

**Key Finding**: The competitive landscape has a critical gap — no tool combines multi-backend support, agent-native orchestration, cost awareness, and quantum-specific intelligence. OpenAxe's Paseo agent model is uniquely positioned to fill this gap.

---

## Deliverables Produced

### Track A: Quantic Coding Landscape (5 Research Files)
| File | Lines | Coverage |
|------|-------|----------|
| `research/qiskit-1x-production-patterns.md` | 881 | Circuit construction, transpiler pipeline, Runtime primitives (SamplerV2/EstimatorV2), BackendV2/Target, Noise modeling, Patterns (VQE/QAOA/QML) |
| `research/cirq-v1-patterns.md` | 1084 | GridQubit/LineQubit/NamedQubit, Gate→Operation, Moment/InsertStrategy, Simulators (5 types), Google Quantum AI (Engine/Processor/QVM), Noise models (3-method override), Transformer API, Parameter resolution |
| `research/pennylane-patterns.md` | 1013 | QNode (decorator/constructor), Device-agnostic execution, 4 autodiff interfaces, Templates (embedding/ansatz), Measurements (12+ types), Optimizers (classical + shot-adaptive), Devices (7 built-in + 40+ plugins), qchem/VQE |
| `research/prior-art-quantum-coding-assistants.md` | 606 | Classiq, Qiskit Code Assistant (dead), Horizon/QMware, Braket SDK, Academic (Q#/Silq/Quipper), Emerging (TensorCircuit/Yao.jl/CUDA-Q) — comparison matrix + 8 gap opportunities |

### Track B: OpenAxe Integration Architecture
- **`architecture/quantic-integration.md`** — Full component architecture, workspace model, agent registry, skill system, unified IR (QASM 3.0 + QIR), context management for large circuits, kanban-swarm delegation patterns, implementation priority (4 phases), risk mitigation

### Track C: Advantage Quantification Framework
- **`analysis/advantage-framework.md`** — 5 measurable dimensions (Problem Space Access, Code Correctness, Optimization Quality, Learning Acceleration, Hardware Adaptivity) with hypotheses, validation methods, benchmark suite (20 circuits × 5 backends), statistical plan, feasibility assessment for OpenAxe core integration

### Track D: Next-Generation Vision (2-5 Years)
- **`vision/next-gen-roadmap.md`** — Phased capabilities (Year 1: Quantum-Aware Assistant → Year 4-5: Self-Optimizing Quantum Stack), dependency graph, technical evolution vectors (context, agents, IR, hardware), market positioning, investment requirements, success metrics, go/no-go decision points

---

## Critical Insights

### 1. The "Assistant Layer" Strategy is Correct
- **Don't build**: Simulators, languages, cloud platforms, hardware
- **Do build**: Agent that understands quantum physics + orchestrates existing tools
- **Moat**: Open + Multi-backend + Agent-native + Cost-aware

### 2. OpenAxe/Paseo Provides 80% of Required Infrastructure
| Need | OpenAxe/Paseo Provides | Gap |
|------|------------------------|-----|
| Workspace isolation | ✅ `workspace create --isolation worktree` | Quantum adapter |
| Specialized agents | ✅ Custom agents in `openaxe.jsonc` | Quantum agent templates |
| Skill system | ✅ Discovery + loading + permissions | Quantum skills |
| Task delegation | ✅ Kanban-swarm (worker + verifiers) | Quantum workflow templates |
| Context management | ✅ Compaction + spill + handoff | Large circuit streaming |
| Scheduling | ✅ Paseo schedule + OpenAxe scheduler | Variational loop integration |
| Multi-user | 🔄 Workspace sharing (planned) | Collaboration features |

### 3. Unified IR is the Linchpin
**QASM 3.0 + QIR (LLVM)** with metadata annotations enables:
- Write once (any SDK) → transpile to any backend
- Cross-backend comparison (depth, fidelity, cost)
- Assistant reasoning on canonical representation
- Round-trip validation per backend

### 4. Context Management for Large Circuits is Solvable
**Streaming spill + metadata preview** pattern:
- Full QASM spilled to `compaction/tool-outputs/<session>/circuit_<hash>.qasm`
- 2k char preview + structured metadata kept in context
- `ghostSkills: ["quantum-circuit"]` detection preserves intent
- Handoff briefing includes calibration data + fidelity estimates

### 5. Advantage is Measurable and Significant
| Dimension | Target Advantage | Validation |
|-----------|------------------|------------|
| Problem Space Access | Quantum-native (BQP) vs Classical only | Benchmark: Shor, Grover, VQE, QAOA |
| Code Correctness | >85% F1 on quantum bug detection | 250 injected bugs × 5 classes |
| Optimization Quality | >1.3x depth/fidelity vs baseline | 100 circuit×backend transpilations |
| Learning Acceleration | >3x novice time-to-VQE | 20 user study |
| Hardware Adaptivity | >5x porting speed, >90% fidelity retention | 10 circuits × 4 backends |

---

## OpenAxe Core Integration Feasibility

### Must-Have (Low Effort, High Impact) — **Add to OpenAxe Core**
1. **Quantum workspace type** — Extend `Workspace.Service` adapter registry
2. **Ghost skills detection in compaction** — Add `ghostSkills` to `Compressor.compress()` input
3. **Document subagent depth limit for quantum** — `experimental.subagent_depth_limit: 3`

### Should-Have (Medium Effort, High Impact) — **Add to OpenAxe Core**
4. **Custom compaction hook API** — Skills register `compactionHooks` for domain spill
5. **Structured summary quantum section** — Add `quantumContext` to summary schema
6. **Paseo schedule persistence** — Survive daemon restart for variational loops

### Nice-to-Have (Future) — **Defer**
7. QIR/LLVM integration (if language server support added)
8. Multi-user workspace sync (collaborative quantum development)

---

## Implementation Priority (Phased)

### Phase 1 (Week 1-2): Foundation
- [ ] `quantum-circuit` skill (SDK templates, transpiler patterns)
- [ ] `quantum-backend` skill (comparison, cost estimator, queue monitor)
- [ ] Quantum workspace adapter (OpenAxe + Paseo)
- [ ] QASM 3.0 IR parser/generator

### Phase 2 (Week 2-3): Intelligence
- [ ] `quantum-noise` skill (noise models, ZNE/PEC/CDR automation)
- [ ] `quantum-transpiler` skill (cross-platform transpilation advisor)
- [ ] Circuit-agent + backend-agent + noise-agent registration
- [ ] Kanban-swarm workflow (circuit → noise → backend verification)

### Phase 3 (Week 3-4): Hybrid Orchestration
- [ ] `quantum-hybrid` skill (VQE/QAOA loop, classical optimizer integration)
- [ ] `quantum-optimizer` skill (gradient methods, shot-adaptive)
- [ ] Hybrid-agent for end-to-end variational loops
- [ ] Paseo schedule integration for automated iterations

### Phase 4 (Month 2+): Next-Gen
- [ ] `quantum-tutor` skill (adaptive learning, QuantumKatas integration)
- [ ] Self-optimizing transpiler (ML-driven pass selection)
- [ ] Collaborative quantum IDE (multi-user Paseo workspaces)
- [ ] Autonomous error mitigation discovery

---

## Risk Register Summary

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| SDK API volatility (Qiskit 2.0) | High | Medium | Target stable 1.x; QASM 3.0 IR as buffer |
| Context window too small | High | High | Streaming spill + metadata preview (designed) |
| No real hardware access | High | Low | Simulator-first; fake backends (FakeBrisbane, QSimSimulator) |
| Skill permission complexity | Medium | Medium | Start read-only (`explore`-like); escalate gradually |
| IR translation loss | Medium | High | QASM 3.0 + annotations; validate round-trip per backend |

---

## Recommended Next Steps

### Immediate (This Session)
1. **User reviews** this investigation results document
2. **User decides** which tracks to pursue (all / subset / modified)
3. **If proceeding**: Fire `metis` for architecture tradeoff consultation

### Week 1 (If Approved)
1. Create `quantum-circuit` skill + test `skill({name:"quantum-circuit"})`
2. Register agents in `openaxe.jsonc`
3. Prototype kanban-swarm: circuit worker + noise/backend verifiers
4. Implement QASM 3.0 IR round-trip on Qiskit/Cirq/PennyLane

### Week 2
1. `metis` consultation on IR granularity, agent granularity
2. Build `quantum-backend` + `quantum-noise` skills
3. Run first benchmark suite (5 circuits × 3 backends)
4. `momus` review of architecture before Phase 2

---

## File Inventory

```
quantna/
├── INVESTIGATION_PLAN.md           # Original plan
├── INVESTIGATION_RESULTS.md        # This file
├── research/
│   ├── qiskit-1x-production-patterns.md
│   ├── cirq-v1-patterns.md
│   ├── pennylane-patterns.md
│   └── prior-art-quantum-coding-assistants.md
├── architecture/
│   └── quantic-integration.md
├── analysis/
│   └── advantage-framework.md
├── vision/
│   └── next-gen-roadmap.md
└── prototypes/                     # (empty - for Phase 1)
```

---

## Decision Request

**Please choose one:**

1. **Proceed with full implementation** — All 4 phases as designed
2. **Proceed with Phase 1 only** — Foundation (skills, workspace, IR, agents)
3. **Proceed with modified scope** — Specify which tracks/priorities change
4. **Pause** — Investigate specific area deeper first (specify which)
5. **Different direction** — Describe alternative approach

**Once you decide**, I'll:
- Fire `metis` for pre-planning consultation (if proceeding)
- Create detailed `to-tickets` for implementation
- Begin Phase 1 prototype work