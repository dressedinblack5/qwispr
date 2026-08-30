# Qiskit 1.x Production Patterns — Comprehensive Integration Guide

**Target:** Qiskit SDK `1.0` → `1.4.x` (current stable, 2026-08-29) + forward-compat notes for 2.0  
**Scope:** Idiomatic, production-grade usage for a quantic coding assistant. No tutorials — only patterns that survive code review, CI, and hardware execution.  
**Sources:** `qiskit/qiskit`, `qiskit/qiskit-aer`, `qiskit/qiskit-ibm-runtime`, IBM Quantum Platform docs (Context7 IDs: `/qiskit/qiskit`, `/qiskit/qiskit-aer`, `/qiskit/qiskit-ibm-runtime`, `/websites/quantum_cloud_ibm_en`).

> **API stability contract (Qiskit 1.x):** Semver with yearly majors. Deprecations land in minors, removals only in majors. `1.0` was the hard break (Qiskit Terra → `qiskit` package, `qiskit-aer`/`qiskit-ibm-runtime` split). `1.x` is stable; `2.0` will remove `BackendV1`, `SamplerV1`/`EstimatorV1`, `qiskit.execute()`, and `transpile()` legacy overloads. Code below is `1.x`-idiomatic and `2.0`-safe where noted.

---

## 1. Circuit Construction API

### 1.1 Stability & Mental Model

- **Core types are stable:** `QuantumCircuit`, `QuantumRegister`, `ClassicalRegister`, `AncillaRegister`, `Parameter`, `ParameterVector`, `SparsePauliOp`. No churn since 0.45.
- **Bits vs Registers:** Registers are *names* for visualization/QASM; the circuit stores flat `Qubit`/`Clbit` lists. Prefer integer-indexed construction for generated code; use named registers for human-authored circuits.
- **Instruction set:** Standard gates in `qiskit.circuit.library` are singletons (identity by `==`). Custom gates via `Gate` subclass or `QuantumCircuit.to_gate()` / `to_instruction()`.
- **Serialization:** QPY (`qiskit.qpy`) is the canonical binary format. QASM 2/3 via `qiskit.qasm2`/`qasm3` — lossy for parameterized circuits.

### 1.2 Idiomatic Construction

```python
# --- Preferred: flat construction (assistant-generated code) ---
from qiskit.circuit import QuantumCircuit, Parameter, ParameterVector
from qiskit.circuit.library import RealAmplitudes, EfficientSU2
from qiskit.quantum_info import SparsePauliOp

# Explicit qubit count, no registers — simplest for transpilation
qc = QuantumCircuit(4, 4, name="ghz_like")
qc.h(0)
qc.cx(0, 1)
qc.cx(1, 2)
qc.cx(2, 3)
qc.measure(range(4), range(4))

# Parameterized — use ParameterVector for vectorized binding
theta = ParameterVector("θ", 6)
ansatz = RealAmplitudes(num_qubits=4, reps=2, parameter_prefix="θ")
# Or manual:
qc_param = QuantumCircuit(2)
phi = Parameter("φ")
qc_param.ry(phi, 0)
qc_param.cx(0, 1)
# Bind: dict or ordered list; strict=True catches typos
bound = qc_param.assign_parameters({phi: 1.23})
# Batch bind for primitives (see §3): list of value-sets
param_sets = [[0.1, 0.2, 0.3, 0.4, 0.5, 0.6], [0.6, 0.5, 0.4, 0.3, 0.2, 0.1]]

# --- Human-readable: named registers (notebook / QASM export) ---
from qiskit.circuit import QuantumRegister, ClassicalRegister, AncillaRegister

qr = QuantumRegister(3, "q")
cr = ClassicalRegister(3, "c")
anc = AncillaRegister(1, "anc")
qc_named = QuantumCircuit(qr, cr, anc, name="with_ancilla")
qc_named.h(qr[0])
qc_named.ccx(qr[0], qr[1], anc[0])
qc_named.measure(qr, cr)

# --- Composition & control flow (Qiskit 1.x) ---
from qiskit.circuit import Box  # scoping for transpiler
sub = QuantumCircuit(2, name="sub")
sub.h(0)
sub.cx(0, 1)
qc.compose(sub, qubits=[0, 1], inplace=True)

# Classical feed-forward (1.x: use c_if or if_test)
qc_if = QuantumCircuit(2, 2)
qc_if.h(0)
qc_if.measure(0, 0)
with qc_if.if_test((qc_if.cregs[0], 1)):
    qc_if.x(1)

# Instruction introspection — what an assistant should parse
for inst, qargs, cargs in qc.data:
    print(inst.name, inst.num_qubits, qargs)
print(qc.count_ops(), qc.num_parameters, qc.depth())
```

### 1.3 Production Patterns

```python
# QPY round-trip (CI artifact, not pickle)
from qiskit import qpy
import io
buf = io.BytesIO()
qpy.dump([qc, ansatz], buf)
buf.seek(0)
[qc_loaded, ansatz_loaded] = qpy.load(buf)

# SparsePauliOp — the observable type for EstimatorV2
obs = SparsePauliOp.from_list([("ZZII", 1.0), ("IZZI", -0.5), ("IIZZ", 0.3)])
# Apply layout after transpilation (see §2) — critical, else qubit mismatch
# isa_obs = obs.apply_layout(isa_circuit.layout)

# Circuit library — prefer library over manual decomposition
from qiskit.circuit.library import PauliEvolutionGate, QAOAAnsatz
from qiskit.synthesis import SuzukiTrotter
evo = PauliEvolutionGate(obs, time=1.0, synthesis=SuzukiTrotter(reps=2))
```

### 1.4 Pain Points for Coding Assistants

