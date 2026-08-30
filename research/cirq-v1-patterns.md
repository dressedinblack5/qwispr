# Cirq v1.x — Idiomatic API Patterns for Quantic Coding Assistant Integration

> **Version**: Cirq `1.8.0.dev0` (current stable `1.x`, Python 3.11+) — `cirq-core` + `cirq-google`
> **Sources**: `quantumlib/Cirq` @ `729c329` (2026-08-29), [quantumai.google/cirq](https://quantumai.google/cirq), Context7 `/quantumlib/cirq` (3347 snippets)
> **Focus**: API patterns, Google hardware integration, simulation workflows. No tutorials.

---

## 1. Circuit Construction — Circuit, Moment, Operation, Gate, Qubit

### 1.1 Qubit Types

Cirq qubits are `cirq.Qid` subclasses. Three concrete types cover all use-cases:

| Type | Constructor | Use |
|------|-------------|-----|
| `GridQubit` | `cirq.GridQubit(row, col)` | Google hardware — 2-D grid (Sycamore, Willow) |
| `LineQubit` | `cirq.LineQubit(x)` | Abstract 1-D line, simulator-friendly |
| `NamedQubit` | `cirq.NamedQubit("alice")` | Logical / named qubits |
| `LineQid` / `GridQid` | `cirq.LineQid(x, dimension=d)` | Qudits (d > 2) |

```python
import cirq

# GridQubit — hardware-native (row, col)
q00 = cirq.GridQubit(0, 0)
q01 = cirq.GridQubit(0, 1)
grid_qubits = cirq.GridQubit.rect(2, 3)  # 2x3 rectangle → 6 qubits

# LineQubit — simulator / abstract
q0, q1, q2 = cirq.LineQubit.range(3)
line_qubits = cirq.LineQubit.range(5)

# NamedQubit — logical
alice = cirq.NamedQubit("alice")
bob = cirq.NamedQubit("bob")

# Qid with dimension (qudit)
qutrit = cirq.LineQid(0, dimension=3)

# Qubit ordering matters for state vector indexing
print(sorted([q00, q01]))  # sorted by row, col
```

**Source**: `cirq-core/cirq/devices/grid_qubit.py` (`_BaseGridQid`), `line_qubit.py` (`_BaseLineQid`)

### 1.2 Gate → Operation

A `Gate` is qubit-agnostic; calling it on qubits produces an `Operation`.

```python
import cirq

q0, q1 = cirq.LineQubit.range(2)

# Gate (no qubits) vs Operation (gate + qubits)
h_gate: cirq.Gate = cirq.H          # HPowGate
h_op: cirq.Operation = cirq.H(q0)   # GateOperation

# Common gates — single qubit
# Pauli: X, Y, Z  |  Hadamard: H  |  Phase: S (= Z^0.5), T (= Z^0.25)
# Rotation: cirq.XPowGate(exponent=0.5), cirq.rx(rads), cirq.ry, cirq.rz
#   cirq.X**0.5  ==  cirq.XPowGate(exponent=0.5)
single_ops = [
    cirq.X(q0),
    cirq.Y(q0),
    cirq.Z(q0),
    cirq.H(q0),
    cirq.S(q0),
    cirq.T(q0),
    cirq.X(q0) ** 0.5,          # sqrt(X)
    cirq.Z(q0) ** 0.25,         # T gate equivalent
    cirq.rx(0.5)(q0),           # parameterized rotation
    cirq.PhasedXPowGate(phase_exponent=0.25, exponent=0.5).on(q0),
]

# Two-qubit gates
two_qubit_ops = [
    cirq.CNOT(q0, q1),          # alias: cirq.CX
    cirq.CZ(q0, q1),
    cirq.SWAP(q0, q1),
    cirq.ISWAP(q0, q1),
    cirq.FSimGate(theta=0.5, phi=0.1).on(q0, q1),  # Google native
]

# Measurement — creates MeasurementGate
m_op = cirq.measure(q0, q1, key="result")
m_named = cirq.measure_each(q0, q1)  # separate keys per qubit

# Custom gate via matrix
custom_gate = cirq.MatrixGate(matrix=[[0, 1], [1, 0]])  # == X
print(cirq.unitary(custom_gate))  # 2x2 unitary

# Gate modifiers
controlled_h = cirq.H.controlled()          # Controlled-H
print(cirq.unitary(cirq.X))                 # gate unitary
print(cirq.unitary(cirq.CNOT))              # 4x4 unitary
```

### 1.3 Moment

A `Moment` is a time-slice: operations on **disjoint** qubits that execute simultaneously.

```python
import cirq

q0, q1, q2 = cirq.LineQubit.range(3)

# Construct moments
m1 = cirq.Moment(cirq.H(q0), cirq.H(q1))  # parallel H
m2 = cirq.Moment(cirq.CNOT(q0, q1), cirq.X(q2))  # disjoint → same moment
# m_bad = cirq.Moment(cirq.H(q0), cirq.X(q0))  # ValueError: overlapping qubits

# Moment indexing
print(m1[q0])           # Operation on q0
print(m1[q0, q1])       # sub-Moment touching q0 or q1
print(q0 in m1)         # True

# Moment properties
print(m1.operations)    # tuple of Operations
print(m1.qubits)        # frozenset of qubits
```

**Source**: `cirq-core/cirq/circuits/moment.py` — `class Moment`

### 1.4 Circuit

`Circuit` is an ordered list of `Moment`s. `FrozenCircuit` is immutable/hashable.

```python
import cirq

q0, q1, q2 = cirq.LineQubit.range(3)

# --- Construction patterns ---

# 1. Varargs of Operations/Moments — auto-packs into moments (EARLIEST insertion)
circuit = cirq.Circuit(
    cirq.H(q0),
    cirq.CNOT(q0, q1),
    cirq.measure(q0, q1, key="m"),
)
print(circuit)
# q0: ───H───@───M('m')───
#            │   │
# q1: ───────X───M────────

# 2. Explicit moments (force alignment)
circuit2 = cirq.Circuit(
    cirq.Moment(cirq.H(q0)),
    cirq.Moment(cirq.H(q1)),
    cirq.Moment(cirq.CNOT(q0, q1)),
)

# 3. From moments iterable — each gate in separate moment
circuit3 = cirq.Circuit(cirq.Moment(cirq.H(q)) for q in cirq.LineQubit.range(3))

# 4. Append / insert with strategy
circuit = cirq.Circuit()
circuit.append(cirq.H(q0))                          # append at end
circuit.append([cirq.CNOT(q0, q1), cirq.H(q2)])     # batch append
circuit.insert(0, cirq.X(q0))                       # insert at moment index
circuit.insert(1, cirq.Z(q1), strategy=cirq.InsertStrategy.NEW)  # force new moment

# InsertStrategy: EARLIEST (default), NEW, INLINE, NEW_THEN_INLINE

# 5. GHZ builder (idiomatic list comprehension)
n = 5
qubits = cirq.LineQubit.range(n)
ghz = cirq.Circuit(
    cirq.H(qubits[0]),
    *[cirq.CNOT(qubits[i-1], qubits[i]) for i in range(1, n)],
    cirq.measure(*qubits, key="out"),
)

# --- Circuit queries ---
print(circuit.all_qubits())         # frozenset
print(circuit.all_operations())     # iterator
print(circuit.moments)              # tuple[Moment]
print(len(circuit))                 # number of moments
print(circuit.has_measurements())
print(cirq.unitary(circuit))        # unitary if no measurements (small circuits)

# --- FrozenCircuit (immutable, hashable, for dict keys / caching) ---
frozen = cirq.FrozenCircuit(cirq.H(q0), cirq.CNOT(q0, q1))
print(hash(frozen))

# --- Diagram ---
print(circuit.to_text_diagram(transpose=False))
```

**Source**: `cirq-core/cirq/circuits/circuit.py` (`AbstractCircuit`, `Circuit`), `insert_strategy.py`

---

## 2. Simulation — Simulator, DensityMatrixSimulator, Sweeps

### 2.1 Simulator Taxonomy

```
SimulatesSamples          → run() / run_sweep()  → Result (measurements)
SimulatesAmplitudes       → compute_amplitudes()
SimulatesExpectationValues→ simulate_expectation_values_sweep()
SimulatesFinalState       → simulate() / simulate_sweep() → TrialResult (state)
SimulatesIntermediateState→ simulate_moment_steps() → iterator over StepResult
```

| Simulator | State | Noise | Qubit limit | Use |
|-----------|-------|-------|-------------|-----|
| `cirq.Simulator` | State vector (`complex64/128`) | via `noise=` | ~20 qubits | Default, fastest |
| `cirq.DensityMatrixSimulator` | Density matrix | Kraus/mixture channels | ~10 qubits | Noisy circuits |
| `cirq.CliffordSimulator` | Stabilizer tableau | limited | ~100s qubits | Clifford-only |
| `cirq.ClassicalStateSimulator` | Classical bits | — | large | Classical circuits |
| `qsimcirq.QSimSimulator` | State vector (C++) | via noise | ~30 qubits | High-performance |

```python
import cirq
import numpy as np
import sympy

q0, q1 = cirq.LineQubit.range(2)
circuit = cirq.Circuit(cirq.H(q0), cirq.CNOT(q0, q1), cirq.measure(q0, q1, key="m"))

# --- cirq.Simulator (state vector) ---
sim = cirq.Simulator(seed=42)  # seed for reproducibility

# run: sampling (like hardware) — requires measurements
result = sim.run(circuit, repetitions=100)
print(result.histogram(key="m"))        # Counter: {0: ~50, 3: ~50} for Bell state
print(result.records["m"].shape)        # (100, 1, 2) — (reps, instances, qubits)
print(result.measurements["m"])         # (100, 2) convenience view

# simulate: full state vector access
sim_result = sim.simulate(circuit)
print(sim_result.final_state_vector)    # shape (4,) — [0.707, 0, 0, 0.707]
print(sim_result.state_vector())        # alias

# Step-by-step
for i, step in enumerate(sim.simulate_moment_steps(circuit)):
    print(f"After moment {i}: {step.state_vector()}")

# Amplitudes
amps = sim.compute_amplitudes(circuit, bitstrings=[0b00, 0b11])
print(amps)  # [0.707+0j, 0.707+0j]

# Expectation values
obs = cirq.Z(q0) * cirq.Z(q1)  # PauliString
exp_vals = sim.simulate_expectation_values(circuit, observables=[obs])
print(exp_vals)  # [1.0] for Bell state

# --- DensityMatrixSimulator (noisy) ---
dm_sim = cirq.DensityMatrixSimulator(seed=42)
dm_result = dm_sim.simulate(cirq.Circuit(cirq.H(q0)))
print(dm_result.final_density_matrix)   # 2x2 matrix

# --- Simulator options ---
sim_f64 = cirq.Simulator(dtype=np.complex128, split_untangled_states=True)
dm_sim = cirq.DensityMatrixSimulator(dtype=np.complex64, noise=cirq.depolarize(0.01))
```

**Source**: `cirq-core/cirq/sim/simulator.py`, `simulator_base.py`, `density_matrix_simulator.py`, `state_vector_simulator.py`

### 2.2 Parameter Sweeps

Sweeps are iterables of `ParamResolver`s. All simulators support `*_sweep` variants.

```python
import cirq
import sympy

q0, q1 = cirq.LineQubit.range(2)
theta = sympy.Symbol("theta")
phi = sympy.Symbol("phi")

# Parameterized circuit
circuit = cirq.Circuit(
    cirq.X(q0) ** theta,
    cirq.Z(q1) ** phi,
    cirq.CNOT(q0, q1),
    cirq.measure(q0, q1, key="m"),
)

sim = cirq.Simulator()

# --- Sweep constructors ---

# Linspace: equally spaced
sweep1 = cirq.Linspace("theta", start=0, stop=1, length=5)
# → theta = 0.0, 0.25, 0.5, 0.75, 1.0

# Points: explicit values
sweep2 = cirq.Points("theta", [0, 0.5, 1.0])

# Product: Cartesian product (sweep1 * sweep2)
sweep_product = cirq.Linspace("theta", 0, 1, 3) * cirq.Linspace("phi", 0, 1, 3)
# → 9 combinations

# Zip: parallel iteration (sweep1 + sweep2)
sweep_zip = cirq.Linspace("theta", 0, 1, 3) + cirq.Linspace("phi", 0, 1, 3)
# → 3 pairs: (theta=0,phi=0), (0.5,0.5), (1,1)

# ListSweep: list of dicts
sweep_list = cirq.ListSweep([{"theta": 0.1, "phi": 0.2}, {"theta": 0.9, "phi": 0.8}])

# ZipLongest: zip with padding

# --- Running sweeps ---

# run_sweep: sampling with sweep
results = sim.run_sweep(circuit, params=sweep_product, repetitions=100)
for result in results:
    print(result.params, result.histogram(key="m"))

# run_sweep_iter: lazy iterator (memory efficient)
for result in sim.run_sweep_iter(circuit, params=sweep1, repetitions=10):
    print(result.params)

# simulate_sweep: state vectors for each param set
sim_results = sim.simulate_sweep(circuit, params=cirq.Linspace("theta", 0, 1, 3))
for r in sim_results:
    print(r.params, r.final_state_vector)

# simulate_expectation_values_sweep
obs = cirq.Z(q0)
exp_sweep = sim.simulate_expectation_values_sweep(
    cirq.Circuit(cirq.X(q0) ** theta),
    observables=[obs],
    params=cirq.Linspace("theta", 0, 1, 5),
)
print(exp_sweep)  # list of [expectation] per param

# to_resolvers / to_sweep utilities
resolvers = cirq.to_resolvers({"theta": 0.5})  # dict → [ParamResolver]
sweep = cirq.to_sweep({"theta": 0.5})          # dict → ListSweep
```

**Source**: `cirq-core/cirq/study/sweeps.py` (`Linspace`, `Points`, `Product`, `Zip`, `ListSweep`), `sweepable.py`

---

## 3. Google Quantum AI Integration — Engine, Processor, Calibration, Device

### 3.1 Engine & Processor

`cirq-google` (`import cirq_google as cg`) provides the Quantum Engine API client.

```python
import cirq
import cirq_google as cg

# --- Engine (requires Google Cloud project with Quantum Engine API enabled) ---
engine = cg.Engine(project_id="my-gcp-project")

# List available processors
for proc in engine.list_processors():
    print(proc.processor_id, proc.get_device())

# Get a specific processor
processor = engine.get_processor("rainbow")  # or "willow", "weber", "sycamore"
print(processor.get_device())                # GridDevice with qubit layout
print(processor.list_calibrations())         # list of Calibration objects

# --- Running circuits on hardware ---

qubit = cirq.GridQubit(5, 5)
circuit = cirq.Circuit(cirq.X(qubit) ** 0.5, cirq.measure(qubit, key="m"))

# Via Engine (async job model)
program = engine.create_program(circuit)
job = program.run(params=cirq.ParamResolver({}), repetitions=1000)
results = job.results()  # blocks until complete → list[cirq.Result]

# Via Processor (direct)
results = processor.run(circuit, repetitions=1000)
results_sweep = processor.run_sweep(
    circuit, params=cirq.Linspace("theta", 0, 1, 5), repetitions=1000
)

# Via Sampler interface (cirq.Sampler compatible)
sampler = processor.get_sampler()
results = sampler.run(circuit, repetitions=1000)

# Batch execution
batch_results = processor.run_batch(
    programs=[circuit, circuit],
    params_list=[{}, {}],
    repetitions=1000,
)
```

**Source**: `cirq-google/cirq_google/engine/engine.py` (`Engine`), `abstract_processor.py` (`AbstractProcessor`)

### 3.2 Device Specifications

Devices encode hardware constraints: qubit connectivity, supported gates, timing.

```python
import cirq
import cirq_google as cg

# --- Built-in Google devices ---
device_sycamore = cg.Sycamore          # 54-qubit Sycamore grid
device_sycamore23 = cg.Sycamore23      # 23-qubit subset
device_willow = cg.Willow105           # 105-qubit Willow

# Device from processor
engine = cg.Engine(project_id="my-project")
device = engine.get_processor("rainbow").get_device()
print(device)                          # qubit grid diagram
print(device.qubits)                   # list[GridQubit]
print(device.metadata.qubit_set)       # set of qubits
print(device.metadata.nx_graph)        # networkx connectivity graph

# Validate circuit against device
circuit = cirq.Circuit(cirq.CNOT(cirq.GridQubit(0, 0), cirq.GridQubit(5, 5)))
try:
    device.validate_circuit(circuit)   # raises if non-adjacent CNOT
except ValueError as e:
    print(f"Invalid: {e}")

# Device specification (gate durations, valid gatesets)
spec = engine.get_processor("rainbow").get_device_specification()
for gateset in spec.valid_gate_sets:
    print(gateset.name)
    for gate in gateset.valid_gates:
        print(f"  {gate.id}: {gate.gate_duration_picos} ps")

# GridDevice creation (custom)
custom_device = cg.GridDevice(metadata=cg.GridDeviceMetadata(
    qubit_pairs=[(cirq.GridQubit(0, 0), cirq.GridQubit(0, 1))],
    gateset=cg.SYC_GATESET,
))
```

### 3.3 Calibration & Noise Properties

```python
import cirq
import cirq_google as cg

# --- Calibration data ---
engine = cg.Engine(project_id="my-project")
processor = engine.get_processor("rainbow")

# Fetch latest calibration
calibration = processor.get_current_calibration()
print(calibration.timestamp)            # milliseconds since epoch
print(calibration.metrics)              # dict of calibration metrics

# Calibration metrics include: single-qubit RB fidelity, readout errors,
# two-qubit XEB fidelity, T1/T2 times per qubit

# List historical calibrations
for cal in processor.list_calibrations():
    print(cal.timestamp, cal.metrics.keys())

# Helper: get calibration directly
cals = cg.get_engine_calibration("rainbow", "my-project")

# --- Noise model from calibration ---
# Load noise properties for a virtual processor
processor_id = "willow_pink"  # virtual: willow_pink, rainbow, weber
noise_props = cg.engine.load_device_noise_properties(processor_id)
noise_model = cg.NoiseModelFromGoogleNoiseProperties(noise_props)

# Use with simulator
import qsimcirq
sim = qsimcirq.QSimSimulator(noise=noise_model)
result = sim.run(cirq.Circuit(cirq.H(cirq.GridQubit(0, 0)), cirq.measure(cirq.GridQubit(0, 0), key="m")), repetitions=100)

# --- Quantum Virtual Machine (local hardware mock) ---
# Full QVM setup — mocks Engine interface locally with noise
processor_id = "willow_pink"
noise_props = cg.engine.load_device_noise_properties(processor_id)
noise_model = cg.NoiseModelFromGoogleNoiseProperties(noise_props)
sim = qsimcirq.QSimSimulator(noise=noise_model)
device = cg.engine.create_device_from_processor_id(processor_id)
cal = cg.engine.load_median_device_calibration(processor_id)

sim_processor = cg.engine.SimulatedLocalProcessor(
    processor_id=processor_id,
    sampler=sim,
    device=device,
    calibrations={cal.timestamp // 1000: cal},
)
sim_engine = cg.engine.SimulatedLocalEngine([sim_processor])

# Now use sim_engine like a real Engine
print(sim_engine.get_processor(processor_id).get_device())
results = sim_engine.get_processor(processor_id).run(
    cirq.Circuit(cirq.X(cirq.GridQubit(0, 0)), cirq.measure(cirq.GridQubit(0, 0), key="m")),
    repetitions=100,
)

# List virtual processors
print(cg.engine.list_virtual_processors())  # ["willow_pink", "rainbow", "weber"]
```

**Source**: `cirq-google/cirq_google/engine/calibration.py`, `calibration_to_noise_properties.py`, `cirq_google/devices/`

---

## 4. Noise Models — NoiseModel, ConstantQubitNoiseModel, Custom

### 4.1 NoiseModel Base

`NoiseModel` rewrites circuits by injecting noise operations. Override **one** of three methods; the others derive automatically.

```python
import cirq

# The three override points (implement at least one):
#   noisy_moments(moments, system_qubits) → Sequence[OP_TREE]
#   noisy_moment(moment, system_qubits)   → OP_TREE
#   noisy_operation(operation)             → OP_TREE
```

### 4.2 Built-in Noise Models

```python
import cirq

q0, q1 = cirq.LineQubit.range(2)
circuit = cirq.Circuit(cirq.H(q0), cirq.CNOT(q0, q1), cirq.measure(q0, q1, key="m"))

# --- ConstantQubitNoiseModel: same single-qubit noise after every moment ---
noise = cirq.ConstantQubitNoiseModel(cirq.depolarize(0.01))
# Also accepts any single-qubit gate/channel:
noise2 = cirq.ConstantQubitNoiseModel(cirq.amplitude_damp(0.1))
noise3 = cirq.ConstantQubitNoiseModel(cirq.phase_flip(0.05))
noise4 = cirq.ConstantQubitNoiseModel(cirq.bit_flip(0.02))

# Prepend vs append (default: append after each moment)
noise_prepend = cirq.ConstantQubitNoiseModel(cirq.depolarize(0.01), prepend=True)

# Shorthand: single-qubit gate auto-wraps to ConstantQubitNoiseModel
sim = cirq.DensityMatrixSimulator(noise=cirq.depolarize(0.01))  # implicit wrapping
sim2 = cirq.DensityMatrixSimulator(noise=cirq.ConstantQubitNoiseModel(cirq.depolarize(0.01)))

# --- NO_NOISE sentinel ---
sim_clean = cirq.DensityMatrixSimulator(noise=cirq.NO_NOISE)
sim_none = cirq.DensityMatrixSimulator(noise=None)  # also no noise

# --- NoiseModel.from_noise_model_like ---
# Converts None → NO_NOISE, Gate → ConstantQubitNoiseModel, NoiseModel → itself
model = cirq.NoiseModel.from_noise_model_like(cirq.depolarize(0.01))
model2 = cirq.NoiseModel.from_noise_model_like(None)

# --- Manual noise injection (without simulator) ---
noise_model = cirq.NoiseModel.from_noise_model_like(cirq.depolarize(0.01))
qreg = cirq.LineQubit.range(2)

# On single operation
noisy_op = noise_model.noisy_operation(cirq.CNOT(*qreg))

# On single moment
moment = cirq.Moment(cirq.H.on_each(qreg))
noisy_moment = noise_model.noisy_moment(moment, system_qubits=qreg)

# On sequence of moments
noisy_circuit = noise_model.noisy_moments(circuit, system_qubits=qreg)

# Build noisy circuit manually
system_qubits = sorted(circuit.all_qubits())
noisy_circuit = cirq.Circuit()
for moment in circuit:
    noisy_circuit.append(noise_model.noisy_moment(moment, system_qubits))
print(noisy_circuit)

# --- Common noise channels ---
# cirq.depolarize(p)              — depolarizing (p = error prob)
# cirq.amplitude_damp(gamma)      — T1 decay
# cirq.phase_damp(gamma)          — dephasing
# cirq.phase_flip(p)              — phase flip
# cirq.bit_flip(p)                — bit flip
# cirq.generalized_amplitude_damp(p, gamma)  — generalized
# cirq.depolarize(p, n_qubits=2)  — multi-qubit depolarizing (for custom models)
```

### 4.3 Custom Noise Models

```python
import cirq

# --- Custom: override noisy_operation ---
class MyNoiseModel(cirq.NoiseModel):
    def noisy_operation(self, operation: cirq.Operation) -> cirq.OP_TREE:
        # Add depolarizing after every non-measurement operation
        if isinstance(operation.gate, cirq.MeasurementGate):
            return operation
        # Return original op + noise on each qubit it touches
        return [
            operation,
            *[cirq.depolarize(0.01).on(q) for q in operation.qubits],
        ]

# --- Custom: override noisy_moment ---
class MomentNoiseModel(cirq.NoiseModel):
    def noisy_moment(self, moment: cirq.Moment, system_qubits) -> cirq.OP_TREE:
        if self.is_virtual_moment(moment):
            return moment  # skip virtual moments (e.g., tags)
        # Append depolarizing to every qubit after each moment
        return [moment, cirq.Moment(cirq.depolarize(0.005).on_each(*system_qubits))]

# --- InsertionNoiseModel: declarative noise insertion ---
from cirq.devices.noise_utils import OpIdentifier

insertion_noise = cirq.devices.InsertionNoiseModel(
    ops_added={
        OpIdentifier(cirq.H): cirq.depolarize(0.01).on(cirq.LineQubit(0)),
        # Maps gate type → noise operation to insert
    },
    prepend=False,
)

# --- Google hardware noise model ---
import cirq_google as cg
noise_props = cg.engine.load_device_noise_properties("rainbow")
google_noise = cg.NoiseModelFromGoogleNoiseProperties(noise_props)

# --- Using noise with simulators ---
# DensityMatrixSimulator: full density matrix (exact, expensive)
dm_sim = cirq.DensityMatrixSimulator(noise=cirq.ConstantQubitNoiseModel(cirq.depolarize(0.01)))
for i, step in enumerate(dm_sim.simulate_moment_steps(circuit)):
    print(f"Step {i}: purity={abs(step.density_matrix()).trace():.4f}")

# Simulator with noise: Monte Carlo trajectory (approximate, cheaper for large circuits)
sim = cirq.Simulator(noise=cirq.ConstantQubitNoiseModel(cirq.depolarize(0.01)))
result = sim.run(circuit, repetitions=1000)

# Virtual moments are skipped (tagged with VirtualTag)
virtual_op = cirq.X(cirq.LineQubit(0)).with_tags(cirq.VirtualTag())
```

**Source**: `cirq-core/cirq/devices/noise_model.py` (`NoiseModel`, `ConstantQubitNoiseModel`, `_NoNoiseModel`), `insertion_noise_model.py`, `noise_utils.py`

---

## 5. Transpilation / Optimization — Transformers, Decompose, Circuit Transformation

### 5.1 Transformer API

Cirq `1.x` uses **transformers** (replacing the legacy `Optimizer` class). Transformers are functions `Circuit → Circuit` with optional `TransformerContext`.

```python
import cirq

q0, q1, q2 = cirq.LineQubit.range(3)
circuit = cirq.Circuit(
    cirq.H(q1), cirq.CNOT(q1, q2), cirq.H(q0),
    cirq.CNOT(q0, q1), cirq.H(q1), cirq.CZ(q0, q1),
    cirq.H.on_each(q0, q1), cirq.CNOT(q2, q0),
    cirq.measure_each(q0, q1, q2),
)

# --- Transformer calling convention ---
# All transformers accept (circuit, context=None) and return a new circuit
optimized = cirq.eject_z(circuit)
optimized = cirq.eject_z(circuit, context=cirq.TransformerContext(deep=True))

# Chaining transformers (manual pipeline)
def optimize_circuit(circuit: cirq.Circuit, context=None, k=2) -> cirq.Circuit:
    c = cirq.merge_k_qubit_unitaries(circuit, k=k,
        rewriter=lambda op: op.with_tags("merged"), context=context)
    c = cirq.drop_negligible_operations(c, context=context)
    c = cirq.expand_composite(c,
        no_decomp=lambda op: "merged" not in op.tags, context=context)
    c = cirq.synchronize_terminal_measurements(c, context=context)
    return c

# TransformerContext controls logging, deep expansion, tags
ctx = cirq.TransformerContext(
    deep=True,           # recurse into CircuitOperations
    tags_to_ignore=(),   # tags to skip
    logger=cirq.TransformerLogger(show_progress=True),
)
```

### 5.2 Built-in Transformers (by category)

```python
import cirq

q0, q1 = cirq.LineQubit.range(2)
circuit = cirq.Circuit(cirq.H(q0), cirq.CNOT(q0, q1))

# --- Simplification ---
cirq.drop_empty_moments(circuit)              # remove empty moments
cirq.drop_negligible_operations(circuit)      # remove near-identity ops (e.g., X**1e-10)
cirq.drop_diagonal_before_measurement(circuit)# remove diagonal gates before measurement

# --- Ejection (push gates to circuit end for cancellation) ---
cirq.eject_z(circuit)                         # push Z gates to end
cirq.eject_phased_paulis(circuit)             # push phased Paulis to end

# --- Alignment ---
cirq.align_left(circuit)                      # pack gates to earliest moments
cirq.align_right(circuit)                     # pack gates to latest moments

# --- Decomposition / Expansion ---
cirq.expand_composite(circuit)                # decompose composite gates via _decompose_
# cirq.expand_composite(circuit, no_decomp=lambda op: isinstance(op.gate, cirq.CZPowGate))

# --- Merging ---
cirq.merge_k_qubit_unitaries(circuit, k=2)    # merge connected k-qubit blocks
cirq.merge_single_qubit_gates(circuit)        # merge adjacent single-qubit gates
cirq.merge_k_qubit_gates(circuit, k=2)        # alias

# --- Measurement handling ---
cirq.defer_measurements(circuit)              # defer measurements via CNOT
cirq.synchronize_terminal_measurements(circuit) # align terminal measurements
cirq.stratified_circuit(circuit)              # stratify by gate type

# --- Target gateset compilation ---
# Compile to specific hardware gateset
compiled = cirq.optimize_for_target_gateset(
    circuit,
    gateset=cirq.CZTargetGateset(),           # or SqrtIswapTargetGateset
)
# Available gatesets: CZTargetGateset, SqrtIswapTargetGateset, CompilationTargetGateset

# --- Routing (qubit mapping for hardware topology) ---
# cirq.RouteCQC, cirq.MappingManager, cirq.LineInitialMapper

# --- Analytical decompositions (direct matrix → gates) ---
import numpy as np
matrix = np.array([[0, 1], [1, 0]], dtype=np.complex128)
ops = cirq.single_qubit_matrix_to_gates(matrix, tolerance=1e-8)
ops2 = cirq.two_qubit_matrix_to_cz_operations(
    np.eye(4, dtype=np.complex128), allow_partial_czs=True
)
# Also: single_qubit_matrix_to_phxz, two_qubit_matrix_to_sqrt_iswap_operations,
#       quantum_shannon_decomposition, three_qubit_matrix_to_operations

# --- Tag transformers ---
cirq.index_tags(circuit)                      # index tagged operations
cirq.remove_tags(circuit)                     # strip tags

# --- Primitives (for building custom transformers) ---
cirq.map_operations(circuit, map_func=lambda op, _: op)  # transform each op
cirq.map_moments(circuit, map_func=lambda m, _: m)
cirq.merge_operations(circuit, merge_func=lambda op1, op2: None)
cirq.unroll_circuit_op(circuit)              # unroll CircuitOperations
```

### 5.3 Decompose Protocol

```python
import cirq

# --- How decomposition works ---
# Gates implement _decompose_() → OP_TREE | None | NotImplemented
# cirq.decompose() recursively expands until no further decomposition

q0, q1 = cirq.LineQubit.range(2)

# Decompose a single operation
op = cirq.SWAP(q0, q1)
print(cirq.decompose(op))
# [CNOT(q0,q1), CNOT(q1,q0), CNOT(q0,q1)]

# Decompose with gateset constraint
decomposed = cirq.decompose(
    cirq.SWAP(q0, q1),
    fallback_decomposer=None,
    keep=lambda op: isinstance(op.gate, cirq.CZPowGate),
)

# Keep only gates in target gateset
print(cirq.decompose(circuit, keep=lambda op: op.gate in cirq.CZTargetGateset()))

# Custom gate with _decompose_
class MyGate(cirq.Gate):
    def _num_qubits_(self) -> int:
        return 1
    def _decompose_(self, qubits):
        q = qubits[0]
        return [cirq.H(q), cirq.Z(q), cirq.H(q)]  # == X via HZH
    def _unitary_(self):
        return cirq.unitary(cirq.X)

# Decomposition context (for recursive control)
ctx = cirq.DecompositionContext(qubit_manager=None)
print(cirq.decompose(MyGate().on(q0), context=ctx))

# Target gateset for decomposition
DECOMPOSE_TARGET_GATESET = cirq.Gateset(
    cirq.XPowGate, cirq.YPowGate, cirq.ZPowGate,
    cirq.CZPowGate, cirq.MeasurementGate, cirq.GlobalPhaseGate,
)
```

**Source**: `cirq-core/cirq/transformers/__init__.py`, `cirq-core/cirq/protocols/decompose_protocol.py`, `cirq-core/cirq/circuits/optimization_pass.py` (legacy)

---

## 6. Parameter Resolution — ParamResolver, Sweeps, Symbol Handling

### 6.1 Symbols

Cirq uses `sympy.Symbol` for parameterized gates. Re-exported as `cirq.Symbol` / `cirq.symbol()`.

```python
import cirq
import sympy

# --- Creating symbols ---
theta = sympy.Symbol("theta")           # standard sympy
phi = cirq.Symbol("phi")                # alias (same object)
theta2 = cirq.symbol("theta")           # factory function (same)

# Symbols in gates — any gate exponent / parameter can be a Symbol or expression
q0, q1 = cirq.LineQubit.range(2)
circuit = cirq.Circuit(
    cirq.X(q0) ** theta,                # X**theta
    cirq.Z(q1) ** (theta * 0.5),        # expression
    cirq.FSimGate(theta=theta, phi=phi).on(q0, q1),
    cirq.rx(theta).on(q0),              # rx(theta)
    cirq.Z(q0) ** sympy.Symbol("alpha"),
)

# Check parameterization
print(cirq.is_parameterized(circuit))   # True
print(cirq.parameter_names(circuit))    # frozenset({"theta", "phi", "alpha"})
print(cirq.parameter_symbols(circuit))  # frozenset({Symbol("theta"), ...})

# Resolve via cirq.resolve_parameters
resolved = cirq.resolve_parameters(circuit, {"theta": 0.5, "phi": 0.25})
print(cirq.is_parameterized(resolved))  # False (if all symbols resolved)
```

### 6.2 ParamResolver

`ParamResolver` is a frozen dict `Symbol/str → value`. Hashable, immutable.

```python
import cirq
import sympy

theta = sympy.Symbol("theta")
phi = sympy.Symbol("phi")

# --- Construction ---
r1 = cirq.ParamResolver({"theta": 0.5})              # str keys
r2 = cirq.ParamResolver({theta: 0.5, phi: 0.25})     # Symbol keys
r3 = cirq.ParamResolver({"theta": 0.5, "phi": 0.25}) # mixed — all work
r4 = cirq.ParamResolver()                             # empty

# Dict also works anywhere ParamResolver is expected (duck typing)
# Simulators accept ParamResolverOrSimilarType = ParamResolver | Mapping | None

# --- Access ---
print(r2[theta])                # 0.5
print(r2.value_of("theta"))     # 0.5 — resolves str or Symbol
print(r2.value_of(theta))       # 0.5
print(r2.param_dict)            # {"theta": 0.5, "phi": 0.25}

# --- Resolution ---
# Resolve a single value / expression
print(r2.value_of(sympy.Symbol("theta") * 2))  # 1.0 (evaluates expression)

# Resolve a circuit
q0 = cirq.LineQubit(0)
circuit = cirq.Circuit(cirq.X(q0) ** theta, cirq.Z(q0) ** phi)
resolved = cirq.resolve_parameters(circuit, r2)
print(resolved)
# Or via method:
resolved2 = circuit.with_params(r2)  # alias

# --- Utilities ---
print(cirq.to_resolvers({"theta": 0.5}))  # → [ParamResolver({"theta": 0.5})]
print(cirq.to_sweep({"theta": 0.5}))      # → ListSweep with one resolver
```

### 6.3 Sweepable & Sweep Composition

```python
import cirq
import sympy

theta = sympy.Symbol("theta")
phi = sympy.Symbol("phi")

# --- Sweepable is Union[ParamResolver, Mapping, Sweep, Iterable[ParamResolver]] ---
# Anything that can produce ParamResolvers is Sweepable

# All of these are valid `params` for run_sweep / simulate_sweep:
sim = cirq.Simulator()
q0 = cirq.LineQubit(0)
circuit = cirq.Circuit(cirq.X(q0) ** theta, cirq.measure(q0, key="m"))

# 1. Single dict / resolver
sim.run_sweep(circuit, params={"theta": 0.5}, repetitions=10)
sim.run_sweep(circuit, params=cirq.ParamResolver({"theta": 0.5}), repetitions=10)

# 2. List of dicts
sim.run_sweep(circuit, params=[{"theta": 0.1}, {"theta": 0.5}], repetitions=10)

# 3. Sweep objects
sim.run_sweep(circuit, params=cirq.Linspace("theta", 0, 1, 5), repetitions=10)

# --- Sweep algebra ---
sweep_a = cirq.Linspace("theta", 0, 1, 3)   # 3 values
sweep_b = cirq.Linspace("phi", 0, 1, 3)     # 3 values

product = sweep_a * sweep_b    # Product → 9 resolvers (Cartesian)
zipped = sweep_a + sweep_b     # Zip → 3 resolvers (parallel)
# Product and Zip are associative: (a * b) * c == a * (b * c)

# Points + Linspace composition
sweep_c = cirq.Points("theta", [0, 0.5, 1.0]) * cirq.Points("phi", [0, 1.0])
# → 6 resolvers

# Concat: sequential concatenation
concat = cirq.Concat(sweep_a, sweep_b)  # not commonly used directly

# ListSweep: explicit list
explicit = cirq.ListSweep([{"theta": i * 0.1} for i in range(10)])

# ZipLongest: zip with longest (pads shorter)
longest = cirq.ZipLongest(sweep_a, sweep_b)

# --- Iterating sweeps ---
for resolver in cirq.Linspace("theta", 0, 1, 3):
    print(resolver)  # ParamResolver({"theta": 0.0}), ...

# to_resolvers / to_sweeps helpers
print(cirq.to_resolvers(cirq.Linspace("theta", 0, 1, 3)))  # list[ParamResolver]
print(cirq.to_sweeps({"theta": 0.5}))                      # list[Sweep]

# --- Expression flattening (for variational loops) ---
# When you need to evaluate many expressions against many resolvers efficiently:
from cirq.study.flatten_expressions import flatten_with_sweep

expressions = [theta * 2, phi + theta]
sweep = cirq.Linspace("theta", 0, 1, 3) * cirq.Linspace("phi", 0, 1, 3)
# Use flatten_with_sweep for batched evaluation
```

**Source**: `cirq-core/cirq/study/resolver.py` (`ParamResolver`, `symbol`), `sweeps.py` (`Sweep`, `Linspace`, `Points`, `Product`, `Zip`), `sweepable.py` (`Sweepable`, `to_resolvers`)

---

## 7. End-to-End Workflows

### 7.1 Variational Algorithm (VQE/QAOA pattern)

```python
import cirq
import sympy
import numpy as np

# Parameterized ansatz
qubits = cirq.LineQubit.range(2)
theta = sympy.Symbol("theta")
phi = sympy.Symbol("phi")

ansatz = cirq.Circuit(
    cirq.H.on_each(*qubits),
    cirq.CNOT(qubits[0], qubits[1]),
    cirq.Z(qubits[0]) ** theta,
    cirq.X(qubits[1]) ** phi,
    cirq.CNOT(qubits[0], qubits[1]),
)

# Observable
hamiltonian = cirq.Z(qubits[0]) * cirq.Z(qubits[1]) + cirq.X(qubits[0])

# Sweep + expectation values (the VQE inner loop)
sim = cirq.Simulator()
sweep = cirq.Linspace("theta", 0, 1, 10) * cirq.Linspace("phi", 0, 1, 10)
results = sim.simulate_expectation_values_sweep(
    ansatz, observables=[hamiltonian], params=sweep
)
# results[i] is list[complex] — one per observable per param set
energies = [r[0].real for r in results]
best_idx = int(np.argmin(energies))
print(f"Best energy: {energies[best_idx]} at {list(sweep)[best_idx]}")
```

### 7.2 Noisy Simulation → Hardware Validation

```python
import cirq
import cirq_google as cg
import qsimcirq

# 1. Develop and test with ideal simulator
q0, q1 = cirq.LineQubit.range(2)
circuit = cirq.Circuit(cirq.H(q0), cirq.CNOT(q0, q1), cirq.measure(q0, q1, key="m"))
ideal_results = cirq.Simulator().run(circuit, repetitions=1000)
print("Ideal:", ideal_results.histogram(key="m"))

# 2. Test with approximate noise
noisy_sim = cirq.DensityMatrixSimulator(noise=cirq.depolarize(0.02))
noisy_results = noisy_sim.run(circuit, repetitions=1000)
print("Noisy (depolarize):", noisy_results.histogram(key="m"))

# 3. Test with hardware-calibrated noise (QVM)
processor_id = "rainbow"
noise_props = cg.engine.load_device_noise_properties(processor_id)
noise_model = cg.NoiseModelFromGoogleNoiseProperties(noise_props)
qvm_sim = qsimcirq.QSimSimulator(noise=noise_model)
qvm_results = qvm_sim.run(circuit, repetitions=1000)
print("QVM (hardware noise):", qvm_results.histogram(key="m"))

# 4. Validate circuit fits hardware before submission
device = cg.engine.create_device_from_processor_id(processor_id)
try:
    device.validate_circuit(circuit)
    print("Circuit valid for", processor_id)
except ValueError as e:
    # Transpile to fit
    compiled = cirq.optimize_for_target_gateset(circuit, gateset=cirq.CZTargetGateset())
    print(f"Compiled: {compiled}")
```

### 7.3 Full Transpilation Pipeline

```python
import cirq

q0, q1, q2 = cirq.LineQubit.range(3)
circuit = cirq.Circuit(
    cirq.H(q0), cirq.CNOT(q0, q1), cirq.T(q1),
    cirq.CNOT(q1, q2), cirq.H(q2), cirq.measure(q0, q1, q2, key="m"),
)
print("Original:", circuit)

# Step 1: Expand composite gates
circuit = cirq.expand_composite(circuit)

# Step 2: Optimize
circuit = cirq.eject_z(circuit)
circuit = cirq.eject_phased_paulis(circuit)
circuit = cirq.drop_negligible_operations(circuit)
circuit = cirq.drop_empty_moments(circuit)

# Step 3: Compile to hardware gateset
circuit = cirq.optimize_for_target_gateset(circuit, gateset=cirq.CZTargetGateset())

# Step 4: Align and synchronize
circuit = cirq.align_left(circuit)
circuit = cirq.synchronize_terminal_measurements(circuit)

print("Transpiled:", circuit)
```

---

## 8. Key API Reference (Quick Lookup)

| Area | Key Imports | Version Notes |
|------|-------------|---------------|
| Qubits | `cirq.GridQubit`, `cirq.LineQubit`, `cirq.NamedQubit`, `cirq.GridQid`, `cirq.LineQid` | `GridQubit.rect()`, `LineQubit.range()` |
| Gates | `cirq.X/Y/Z/H/S/T`, `cirq.CNOT/CZ/SWAP/ISWAP`, `cirq.FSimGate`, `cirq.MatrixGate` | `cirq.X**0.5`, `cirq.rx(theta)` |
| Circuit | `cirq.Circuit`, `cirq.FrozenCircuit`, `cirq.Moment`, `cirq.InsertStrategy` | `EARLIEST` is default |
| Simulation | `cirq.Simulator`, `cirq.DensityMatrixSimulator`, `cirq.CliffordSimulator` | `seed=` for reproducibility |
| Sweeps | `cirq.Linspace`, `cirq.Points`, `cirq.Product`, `cirq.Zip`, `cirq.ListSweep` | `*` = Product, `+` = Zip |
| Params | `cirq.ParamResolver`, `cirq.Symbol`, `cirq.resolve_parameters`, `cirq.is_parameterized` | `sympy.Symbol` compatible |
| Noise | `cirq.NoiseModel`, `cirq.ConstantQubitNoiseModel`, `cirq.NO_NOISE`, `cirq.depolarize` | `NOISE_MODEL_LIKE` auto-wraps |
| Transformers | `cirq.eject_z`, `cirq.align_left`, `cirq.expand_composite`, `cirq.optimize_for_target_gateset` | Replaces legacy `Optimizer` |
| Google | `cirq_google.Engine`, `cirq_google.Sycamore/Willow105`, `cirq_google.NoiseModelFromGoogleNoiseProperties` | `import cirq_google as cg` |
| Protocols | `cirq.unitary`, `cirq.decompose`, `cirq.has_unitary`, `cirq.is_parameterized` | Protocol-based dispatch |

---

## 9. Integration Notes for Quantic Coding Assistant

1. **Circuit as IR**: `cirq.Circuit` is the central IR. All assistant operations (generation, optimization, validation) should produce/consume `Circuit` objects. Use `FrozenCircuit` for caching and hashing.

2. **Parameter sweeps for variational loops**: The assistant should generate `Sweep` objects for hyperparameter searches. `Linspace` + `Product` covers most VQE/QAOA cases. Use `simulate_expectation_values_sweep` for the inner loop — it is vectorized and faster than manual iteration.

3. **Noise-aware development**: Default to `DensityMatrixSimulator` with `ConstantQubitNoiseModel` for quick noise checks, escalate to `NoiseModelFromGoogleNoiseProperties` + `QSimSimulator` for hardware-faithful simulation. The QVM pattern (`SimulatedLocalEngine`) lets the assistant test hardware submission without cloud access.

4. **Transpilation as a pipeline**: Chain transformers functionally (`circuit = t2(t1(circuit))`). The `optimize_for_target_gateset` transformer is the single entry point for hardware compilation — prefer it over manual decomposition.

5. **Device validation early**: Call `device.validate_circuit(circuit)` before any hardware submission. If validation fails, the assistant should auto-transpile via `optimize_for_target_gateset` + routing.

6. **Symbol handling**: Use `sympy.Symbol` for all parameters. The assistant's code generation should emit `sympy.Symbol("name")` and `cirq.ParamResolver` — not raw floats — for any tunable gate. Check `cirq.is_parameterized` before simulation to catch unresolved symbols.

---

*Generated 2026-08-29 from Cirq `1.8.0.dev0` (`729c329`) — verify against [quantumai.google/cirq](https://quantumai.google/cirq) and `quantumlib/Cirq` for updates.*
