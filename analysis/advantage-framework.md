# Quantic Advantage Quantification Framework

**Status**: Analysis Phase - Defines measurable advantages over classical AI coding assistants  
**Date**: 2026-08-29  
**Sources**: Track A landscape research, Track B architecture, prior art gap analysis

---

## 1. Advantage Dimensions & Hypotheses

### Dimension 1: Problem Space Access (Quantum-Native Algorithms)

| Aspect | Classical AI Assistant | Quantic Assistant | Advantage |
|--------|----------------------|-------------------|-----------|
| **Algorithmic reach** | Classical algorithms only | Quantum algorithms (Shor, Grover, VQE, QAOA, QML) | **Access to BQP problems** |
| **Simulation capability** | Classical state vectors | Quantum circuits on simulators + hardware | **Exponential state space** |
| **Optimization landscape** | Gradient descent on classical loss | Variational quantum eigensolvers | **Non-convex quantum landscapes** |

**Hypothesis**: Quantic assistant enables solving problems in BQP\P (quantum advantage regime) that classical assistants cannot even represent.

**Validation Method**:
- Benchmark suite: Factorization (Shor), unstructured search (Grover), ground state energy (VQE), combinatorial optimization (QAOA)
- Metric: Problem solvability (yes/no) + time-to-solution
- Baseline: Classical assistant attempting same problems (will fail at representation)

---

### Dimension 2: Code Correctness (Formal Verification via Quantum Types)

| Aspect | Classical AI Assistant | Quantic Assistant | Advantage |
|--------|----------------------|-------------------|-----------|
| **Type system** | Classical types (int, float, List) | Quantum types (Qubit, Circuit, Observable, NoiseModel) | **Quantum invariants enforced** |
| **No-cloning theorem** | Not enforced | Type-level linear/affine types prevent cloning | **Catch quantum bugs at compile time** |
| **Measurement collapse** | Runtime error | Type tracks measurement vs unitary | **Prevents invalid mid-circuit measurement** |
| **Entanglement tracking** | None | Type tracks entanglement structure | **Optimization hints, error detection** |

**Hypothesis**: Quantum-aware type system catches 80%+ of quantum-specific bugs (cloning, mid-circuit measurement on entangled qubits, wrong observable basis) at "compile time" (assistant analysis time).

**Validation Method**:
- Bug injection study: Seed 50 quantum programs with known bug classes
- Measure: Detection rate by quantic assistant vs classical assistant vs human expert
- Metric: Precision/recall per bug class

---

### Dimension 3: Optimization Quality (AI-Assisted Transpilation)

| Aspect | Classical AI Assistant | Quantic Assistant | Advantage |
|--------|----------------------|-------------------|-----------|
| **Transpilation awareness** | None (text completion only) | Full transpiler pass manager integration | **Hardware-aware optimization** |
| **Cross-backend comparison** | Manual | Automated: "This circuit is 40% deeper on Rigetti vs IonQ" | **Informed backend selection** |
| **Layout optimization** | None | SabreLayout, VF2PostLayout, targeting coupling map | **2-5x depth reduction** |
| **Error-aware routing** | None | Noise-adaptive routing (avoid high-error CX) | **Fidelity improvement** |

**Hypothesis**: Quantic assistant's transpilation advisor achieves 30-50% better circuit depth/fidelity than manual transpilation by domain experts.

**Validation Method**:
- Benchmark: 20 circuits (GHZ, QFT, VQE ansatz, QAOA, random) across 5 backends (IBM Brisbane, IonQ Harmony, Rigetti Ankaa, Google Willow, Braket SV1)
- Metrics: Transpiled depth, 2q gate count, estimated fidelity (from calibration), actual hardware fidelity (where accessible)
- Baseline: Qiskit `transpile(circuit, backend, optimization_level=3)` default

---

### Dimension 4: Learning Acceleration (Quantum-Native Abstractions)

| Aspect | Classical AI Assistant | Quantic Assistant | Advantage |
|--------|----------------------|-------------------|-----------|
| **Mental model** | Classical code patterns | Quantum circuit patterns (ansatz, kernel, observable) | **Right abstraction level** |
| **Template library** | Generic code snippets | Hardware-efficient ansatz, QAOA mixer, UCCSD, feature maps | **Best-practice starting points** |
| **Error explanation** | Generic Python errors | "You measured qubit 2 before uncomputing — this collapses entanglement with qubit 5" | **Quantum-specific pedagogy** |
| **Visualization** | Text output | Circuit diagrams, Bloch spheres, expectation value landscapes | **Intuition building** |

**Hypothesis**: Novices reach first working variational circuit 3-5x faster with quantic assistant vs classical assistant + documentation.

**Validation Method**:
- User study: 20 participants (10 quantum novices, 10 experienced)
- Task: Implement VQE for H2 molecule ground state
- Metrics: Time to first energy evaluation, time to convergence < 1mHa, number of quantum-specific bugs
- Control: Classical assistant + PennyLane docs