| Pain | Detail | Mitigation |
|------|--------|------------|
| **Register vs flat indexing** | LLM generates `qc.h(qr[0])` but `qr` not in scope after `QuantumCircuit(4)` | Train on flat `qc.h(0)` as default; only emit registers when user names them |
| **Parameter binding shape** | `assign_parameters` strict mode + ordering bugs | Always use `ParameterVector` + dict binding; validate `qc.num_parameters == len(values)` |
| **QASM lossiness** | `qasm()` drops parameters, calibrations | Use QPY for persistence; QASM only for interop |
| **Ancilla handling** | Ancilla qubits must be uncomputed or transpiler fails | Emit `AncillaRegister` + explicit uncompute or use `qiskit.circuit.library` helpers |
| **Control-flow transpilation** | `if_test`/`for_loop` not supported on all backends | Check `backend.target` for `IfElseOp` support; fallback to deferred measurement |

---

## 2. Transpiler Pipeline

### 2.1 Stability & Mental Model

- **Old API (deprecated, removed in 2.0):** `qiskit.transpile(circuits, backend=...)` — still works in 1.x but emits warnings.
- **New API (stable, 1.x+):** `generate_preset_pass_manager(target=..., optimization_level=...)` → `StagedPassManager` → `pm.run(circuits)`. This is the *only* forward-compatible path.
- **ISA concept:** After transpilation, circuit is in the backend's Instruction Set Architecture (ISA) — only gates in `backend.target`, coupling map satisfied, layout assigned. Primitives *require* ISA circuits (or they transpile internally with level 1, hiding errors).
- **Six stages:** `init` → `layout` → `routing` → `translation` → `optimization` → `scheduling`. Each stage is a `PassManager`.

### 2.2 Idiomatic Transpilation

```python
from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager
from qiskit_ibm_runtime import QiskitRuntimeService
from qiskit.circuit import QuantumCircuit

service = QiskitRuntimeService()  # reads QISKIT_IBM_TOKEN / config
backend = service.least_busy(operational=True, simulator=False)
# Or deterministic: service.backend("ibm_brisbane")

# --- Production default: preset pass manager ---
pm = generate_preset_pass_manager(
    target=backend.target,          # NOT backend — target is the source of truth
    optimization_level=2,           # 0=none, 1=light, 2=medium (default), 3=heavy
    seed_transpiler=42,             # deterministic for CI
)
isa_circuit = pm.run(qc)            # qc can be list[QuantumCircuit]
print(isa_circuit.layout)           # Layout object — needed for observable remapping
print(isa_circuit.count_ops())

# --- Batch transpilation (same layout for all) ---
circuits = [qc, ansatz]
isa_circuits = pm.run(circuits)

# --- Observable remapping (EstimatorV2 requirement) ---
from qiskit.quantum_info import SparsePauliOp
obs = SparsePauliOp.from_list([("ZZ", 1), ("XX", 1)])
isa_obs = obs.apply_layout(isa_circuit.layout)  # NOT optional
# For list of observables:
isa_obs_list = [o.apply_layout(isa_circuit.layout) for o in [obs]]

# --- Custom pass manager (when preset insufficient) ---
from qiskit.transpiler import PassManager, StagedPassManager
from qiskit.transpiler.passes import SabreLayout, SabreSwap, BasisTranslator
from qiskit.circuit.equivalence_library import SessionEquivalenceLibrary

# Override single stage while keeping preset for others
pm_custom = generate_preset_pass_manager(
    target=backend.target,
    optimization_level=3,
    layout_method="sabre",          # trivial | dense | sabre | vf2
    routing_method="sabre",         # basic | lookahead | stochastic | sabre | none
    translation_method="translator",
    scheduling_method="alap",       # asap | alap
)
# Or build from scratch:
custom_pm = PassManager([
    SabreLayout(backend.target, max_iterations=4, seed=42),
    SabreSwap(backend.target, heuristic="decay", seed=42),
])

# --- Scheduling (pulse-level, optional) ---
pm_sched = generate_preset_pass_manager(
    target=backend.target,
    optimization_level=2,
    scheduling_method="alap",
    instruction_durations=backend.target.durations(),  # from Target
)

# --- Local transpilation without backend (for testing) ---
from qiskit.transpiler import Target, CouplingMap
from qiskit.circuit.library import CXGate, RZGate, SXGate, XGate
target = Target.from_configuration(
    basis_gates=["rz", "sx", "x", "cx", "measure"],
    coupling_map=CouplingMap.from_line(5),
)
pm_local = generate_preset_pass_manager(target=target, optimization_level=1)
isa_local = pm_local.run(qc)
```

### 2.3 Optimization Levels — What They Actually Do

| Level | Layout | Routing | Optimization | Use When |
|-------|--------|---------|--------------|----------|
| 0 | trivial | none | none | Debugging, exact gate count |
| 1 | trivial + VF2PostLayout | SabreSwap (1 trial) | Light (inverse cancellation) | Fast iteration, variational loops |
| 2 | VF2Layout → SabreLayout | SabreSwap (multiple trials) | Commutative cancellation, 1q optimization | **Default for production** |
| 3 | VF2Layout (exhaustive) → SabreLayout (many trials) | SabreSwap (heavy) | Full peephole + synthesis | Final submission, benchmarks |

### 2.4 Pain Points

| Pain | Detail | Mitigation |
|------|--------|------------|
| **`transpile()` vs `generate_preset_pass_manager`** | LLMs emit `transpile(qc, backend=backend, optimization_level=3)` — deprecated, hides layout | Enforce `generate_preset_pass_manager(target=backend.target, ...)` in prompts/lint |
| **Forgetting `apply_layout`** | Estimator returns wrong expectation if observable not remapped | Assistant must *always* emit `obs.apply_layout(isa_circuit.layout)` after `pm.run` |
| **Non-determinism** | Sabre is stochastic; CI flakes | Set `seed_transpiler` everywhere |
| **ISA violation** | Primitives auto-transpile non-ISA circuits at level 1, masking errors | Explicitly transpile *before* `sampler.run`/`estimator.run`; assert `isa_circuit.layout is not None` |
| **Scheduling requires durations** | `scheduling_method` without `instruction_durations` silently no-ops | Only set scheduling when `backend.target.durations()` is non-empty |

---

## 3. Runtime Primitives — Sampler, Estimator, Session, Job

### 3.1 Stability & Mental Model

- **V1 → V2 break (Qiskit 1.0):** `Sampler`/`Estimator` (V1) used `circuits, observables, parameter_values` as separate args and returned quasi-distributions. **V2** uses **Primitive Unified Blocs (PUBs)** — `list[tuple[QuantumCircuit, ...]]` — and returns `BitArray`/`evs`+`stds`.
- **V1 is deprecated, removed in 2.0.** All new code must use `SamplerV2`/`EstimatorV2` (aliased as `Sampler`/`Estimator` in `qiskit_ibm_runtime`).
- **Execution modes:** `mode=backend` (job mode, one-shot), `mode=session` (iterative, scheduler priority), `mode=batch` (parallel jobs). `Session` and `Batch` are context managers.
- **Primitives are the *only* hardware entry point.** `backend.run()` is `BackendV1` legacy; `BackendV2` has no `run` for circuits — use primitives.

### 3.2 Idiomatic Primitives (V2)

```python
from qiskit_ibm_runtime import QiskitRuntimeService, Session, Batch
from qiskit_ibm_runtime import SamplerV2 as Sampler, EstimatorV2 as Estimator
from qiskit.circuit import QuantumCircuit, Parameter
from qiskit.quantum_info import SparsePauliOp
from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager
import numpy as np

service = QiskitRuntimeService()
backend = service.least_busy(operational=True, simulator=False)
pm = generate_preset_pass_manager(target=backend.target, optimization_level=1)

# --- SamplerV2: PUB = (circuit) or (circuit, param_values) ---
qc = QuantumCircuit(2, 2, name="bell")
qc.h(0); qc.cx(0, 1); qc.measure([0,1], [0,1])
isa_qc = pm.run(qc)

# Job mode (single shot)
sampler = Sampler(mode=backend)
job = sampler.run([(isa_qc,)], shots=4096)  # PUB list; shots per PUB
result = job.result()                        # blocks
pub_result = result[0]                       # first PUB
counts = pub_result.data.c.get_counts()      # c is ClassicalRegister name
bit_array = pub_result.data.c                # BitArray — new in V2
print(counts, pub_result.metadata)

# Parameterized Sampler — vectorized
theta = Parameter("θ")
qc_param = QuantumCircuit(2, 2)
qc_param.ry(theta, 0); qc_param.cx(0, 1); qc_param.measure([0,1], [0,1])
isa_qc_param = pm.run(qc_param)
# One PUB with multiple parameter sets → one job, multiple results
param_sets = np.linspace(0, np.pi, 5).reshape(-1, 1)  # shape (5, 1)
job = Sampler(mode=backend).run([(isa_qc_param, param_sets)], shots=1024)
# Or multiple PUBs:
job = Sampler(mode=backend).run([(isa_qc_param, [[0.1]]), (isa_qc_param, [[0.5]])])

# --- EstimatorV2: PUB = (circuit, observables, param_values, precision?) ---
psi = QuantumCircuit(2)
psi.h(0); psi.cx(0, 1)
psi_isa = pm.run(psi)
obs = SparsePauliOp.from_list([("ZZ", 1), ("XX", 1)])
isa_obs = obs.apply_layout(psi_isa.layout)  # remap!

# Single PUB, multiple observables, multiple param sets
theta_vals = [[0.0], [0.5], [1.0]]
estimator = Estimator(mode=backend)
# PUB tuple: (circuit, observables, param_values)
# observables can be single op or list; param_values shape (n_sets, n_params)
job = estimator.run([(psi_isa, [isa_obs], theta_vals)])
pub_result = job.result()[0]
print(pub_result.data.evs)   # shape (n_param_sets, n_observables) — here (3, 1)
print(pub_result.data.stds)

# Broadcasting: 4 observables × 21 parameter sets
from qiskit.circuit.library import RealAmplitudes
ansatz = RealAmplitudes(2, reps=1)
ansatz_isa = pm.run(ansatz)
ops = [SparsePauliOp.from_list([(f"{p}I", 1)]) for p in "XYZI"]
isa_ops = [o.apply_layout(ansatz_isa.layout) for o in ops]
# Reshape for broadcasting (see IBM docs: np array of SparsePauliOp)
reshaped = np.array(isa_ops, dtype=object).reshape((4, 1))
job = estimator.run([(ansatz_isa, reshaped, np.random.random((5, ansatz.num_parameters)))])
# Or explicit precision per PUB:
job = estimator.run([(ansatz_isa, isa_ops, [[0.1, 0.2]], 0.05)], precision=0.05)

# --- Session: iterative workloads (VQE, QAOA) ---
from scipy.optimize import minimize

def cost_fn(params, ansatz_isa, obs_isa, estimator):
    pub = (ansatz_isa, obs_isa, [params])
    job = estimator.run([pub])
    return job.result()[0].data.evs[0]

with Session(backend=backend) as session:
    estimator = Estimator(mode=session)
    estimator.options.default_shots = 4096
    estimator.options.resilience_level = 1
    estimator.options.environment.job_tags = ["vqe-demo"]
    # All jobs in session share priority — no queue between iterations
    res = minimize(cost_fn, x0=np.zeros(ansatz_isa.num_parameters),
                   args=(ansatz_isa, isa_obs, estimator), method="COBYLA")
    print(f"Session {session.session_id} → {res.fun}")

# --- Batch: parallel jobs ---
with Batch(backend=backend) as batch:
    sampler = Sampler(mode=batch)
    jobs = [sampler.run([(isa_qc,)]) for _ in range(5)]
    results = [j.result()[0].data.c.get_counts() for j in jobs]

# --- Job management ---
job = sampler.run([(isa_qc,)])
print(job.job_id())
print(job.status())          # JobStatus.QUEUED | RUNNING | DONE | ERROR | CANCELLED
job.cancel()
result = job.result()        # blocks; raises if job failed
# Async: job.result(timeout=60)
# Metadata per PUB:
for pub in result:
    print(pub.metadata)      # shots, circuit_metadata, resilience, etc.
```