---

### Dimension 5: Hardware Adaptivity (Auto-Retargeting)

| Aspect | Classical AI Assistant | Quantic Assistant | Advantage |
|--------|----------------------|-------------------|-----------|
| **Backend abstraction** | None | Unified IR → auto-transpile to any backend | **Write once, run anywhere** |
| **Calibration awareness** | None | Real-time calibration data → noise-adaptive transpilation | **Fidelity optimization** |
| **Queue/cost optimization** | None | "IonQ queue: 2min, $12. IBM queue: 45min, free tier. Recommend IonQ for this circuit." | **Cost/time Pareto frontier** |
| **Heterogeneous workflow** | Manual | Classical preprocessing → quantum kernel → classical postprocess | **Seamless hybrid** |

**Hypothesis**: Auto-retargeting reduces porting effort from days to minutes, with <10% fidelity loss vs hand-tuned per-backend.

**Validation Method**:
- Port 10 circuits across 4 backends
- Measure: Human hours to port (manual) vs assistant minutes (auto)
- Fidelity delta: Hand-tuned vs auto-transpiled on hardware

---

## 2. Benchmark Suite Definition

### 2.1 Circuit Benchmarks (Transpilation Quality)

```python
# benchmarks/circuits/
benchmarks = {
    "ghz_50q": {"qubits": 50, "depth": 50, "type": "entanglement"},
    "qft_20q": {"qubits": 20, "depth": 400, "type": "fourier"},
    "vqe_h2_uccsd": {"qubits": 12, "depth": 200, "type": "chemistry", "params": 50},
    "qaoa_maxcut_30q": {"qubits": 30, "depth": 100, "type": "optimization", "params": 60},
    "hardware_efficient_100q": {"qubits": 100, "depth": 50, "type": "ansatz", "params": 300},
    "quantum_kernel_50q": {"qubits": 50, "depth": 200, "type": "qml", "params": 100},
    "surface_code_17q": {"qubits": 17, "depth": 20, "type": "error_correction"},
    "random_50q_200d": {"qubits": 50, "depth": 200, "type": "random"},
}
```

### 2.2 Backend Targets (Simulated + Real)

| Backend | Qubits | Topology | Simulator | Real Access |
|---------|--------|----------|-----------|-------------|
| IBM Brisbane | 127 | Heavy-hex | `FakeBrisbane` | IBM Cloud (queue) |
| IonQ Harmony | 11 | All-to-all | `IonQSimulator` | IonQ Cloud (queue) |
| Rigetti Ankaa | 84 | Octagonal | `RigettiQVM` | Rigetti Cloud |
| Google Willow | 105 | Grid | `QSimSimulator` | Google QCS (limited) |
| Braket SV1 | 34 | All-to-all | `BraketLocal` | AWS Braket (on-demand) |

### 2.3 Metrics Collection

```python
# For each circuit × backend combination:
metrics = {
    "transpiled_depth": int,
    "two_qubit_gate_count": int,
    "single_qubit_gate_count": int,
    "estimated_fidelity": float,  # from calibration + error model
    "transpilation_time_sec": float,
    "assistant_time_sec": float,  # time for assistant to optimize
    "actual_fidelity": float,  # if hardware run
    "cost_usd": float,  # estimated or actual
    "queue_time_sec": float,
}
```

---

## 3. Comparative Baselines

### 3.1 Classical Assistant Baseline
- **Tool**: GitHub Copilot / Cursor / Claude Code (no quantum skills)
- **Input**: Same prompts, same SDK docs access
- **Limitation**: No quantum type awareness, no transpiler integration

### 3.2 Manual Expert Baseline
- **Tool**: Human quantum software engineer (3+ years)
- **Input**: Same requirements, full SDK access
- **Measurement**: Time, quality, bugs introduced

### 3.3 SDK Default Baseline
- **Tool**: `transpile(circuit, backend, optimization_level=3)` (Qiskit) / `cirq.optimize_for_target_gateset` / `qml.transforms.optimize`
- **No AI assistance**

---

## 4. Statistical Validation Plan

### 4.1 Sample Sizes
- Circuits: 20 diverse benchmarks × 5 backends = 100 transpilation tasks
- User study: 20 participants × 2 conditions = 40 sessions
- Bug injection: 50 programs × 5 bug classes = 250 test cases

### 4.2 Significance Thresholds
- Transpilation depth improvement: >20% with p<0.01 (paired t-test)
- Bug detection: >75% recall with >90% precision
- Learning acceleration: >2x speedup with p<0.05
- Porting effort: >5x reduction with p<0.01

### 4.3 Confounding Controls
- Randomize circuit order
- Blind evaluators to condition (assistant vs baseline)
- Same hardware calibration snapshot for all runs
- Fixed random seeds for stochastic optimizers

---

## 5. Advantage Scoring Matrix