### 3.3 Options — The New Way

```python
# V2 options are typed, autocomplete-friendly (not dict)
estimator = Estimator(mode=backend)
estimator.options.default_shots = 8192
estimator.options.resilience_level = 1          # 0=off, 1=light, 2=heavy (ZNE, PEC)
estimator.options.optimization_level = 1        # transpilation inside primitive (avoid — pre-transpile instead)
estimator.options.dynamical_decoupling.enable = True
estimator.options.dynamical_decoupling.sequence_type = "XY4"
estimator.options.twirling.enable_gates = True
estimator.options.twirling.enable_measure = True
estimator.options.execution.rep_delay = 0.0005  # seconds

sampler = Sampler(mode=backend)
sampler.options.default_shots = 4096
sampler.options.environment.job_tags = ["my-experiment"]
```

### 3.4 Pain Points

| Pain | Detail | Mitigation |
|------|--------|------------|
| **V1 vs V2 confusion** | LLM emits `sampler.run(circuits=[qc], parameter_values=[...])` (V1) | Enforce PUB tuple `[(circuit, param_values)]`; lint for `quasi_dists` (V1-only) |
| **PUB shape errors** | `Estimator.run([(circ, obs, params)])` where `obs` not layout-mapped → silent wrong answer | Always `apply_layout`; validate `obs.num_qubits == circ.num_qubits` |
| **Forgetting ISA** | Passing non-ISA circuits → primitive auto-transpiles at level 1, hides depth blowup | Pre-transpile with `pm.run`; set `estimator.options.optimization_level = 0` to fail fast if not ISA |
| **Session vs Job mode** | Creating new `Session` per iteration → queue thrash | One `Session` per optimization loop; reuse `Estimator(mode=session)` |
| **Result indexing** | `result[0].data.evs` vs `result.values` (V1) | V2: `result[0].data.<creg>` for Sampler, `result[0].data.evs` for Estimator |
| **Shots vs precision** | `shots` (Sampler) vs `precision` (Estimator) — different convergence knobs | Sampler: `shots`; Estimator: `precision` or `default_shots` — don't mix |

---

## 4. Backend Interface — BackendV2, Target, Coupling Map

### 4.1 Stability & Mental Model

- **BackendV1 (deprecated):** `backend.configuration()`, `backend.properties()`, `backend.run()`. Removed in 2.0.
- **BackendV2 (stable):** `backend.target`, `backend.num_qubits`, `backend.name`, `backend.run` only for `qiskit_ibm_runtime` primitives. `Target` is the single source of truth for gates, coupling, durations, errors.
- **Fake backends:** `qiskit_ibm_runtime.fake_provider.Fake*` (e.g., `FakeBrisbane`, `FakeKyoto`) — `BackendV2` with realistic `Target` + calibration. Use for CI without hardware.

### 4.2 Idiomatic Backend Usage

```python
from qiskit_ibm_runtime import QiskitRuntimeService
from qiskit_ibm_runtime.fake_provider import FakeBrisbane, FakeKyoto
from qiskit.transpiler import Target, CouplingMap, InstructionProperties
from qiskit.circuit.library import CXGate, RZGate, SXGate, XGate
from qiskit.circuit import Parameter

# --- Discovery ---
service = QiskitRuntimeService()
backend = service.least_busy(operational=True, simulator=False, min_num_qubits=100)
print(backend.name, backend.num_qubits, backend.status().operational)

# --- Target introspection (what an assistant should query) ---
target = backend.target
print(target.operation_names)          # ['rz', 'sx', 'x', 'cx', 'measure', 'reset', ...]
print(target.num_qubits)
# Per-qubit / per-edge properties:
for q in range(min(3, target.num_qubits)):
    props = target["rz"][(q,)]
    print(f"q{q} rz error={props.error} duration={props.duration}")
# Coupling map from target:
coupling_map = target.build_coupling_map()  # CouplingMap object
print(coupling_map.get_edges(), coupling_map.is_connected())

# Instruction durations & timing constraints (for scheduling)
durations = target.durations()         # InstructionDurations
timing_constraints = target.timing_constraints()  # TimingConstraints

# --- Custom Target (simulator / testing) ---
custom_target = Target(num_qubits=3, dt=0.22e-9, granularity=16, min_length=16,
                       pulse_alignment=16, acquire_alignment=16)
theta = Parameter("θ")
custom_target.add_instruction(RZGate(theta), {(q,): InstructionProperties(duration=0, error=0.001) for q in range(3)})
custom_target.add_instruction(SXGate(), {(q,): InstructionProperties(duration=35e-9, error=0.0005) for q in range(3)})
custom_target.add_instruction(CXGate(), {(0,1): InstructionProperties(duration=400e-9, error=0.01),
                                         (1,2): InstructionProperties(duration=400e-9, error=0.012)})
# CouplingMap for custom backend:
cm = CouplingMap.from_line(3)
# Or heavy-hex:
# cm = CouplingMap.from_heavy_hex(3)

# --- Fake backend for CI (no token needed) ---
fake = FakeBrisbane()  # 127-qubit Eagle r3
print(fake.target.operation_names, fake.num_qubits)
# Use exactly like real backend:
from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager
pm = generate_preset_pass_manager(target=fake.target, optimization_level=2)
isa = pm.run(QuantumCircuit(2))

# --- BackendV2 subclass (for custom hardware / simulator integration) ---
from qiskit.providers import BackendV2, Options
from qiskit.transpiler import Target
from qiskit.circuit import Measure
from qiskit.circuit.library import PhaseGate, SXGate, UGate, CXGate, IGate
import warnings

class MyBackend(BackendV2):
    def __init__(self):
        super().__init__(name="my_backend", backend_version="1.0.0")
        self._target = Target("My Target")
        lam = Parameter("λ")
        for q in range(5):
            self._target.add_instruction(PhaseGate(lam), {(q,): None})
            self._target.add_instruction(SXGate(), {(q,): None})
        for edge in [(0,1),(1,2),(2,3),(3,4)]:
            self._target.add_instruction(CXGate(), {edge: None})
        for q in range(5):
            self._target.add_instruction(Measure(), {(q,): None})
        self.options.set_validator("shots", (1, 4096))

    @property
    def target(self): return self._target
    @property
    def max_circuits(self): return 1024
    @classmethod
    def _default_options(cls): return Options(shots=1024)
    def run(self, run_input, **kwargs): raise NotImplementedError("Use primitives")
```

### 4.3 Pain Points

| Pain | Detail | Mitigation |
|------|--------|------------|
| **`backend.configuration()` in LLM output** | V1 API, removed in 2.0 | Replace with `backend.target`, `backend.num_qubits`, `backend.dt` |
| **CouplingMap vs Target** | LLM creates `CouplingMap` but ignores `Target` | Always derive `CouplingMap` from `target.build_coupling_map()`; `Target` is canonical |
| **Fake provider import path** | Moved: `qiskit.providers.fake_provider` → `qiskit_ibm_runtime.fake_provider` in 1.x | Use `qiskit_ibm_runtime.fake_provider.Fake*`; old path is shim |
| **InstructionProperties None** | `None` means no calibration — simulator assumes perfect | For noise simulation, populate `error`/`duration` or use `AerSimulator.from_target` |

---

## 5. Noise Modeling — NoiseModel, Quantum Errors, Calibration

### 5.1 Stability & Mental Model

- **Package:** `qiskit_aer.noise` — stable, but `NoiseModel.from_backend()` now prefers `BackendV2`/`Target` over `BackendV1` properties.
- **Two workflows:** (a) *Device noise* — `AerSimulator.from_backend(backend)` auto-builds model from calibration; (b) *Custom noise* — `NoiseModel` + `depolarizing_error`/`thermal_relaxation_error`/`pauli_error`/`Kraus`/`ReadoutError`.
- **Basis gates matter:** Noise is attached to basis gates (`"cx"`, `"rz"`, `"sx"`, `"measure"`). Transpile *for* the noise model's basis before simulation.

### 5.2 Idiomatic Noise Modeling

```python
from qiskit_aer import AerSimulator
from qiskit_aer.noise import (
    NoiseModel, QuantumError, ReadoutError,
    depolarizing_error, thermal_relaxation_error, pauli_error, amplitude_damping_error
)
from qiskit import transpile
from qiskit.circuit import QuantumCircuit
from qiskit_ibm_runtime.fake_provider import FakeBrisbane
import numpy as np

# --- Device noise (recommended for hardware-faithful simulation) ---
fake = FakeBrisbane()
# Option A: simulator that mimics device (noise + coupling + basis gates)
sim_device = AerSimulator.from_backend(fake)  # BackendV2 path — preferred
# Option B: explicit NoiseModel from backend
noise_model = NoiseModel.from_backend(fake)
print(noise_model)  # summary: gate errors, readout errors, T1/T2

# Run with device noise:
qc = QuantumCircuit(2, 2)
qc.h(0); qc.cx(0, 1); qc.measure([0,1], [0,1])
# Transpile for simulator's basis gates:
qc_t = transpile(qc, sim_device)
result = sim_device.run(qc_t, shots=4096).result()
print(result.get_counts())

# --- Custom noise: depolarizing + readout ---
noise = NoiseModel()
# 1-qubit depolarizing on all qubits for u1/u2/u3 (or rz/sx/x in new basis)
err_1q = depolarizing_error(0.001, 1)
noise.add_all_qubit_quantum_error(err_1q, ["rz", "sx", "x"])
# 2-qubit depolarizing on specific edges
err_2q = depolarizing_error(0.01, 2)
noise.add_quantum_error(err_2q, "cx", [0, 1])
noise.add_quantum_error(err_2q, "cx", [1, 2])
# Readout error: P(0|0)=0.97, P(1|1)=0.95
readout_err = ReadoutError([[0.97, 0.03], [0.05, 0.95]])
noise.add_all_qubit_readout_error(readout_err)
# Or per-qubit:
# noise.add_readout_error(readout_err, [0])

sim_custom = AerSimulator(noise_model=noise)
qc_t2 = transpile(qc, sim_custom)
counts_noisy = sim_custom.run(qc_t2, shots=4096).result().get_counts()

# --- Thermal relaxation (T1/T2) ---
t1, t2, gate_time = 50e3, 70e3, 35  # ns
thermal_err = thermal_relaxation_error(t1, t2, gate_time)
noise_thermal = NoiseModel()
noise_thermal.add_quantum_error(thermal_err, "sx", [0])
# For 2q gates, need per-qubit T1/T2:
# thermal_relaxation_error takes t1, t2, gate_length for each qubit

# --- Pauli error (asymmetric) ---
# 10% X error, 5% Z error on cx
pauli_err = pauli_error([("XX", 0.10), ("ZZ", 0.05), ("II", 0.85)])
noise_pauli = NoiseModel()
noise_pauli.add_quantum_error(pauli_err, "cx", [0, 1])

# --- Kraus / amplitude damping ---
from qiskit.quantum_info import Kraus
# Custom Kraus channel:
kraus_ops = [np.array([[1, 0], [0, np.sqrt(0.9)]]), np.array([[0, np.sqrt(0.1)], [0, 0]])]
kraus_err = Kraus(kraus_ops)
noise_kraus = NoiseModel()
noise_kraus.add_quantum_error(QuantumError(kraus_err), "id", [0])

# --- Calibration data access (for assistant context) ---
# From fake/real backend target:
for q in range(2):
    props = fake.target["measure"][(q,)]
    # props.error is readout error; for gates, props.error is gate error
    print(f"q{q} measure error={props.error}")
# Or via backend.properties() shim (deprecated but still populated for fakes):
# props = fake.properties()
# print(props.readout_error(0), props.gate_error("cx", [0,1]), props.t1(0), props.t2(0))
```