| Dimension | Weight | Scoring Method | Target Score |
|-----------|--------|----------------|--------------|
| Problem Space Access | 0.25 | Binary (solves/doesn't) + time | 1.0 (quantum-native) |
| Code Correctness | 0.20 | F1 score on bug detection | >0.85 |
| Optimization Quality | 0.25 | Geometric mean depth/fidelity ratio | >1.3x baseline |
| Learning Acceleration | 0.15 | Time-to-convergence ratio | >3x novice |
| Hardware Adaptivity | 0.15 | Porting time ratio + fidelity retention | >5x time, >90% fidelity |

**Composite Advantage Score** = Σ(weight × normalized_score)

**Target**: Composite > 0.8 (on 0-1 scale where 0.5 = parity with best baseline)

---

## 6. Continuous Benchmarking Infrastructure

### 6.1 Automated Pipeline
```yaml
# .github/workflows/quantic-benchmark.yml
on:
  schedule: [cron: "0 2 * * *"]  # Daily
  workflow_dispatch:

jobs:
  benchmark:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        circuit: [ghz_50q, qft_20q, vqe_h2_uccsd, qaoa_maxcut_30q, ...]
        backend: [ibm_brisbane, ionq_harmony, rigetti_ankaa, google_willow, braket_sv1]
    steps:
      - uses: actions/checkout@v4
      - name: Run quantic assistant transpilation
        run: python -m quantna.benchmark transpile --circuit ${{matrix.circuit}} --backend ${{matrix.backend}}
      - name: Run baseline transpilation
        run: python -m quantna.benchmark baseline --circuit ${{matrix.circuit}} --backend ${{matrix.backend}}
      - name: Collect metrics
        run: python -m quantna.benchmark collect
      - name: Update dashboard
        run: python -m quantna.benchmark dashboard
```

### 6.2 Dashboard Metrics
- Transpilation depth ratio (assistant/baseline) over time
- Fidelity estimation accuracy (predicted vs actual)
- Cost estimation accuracy
- Bug detection rate by class
- User study results (when available)

---

## 7. Feasibility Assessment for OpenAxe Core Integration

### 7.1 High Feasibility (Core Package Changes)

| Feature | OpenAxe Core Change | Effort | Value |
|---------|---------------------|--------|-------|
| **Quantum workspace type** | Add `workspace.types.quantum` adapter | Low | High - isolates quantum projects |
| **Agent registry extensions** | Add `circuit-agent`, `noise-agent`, etc. to `openaxe.jsonc` | Low | High - specialized agents |
| **Skill discovery paths** | Already supports `skills.paths` + `skills.urls` | None | High - quantum skills loadable |
| **Kanban-swarm for verification** | Already implemented | None | High - circuit→noise→backend flow |
| **Context compaction spill** | Add `ghostSkills` detection + custom compaction hook | Medium | Critical - large circuits |

### 7.2 Medium Feasibility (Extensions via Skills/Agents)

| Feature | Implementation | Effort | Value |
|---------|----------------|--------|-------|
| **QASM 3.0 IR parser** | New skill `quantum-ir` with Rust/TS parser | Medium | High - unified representation |
| **Transpilation advisor** | `quantum-transpiler` skill wrapping Qiskit/Cirq/PennyLane passes | Medium | High - core intelligence |
| **Noise modeling** | `quantum-noise` skill with Aer/Cirq noise models | Medium | High - NISQ essential |
| **Cost estimator** | `quantum-cost` skill with pricing APIs | Low | Medium - practical value |

### 7.3 Lower Feasibility (Requires New Infrastructure)

| Feature | Blockers | Effort | Value |
|---------|----------|--------|-------|
| **Real hardware integration** | Auth, queue APIs, rate limits per provider | High | High (long-term) |
| **ML-driven pass selection** | Training data, model serving | High | Medium (future) |
| **Collaborative multi-user** | Paseo workspace sharing, conflict resolution | High | Medium |

---

## 8. Recommendation: What's Worth Adding to OpenAxe Core

### Must-Have (Low Effort, High Impact)
1. **Quantum workspace type** — Add to `control-plane/workspace.ts` adapter registry
2. **Ghost skills detection in compaction** — Add `ghostSkills` array to `Compressor.compress()` input
3. **Subagent depth limit config** — Already exists (`experimental.subagent_depth_limit`), just document for quantum

### Should-Have (Medium Effort, High Impact)
4. **Custom compaction hook API** — Allow skills to register `compactionHooks` for domain-specific spill
5. **Structured summary sections** — Add `quantumContext` to `structuredSummary` schema
6. **Paseo schedule persistence** — Ensure schedules survive daemon restart (for variational loops)

### Nice-to-Have (Future)
6. **QIR/LLVM integration** — If OpenAxe adds language server support
7. **Multi-user workspace sync** — For collaborative quantum development

---

## 9. Next Steps

1. **Run `metis` consultation** on advantage framework validity
2. **Prototype benchmark harness** — `deep` agent for benchmark implementation
3. **Create `to-tickets`** for Phase 1 implementation items
4. **Schedule `momus` review** of this framework before committing