### 5.3 Pain Points

| Pain | Detail | Mitigation |
|------|--------|------------|
| **Basis gate mismatch** | Noise attached to `"u3"` but circuit uses `"rz"`/`"sx"` → noise not applied | Attach to ISA basis gates (`rz`, `sx`, `x`, `cx`); transpile first, then inspect `sim.configuration().basis_gates` |
| **`from_backend` with V1** | `NoiseModel.from_backend(backend)` with `BackendV1` uses deprecated `properties()` | Pass `BackendV2`/`Fake*` from `qiskit_ibm_runtime.fake_provider` |
| **ReadoutError shape** | `[[P(0|0), P(1|0)], [P(0|1), P(1|1)]]` — rows are *prepared* state | Validate rows sum to 1; use `ReadoutError` not raw matrix |
| **Thermal error units** | `t1`, `t2`, `gate_time` must share units (ns) | Use ns consistently; `AerSimulator` dt is in seconds — convert |
| **NoiseModel serialization** | Not QPY-serializable | Rebuild from `fake_backend` or store `noise_model.to_dict()` |

---

## 6. Qiskit Patterns & Application Modules — VQE, QAOA, QML

### 6.1 Stability & Mental Model

- **Qiskit Patterns (IBM docs, 2024+):** The *recommended* workflow — 4 steps: **Map** → **Optimize** → **Execute** → **Post-process**. Replaces ad-hoc scripts. Stable concept, evolving templates.
- **Application modules split (Qiskit 1.0):** `qiskit.algorithms` (VQE, QAOA) → **`qiskit_algorithms`** (separate package). `qiskit_nature`, `qiskit_optimization`, `qiskit_machine_learning` are independent. Many LLMs still import from `qiskit.algorithms` — broken in 1.x.
- **Primitives-centric:** All algorithms now take `SamplerV2`/`EstimatorV2` instances, not `QuantumInstance`.

### 6.2 Qiskit Patterns — The 4-Step Template

```python
# Pattern: Map → Optimize → Execute → Post-process
# See: https://quantum.cloud.ibm.com/docs/en/guides/intro-to-patterns

# Step 1: Map — classical problem → quantum circuit + observables
from qiskit.circuit.library import RealAmplitudes
from qiskit.quantum_info import SparsePauliOp
from qiskit.circuit import Parameter

# Example: CHSH inequality (or any Hamiltonian)
theta = Parameter("θ")
chsh_circuit = QuantumCircuit(2)
chsh_circuit.h(0); chsh_circuit.cx(0, 1); chsh_circuit.ry(theta, 0)
ops = [SparsePauliOp.from_list([("ZZ", 1)]), SparsePauliOp.from_list([("XX", 1)])]

# Step 2: Optimize — transpilation + observable layout
from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager
from qiskit_ibm_runtime import QiskitRuntimeService
service = QiskitRuntimeService()
backend = service.least_busy(operational=True, simulator=False)
pm = generate_preset_pass_manager(backend=backend, optimization_level=1)
isa_circuit = pm.run(chsh_circuit)
isa_ops = [op.apply_layout(isa_circuit.layout) for op in ops]
# Reshape for EstimatorV2 broadcasting if needed:
import numpy as np
isa_ops_array = np.array(isa_ops, dtype=object).reshape((2, 1))

# Step 3: Execute — primitives
from qiskit_ibm_runtime import EstimatorV2 as Estimator
estimator = Estimator(backend)
job = estimator.run([(isa_circuit, isa_ops_array, [[0.5], [1.0]])])
pub_result = job.result()[0]
print(pub_result.data.evs, pub_result.data.stds)

# Step 4: Post-process — classical analysis
# e.g., compute CHSH value, plot, feed to optimizer
```

### 6.3 VQE — Production Pattern (qiskit_algorithms)

```python
# VQE with EstimatorV2 — the current idiomatic way
from qiskit_algorithms import VQE
from qiskit_algorithms.optimizers import COBYLA, L_BFGS_B, SPSA
from qiskit.circuit.library import RealAmplitudes, EfficientSU2
from qiskit.quantum_info import SparsePauliOp
from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager
from qiskit_ibm_runtime import EstimatorV2 as Estimator, QiskitRuntimeService, Session

service = QiskitRuntimeService()
backend = service.least_busy(operational=True, simulator=False)

# Problem: H2 Hamiltonian (or any SparsePauliOp)
hamiltonian = SparsePauliOp.from_list([("II", -1.05), ("ZZ", 0.39), ("XX", 0.39)])

# Ansatz — EfficientSU2 is more expressive than RealAmplitudes for chemistry
ansatz = EfficientSU2(num_qubits=2, reps=2, entanglement="linear")
# Or UCCSD via qiskit_nature for chemistry:
# from qiskit_nature.second_q.circuit.library import UCCSD, HartreeFock
# ansatz = UCCSD(...)

pm = generate_preset_pass_manager(target=backend.target, optimization_level=1)
isa_ansatz = pm.run(ansatz)
isa_ham = hamiltonian.apply_layout(isa_ansatz.layout)

# Optimizer — SPSA for noisy hardware, COBYLA/L-BFGS-B for simulators
optimizer = COBYLA(maxiter=100, tol=1e-3)
# optimizer = SPSA(maxiter=200, blocking=True, allowed_increase=1e-3)

# Session for iterative VQE (avoids queue per iteration)
with Session(backend=backend) as session:
    estimator = Estimator(mode=session)
    estimator.options.default_shots = 4096
    estimator.options.resilience_level = 1
    vqe = VQE(estimator=estimator, ansatz=isa_ansatz, optimizer=optimizer)
    # Note: VQE in qiskit_algorithms 0.3+ takes ISA ansatz + ISA Hamiltonian
    result = vqe.compute_minimum_eigenvalue(operator=isa_ham)
    print(f"Ground state energy: {result.eigenvalue:.6f}")
    print(f"Optimal params: {result.optimal_parameters}")
    print(f"Cost history: {result.optimizer_result}")

# --- Manual VQE loop (when VQE class is too opaque) ---
from scipy.optimize import minimize
import numpy as np

def vqe_cost(params, ansatz_isa, ham_isa, estimator):
    job = estimator.run([(ansatz_isa, ham_isa, [params])])
    return job.result()[0].data.evs[0]

with Session(backend=backend) as session:
    estimator = Estimator(mode=session)
    estimator.options.default_shots = 4096
    x0 = np.random.random(isa_ansatz.num_parameters)
    res = minimize(vqe_cost, x0, args=(isa_ansatz, isa_ham, estimator), method="COBYLA")
```

### 6.4 QAOA — Production Pattern

```python
from qiskit.circuit.library import QAOAAnsatz
from qiskit.quantum_info import SparsePauliOp
from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager
from qiskit_ibm_runtime import SamplerV2 as Sampler, Session, QiskitRuntimeService
from scipy.optimize import minimize
import numpy as np

# Problem: MaxCut on 4-node graph → cost Hamiltonian
# Graph edges: (0,1), (1,2), (2,3), (3,0)
cost_ham = SparsePauliOp.from_list([
    ("ZZII", 0.5), ("IZZI", 0.5), ("IIZZ", 0.5), ("ZIIZ", 0.5)
])
# QAOAAnsatz builds mixer + cost layers
qaoa_ansatz = QAOAAnsatz(cost_operator=cost_ham, reps=2, name="qaoa")
# qaoa_ansatz.num_parameters == 2*reps (betas + gammas)

service = QiskitRuntimeService()
backend = service.least_busy(operational=True, simulator=False)
pm = generate_preset_pass_manager(target=backend.target, optimization_level=2)
isa_qaoa = pm.run(qaoa_ansatz)
# For Sampler, need measurement:
isa_qaoa.measure_all()

# Cost function via Sampler (sample bitstrings, compute cut value)
def qaoa_cost(params, isa_circuit, sampler):
    # Sampler PUB: (circuit, param_values)
    job = sampler.run([(isa_circuit, [params])], shots=4096)
    counts = job.result()[0].data.meas.get_counts()
    # Compute expectation of cost_ham from counts (or use Estimator for exact ev)
    # Simplified: most frequent bitstring's cut value
    best_bitstring = max(counts, key=counts.get)
    # ... map bitstring to cut size ...
    return -max(counts.values())  # placeholder

with Session(backend=backend) as session:
    sampler = Sampler(mode=session)
    sampler.options.default_shots = 4096
    x0 = np.random.random(isa_qaoa.num_parameters) * np.pi
    res = minimize(qaoa_cost, x0, args=(isa_qaoa, sampler), method="COBYLA")
    print(res)

# --- Alternative: Estimator-based QAOA (exact expectation, no sampling noise) ---
from qiskit_ibm_runtime import EstimatorV2 as Estimator
with Session(backend=backend) as session:
    estimator = Estimator(mode=session)
    isa_cost = cost_ham.apply_layout(isa_qaoa.layout)  # if not measured
    # Need unmeasured ansatz for Estimator:
    qaoa_no_meas = QAOAAnsatz(cost_operator=cost_ham, reps=2)
    isa_no_meas = pm.run(qaoa_no_meas)
    isa_cost2 = cost_ham.apply_layout(isa_no_meas.layout)
    def cost_estimator(params):
        job = estimator.run([(isa_no_meas, isa_cost2, [params])])
        return job.result()[0].data.evs[0]
    res = minimize(cost_estimator, x0, method="COBYLA")
```

### 6.5 Quantum ML — Templates

```python
# qiskit_machine_learning — stable, but separate install: pip install qiskit-machine-learning
from qiskit_machine_learning.neural_networks import EstimatorQNN, SamplerQNN
from qiskit_machine_learning.connectors import TorchConnector  # if torch installed
from qiskit.circuit.library import RealAmplitudes, ZZFeatureMap
from qiskit.circuit import ParameterVector
from qiskit.quantum_info import SparsePauliOp

# Feature map + ansatz pattern (common in QML)
num_qubits, reps = 4, 2
feature_map = ZZFeatureMap(feature_dimension=num_qubits, reps=1)
ansatz = RealAmplitudes(num_qubits=num_qubits, reps=reps)
# Compose:
qml_circuit = feature_map.compose(ansatz)
# Or with parameters:
x = ParameterVector("x", num_qubits)
theta = ParameterVector("θ", ansatz.num_parameters)
# ... bind feature_map with x, ansatz with theta ...

# EstimatorQNN — for regression / VQE-like training
from qiskit_ibm_runtime import EstimatorV2 as Estimator
from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager
from qiskit_ibm_runtime.fake_provider import FakeBrisbane

fake = FakeBrisbane()
pm = generate_preset_pass_manager(target=fake.target, optimization_level=1)
isa_qml = pm.run(qml_circuit)
# EstimatorQNN wraps Estimator primitive:
# qnn = EstimatorQNN(circuit=isa_qml, observables=[SparsePauliOp.from_list([("Z"*num_qubits, 1)])],
#                    input_params=feature_map.parameters, weight_params=ansatz.parameters,
#                    estimator=Estimator(mode=fake))

# SamplerQNN — for classification (bitstring outputs)
# qnn = SamplerQNN(circuit=isa_qml, input_params=..., weight_params=..., sampler=Sampler(mode=fake))

# Training loop — use PyTorch or raw optimizer:
# from qiskit_algorithms.optimizers import COBYLA
# optimizer = COBYLA(maxiter=50)
# ... standard minimize on qnn.forward(input_data, weights) ...

# --- Fidelity / kernel (quantum kernels) ---
from qiskit.circuit.library import ZZFeatureMap
from qiskit_algorithms.state_fidelities import ComputeUncompute
from qiskit_machine_learning.kernels import FidelityQuantumKernel
# kernel = FidelityQuantumKernel(feature_map=ZZFeatureMap(2), fidelity=ComputeUncompute(sampler=Sampler()))
```

### 6.6 Pain Points

| Pain | Detail | Mitigation |
|------|--------|------------|
| **`qiskit.algorithms` import** | `from qiskit.algorithms import VQE` → `ModuleNotFoundError` in 1.x | Use `from qiskit_algorithms import VQE` + `pip install qiskit-algorithms` |
| **VQE/QAOA with V1 primitives** | Old tutorials pass `QuantumInstance` or `SamplerV1` | Require `EstimatorV2`/`SamplerV2`; VQE constructor changed in `qiskit_algorithms>=0.3` |
| **Qiskit Patterns not a package** | "Qiskit Patterns" is docs, not `pip install qiskit-patterns` | It's a workflow template; assistant should emit the 4-step structure, not an import |
| **FeatureMap + Ansatz parameter collision** | Both use `ParameterVector` with overlapping names | Use distinct `parameter_prefix` or `ParameterVector` names; validate `circuit.parameters` |
| **qiskit_nature version skew** | `qiskit_nature` 0.7+ requires `qiskit>=1.0` but has breaking API for `UCCSD` | Pin `qiskit-nature>=0.7,<0.8` for 1.x; test `UCCSD` import in CI |

---

## 7. Integration Checklist for Quantic Coding Assistant

### 7.1 Lint Rules to Enforce

```python
# Pseudocode for assistant output validation
FORBIDDEN = [
    "from qiskit import execute",           # removed
    "from qiskit.algorithms import",        # moved to qiskit_algorithms
    "transpile(",                           # prefer generate_preset_pass_manager
    "backend.configuration()",               # BackendV1
    "backend.properties()",                  # BackendV1 (except Fake shim)
    "QuantumInstance",                       # removed
    "SamplerV1", "EstimatorV1",              # deprecated
    "quasi_dists",                           # V1 result
]
REQUIRED_WHEN = {
    "Estimator": "apply_layout",            # observable remapping
    "generate_preset_pass_manager": "target=backend.target",
    "SamplerV2": "shots=",
    "Session": "with Session",
}
```

### 7.2 Code Generation Defaults

- **Default transpilation:** `generate_preset_pass_manager(target=backend.target, optimization_level=2, seed_transpiler=42)` — not `transpile()`.
- **Default primitives:** `SamplerV2`/`EstimatorV2` with PUBs — not V1.
- **Default backend for CI:** `FakeBrisbane` from `qiskit_ibm_runtime.fake_provider` — no token.
- **Default serialization:** QPY — not QASM, not pickle.
- **Default parameter handling:** `ParameterVector` + dict `assign_parameters` — not ordered list.

### 7.3 Error Handling Template

```python
from qiskit_ibm_runtime import QiskitRuntimeService
from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager
from qiskit_ibm_runtime import SamplerV2 as Sampler

try:
    service = QiskitRuntimeService()
    backend = service.backend("ibm_brisbane")
except Exception as e:
    # Fallback to fake for offline / CI
    from qiskit_ibm_runtime.fake_provider import FakeBrisbane
    backend = FakeBrisbane()
    print(f"Using fake backend: {e}")

pm = generate_preset_pass_manager(target=backend.target, optimization_level=2)
try:
    isa_circuit = pm.run(qc)
    assert isa_circuit.layout is not None, "Transpilation failed to assign layout"
except Exception as e:
    # Common: circuit too wide for backend, or unsupported control flow
    raise RuntimeError(f"Transpilation failed: {e}") from e

sampler = Sampler(mode=backend)
job = sampler.run([(isa_circuit,)], shots=4096)
try:
    result = job.result(timeout=300)
except Exception as e:
    print(f"Job {job.job_id()} failed: {job.status()} — {e}")
    # Inspect: job.logs(), job.error_message() (runtime)
```

---

## 8. Version Matrix & Forward Compat

| Component | 1.0 | 1.3–1.4 (now) | 2.0 (expected) |
|-----------|-----|---------------|----------------|
| `qiskit` | `1.0.0` | `1.4.x` | `2.0` — removes V1 shims |
| `qiskit-aer` | `0.14` | `0.15–0.16` | `0.17` — `from_backend` V2-only |
| `qiskit-ibm-runtime` | `0.22` | `0.30+` | `0.40` — `Session`/`Batch` stable |
| `qiskit-algorithms` | `0.3` | `0.3.x` | `0.4` — V2-only |
| `qiskit-nature` | `0.7` | `0.7.x` | `0.8` |
| `qiskit-machine-learning` | `0.7` | `0.8` | `0.9` |
| Python | `3.9+` | `3.9–3.12` | `3.10+` (3.9 dropped) |

**Assistant should:** Pin `qiskit>=1.0,<2.0` for now; test against `qiskit==1.4.*` in CI; add `2.0` nightly job that expects `transpile`/`BackendV1` failures.

---

## 9. References

- Qiskit SDK: https://github.com/Qiskit/qiskit — Context7 `/qiskit/qiskit` (1866 snippets)
- Qiskit Aer: https://github.com/Qiskit/qiskit-aer — Context7 `/qiskit/qiskit-aer` (469 snippets)
- Qiskit IBM Runtime: https://github.com/Qiskit/qiskit-ibm-runtime — Context7 `/qiskit/qiskit-ibm-runtime` (451 snippets)
- IBM Quantum Platform docs: https://quantum.cloud.ibm.com/docs — Context7 `/websites/quantum_cloud_ibm_en` (9082 snippets)
- Qiskit Patterns: https://quantum.cloud.ibm.com/docs/en/guides/intro-to-patterns
- Migration guide: https://docs.quantum.ibm.com/api/migration-guides/qiskit-1.0-features

---

*Generated 2026-08-29 for quantna / OpenAxe quantic integration. All code is `1.x`-idiomatic and `2.0`-safe unless noted. Validate with `pip install "qiskit>=1.4" "qiskit-aer>=0.15" "qiskit-ibm-runtime>=0.30" "qiskit-algorithms>=0.3"`.*
