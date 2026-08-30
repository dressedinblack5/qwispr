# PennyLane (v0.45.1 stable) — Idiomatic Patterns for Quantic Coding Assistant Integration

> **Scope**: Differentiable programming, template library, device plugin architecture.  
> **Version**: PennyLane 0.45.1 (stable, 2026-08) — `docs.pennylane.ai/en/stable/`  
> **Source repo**: `PennyLaneAI/pennylane` (Apache 2.0)  
> **Install**: `pip install pennylane` (+ `pennylane-lightning` / `pennylane-lightning-gpu` for accelerators)

This file is the **sdk-pennylane** deliverable for the Quantic OpenAxe investigation (Track A). Each section is self-contained, runnable, and annotated for integration into an AI coding assistant (code completion, transpilation, backend selection).

---

## 1. QNode Interface — Device-Agnostic Differentiable Execution

### Core mental model

```
quantum function (Python) + device + interface + diff_method  →  QNode (callable)
```

- **Quantum function**: restricted Python function that queues `qml.*` ops and returns measurements. No return = no measurement.
- **Device**: execution backend (`qml.device(...)`). QNode is bound to one device at creation, swappable via `qnode.update(device=new_dev)`.
- **Interface**: autodiff bridge (`"auto"` default, or `"autograd"` / `"torch"` / `"jax"`). Determines array type and gradient plumbing.
- **diff_method**: `"best"` (default) → device grad → backprop/adjoint → parameter-shift → finite-diff. Explicit values: `"backprop"`, `"adjoint"`, `"parameter-shift"`, `"finite-diff"`, `"hadamard"`, `"device"`.

Docs: `introduction/circuits.html`, `introduction/interfaces.html`, `code/api/pennylane.QNode.html`

### 1.1 Minimal QNode — decorator (idiomatic) vs constructor

```python
import pennylane as qml
from pennylane import numpy as np

dev = qml.device("default.qubit", wires=2)

# Idiomatic: decorator (replaces function with QNode)
@qml.qnode(dev)
def circuit(x, y):
    qml.RZ(x, wires=0)
    qml.CNOT(wires=[0, 1])
    qml.RY(y, wires=1)
    return qml.expval(qml.PauliZ(1))

# Equivalent explicit construction
def my_qfunc(x, y):
    qml.RZ(x, wires=0)
    qml.CNOT(wires=[0, 1])
    qml.RY(y, wires=1)
    return qml.expval(qml.PauliZ(1))

circuit2 = qml.QNode(my_qfunc, dev)

print(circuit(0.5, 0.3))          # tensor(0.877..., requires_grad=True)
print(qml.draw(circuit)(0.5, 0.3))
# 0: ──RZ(0.50)─╭●─┤
# 1: ──────────╰X──RY(0.30)─┤  <Z>
```

### 1.2 Device-agnostic execution — swap device without rewriting circuit

```python
# Same circuit, different backends — no code change
dev_default = qml.device("default.qubit", wires=3)
dev_lightning = qml.device("lightning.qubit", wires=3)  # requires pennylane-lightning
# dev_gpu = qml.device("lightning.gpu", wires=3)        # requires pennylane-lightning-gpu + cuQuantum

@qml.qnode(dev_default, diff_method="adjoint")
def ansatz(weights):
    qml.StronglyEntanglingLayers(weights, wires=range(3))
    return qml.expval(qml.PauliZ(0))

# Re-target at runtime
ansatz_lightning = ansatz.update(device=dev_lightning)
# ansatz_gpu = ansatz.update(device=dev_gpu)

weights = qml.init.strong_ent_layers_normal(n_layers=2, n_wires=3, seed=42)
print(ansatz(weights), ansatz_lightning(weights))  # numerically identical
```

**Assistant pattern**: expose `device` as a parameter in generated code; suggest `lightning.qubit` for >12 qubits or batch execution, `default.qubit` for debugging (supports `qml.snapshots`, `qml.draw` with full decomposition).

### 1.3 Autodiff backends — one circuit, four interfaces

PennyLane auto-detects interface from argument types if `interface="auto"` (default). Explicit is preferred for assistants.

```python
# --- Autograd (NumPy) — default, no extra deps ---
from pennylane import numpy as pnp

dev = qml.device("default.qubit", wires=1)

@qml.qnode(dev, interface="autograd", diff_method="parameter-shift")
def circuit_autograd(x):
    qml.RX(x, wires=0)
    return qml.expval(qml.PauliZ(0))

x = pnp.array(0.5, requires_grad=True)
print(qml.grad(circuit_autograd)(x))  # -sin(0.5)

# --- Torch ---
import torch

@qml.qnode(dev, interface="torch", diff_method="backprop")
def circuit_torch(x):
    qml.RX(x, wires=0)
    return qml.expval(qml.PauliZ(0))

x_t = torch.tensor(0.5, dtype=torch.float64, requires_grad=True)
loss = circuit_torch(x_t)
loss.backward()
print(x_t.grad)  # tensor(-0.4794, dtype=torch.float64)

# TorchLayer — QNode as nn.Module
@qml.qnode(dev, interface="torch")
def qfunc(inputs, weights):
    qml.AngleEmbedding(inputs, wires=range(2))
    qml.BasicEntanglerLayers(weights, wires=range(2))
    return qml.expval(qml.PauliZ(0))

weight_shapes = {"weights": (2, 2)}
qlayer = qml.qnn.TorchLayer(qfunc, weight_shapes)
print(qlayer)  # usable inside torch.nn.Sequential

# --- JAX (jit + grad) ---
import jax
import jax.numpy as jnp

@qml.qnode(dev, interface="jax", diff_method="backprop")
def circuit_jax(x):
    qml.RX(x, wires=0)
    return qml.expval(qml.PauliZ(0))

print(jax.grad(circuit_jax)(jnp.array(0.5)))
print(jax.jit(circuit_jax)(jnp.array(0.5)))

# JAX + Optax (PennyLane optimizers NOT compatible with JAX interface)
import optax

@jax.jit
@qml.qnode(dev, interface="jax")
def energy(a):
    qml.RX(a, wires=0)
    return qml.expval(qml.PauliZ(0))

optimizer = optax.adam(0.15)
params = jnp.array(0.5)
opt_state = optimizer.init(params)
for _ in range(5):
    grads = jax.grad(energy)(params)
    updates, opt_state = optimizer.update(grads, opt_state)
    params = optax.apply_updates(params, updates)

# --- TensorFlow (deprecated as of v0.44) ---
# TF interface still works but is unmaintained. Assistant should steer to JAX/Torch.
# @qml.qnode(dev, interface="tf")
# def circuit_tf(x): ...
```

**Key rules for code generation**:
- `interface=None` → no grad overhead, fastest inference. Use when assistant generates non-trainable circuits.
- `diff_method="adjoint"` only on simulators (`default.qubit`, `lightning.*`); falls back to `parameter-shift` on hardware.
- `qml.enable_return()` + `jax.jacobian` for multi-output QNodes (new return system).

### 1.4 Advanced QNode features — shots, broadcasting, higher-order grads

```python
dev = qml.device("default.qubit", wires=2)

# Shot vectors — single execution, multiple shot budgets
@qml.qnode(dev)
def circuit_shots(x):
    qml.RX(x, wires=0)
    qml.CNOT(wires=[0, 1])
    return qml.expval(qml.PauliZ(0) @ qml.PauliX(1)), qml.expval(qml.PauliZ(0))

# Execute with shot batching
circuit_5 = qml.set_shots(circuit_shots, shots=5)
circuit_1000 = qml.set_shots(circuit_shots, shots=1000)
# Or decorator: @qml.set_shots(shots=[5, 10, 1000]) → returns tuple of results

# Parameter broadcasting — batch execution
@qml.qnode(dev)
def circuit_broadcast(x):
    qml.RX(x, wires=0)
    return qml.expval(qml.PauliZ(0))

xs = np.array([0.1, 0.5, 1.0])  # shape (3,)
print(circuit_broadcast(xs))  # shape (3,) — one execution if device supports broadcasting

# Higher-order derivatives
@qml.qnode(dev, diff_method="parameter-shift", max_diff=2)
def circuit_hess(weights):
    qml.RX(weights[0], wires=0)
    qml.RY(weights[1], wires=1)
    qml.CNOT(wires=[0, 1])
    return qml.expval(qml.PauliZ(1))

weights = np.array([0.1, 0.2, 0.3], requires_grad=True)
hess = qml.jacobian(qml.jacobian(circuit_hess))(weights)
# Or via gradient transforms: qml.gradients.param_shift(circuit)(weights)
```

---

## 2. Templates / Layers — Ansatz Library

PennyLane templates are **callable classes/functions that queue ops** — not standalone circuits. They must be called inside a QNode. Categories: embeddings, layers, state prep, chemistry, tensor networks, subroutines.

Docs: `introduction/templates.html`, `code/qp_templates_core.html`

### 2.1 Embeddings — data → quantum state

```python
import pennylane as qml
from pennylane import numpy as np

dev = qml.device("default.qubit", wires=3)

# AngleEmbedding — RX/RY/RZ rotations (1 feature per qubit per rotation)
@qml.qnode(dev)
def circuit_angle(features, weights):
    qml.AngleEmbedding(features, wires=range(3), rotation="X")  # or "Y", "Z"
    qml.BasicEntanglerLayers(weights, wires=range(3))
    return qml.expval(qml.PauliZ(0))

features = np.array([0.1, 0.5, 0.9])
weights = np.random.random(qml.BasicEntanglerLayers.shape(n_layers=2, n_wires=3))
print(circuit_angle(features, weights))

# IQPEmbedding — diagonal gates, good for quantum kernels / QAOA-style
@qml.qnode(dev)
def circuit_iqp(features):
    qml.IQPEmbedding(features, wires=range(3), n_repeats=2, pattern=None)
    return qml.expval(qml.PauliZ(0))

# AmplitudeEmbedding — 2^n features → amplitudes (requires normalization)
@qml.qnode(dev)
def circuit_amplitude(features):
    qml.AmplitudeEmbedding(features, wires=range(3), normalize=True, pad_with=0.)
    return qml.expval(qml.PauliZ(0))

features_amp = np.array([0.5, 0.5, 0.5, 0.5, 0., 0., 0., 0.])
print(circuit_amplitude(features_amp))

# Adjoint of embedding — note the call pattern
@qml.qnode(dev)
def circuit_adjoint(params):
    qml.adjoint(qml.AngleEmbedding)(params, wires=range(3))  # NOT qml.adjoint(qml.AngleEmbedding(params, ...))
    return qml.state()
```

### 2.2 Layers — trainable ansätze

```python
# StronglyEntanglingLayers — 3 rotations per qubit + CNOT entanglers, all-to-all
# Shape: (n_layers, n_wires, 3)
n_wires, n_layers = 4, 3
dev = qml.device("default.qubit", wires=n_wires)

@qml.qnode(dev)
def circuit_strong(weights, features):
    qml.AngleEmbedding(features, wires=range(n_wires))
    qml.StronglyEntanglingLayers(weights, wires=range(n_wires))
    return qml.expval(qml.PauliZ(0))

shape = qml.StronglyEntanglingLayers.shape(n_layers=n_layers, n_wires=n_wires)
print(shape)  # (3, 4, 3)
weights = np.random.random(size=shape, requires_grad=True)
features = np.random.random(n_wires)
print(circuit_strong(weights, features))

# BasicEntanglerLayers — 1 rotation per qubit + nearest-neighbor CNOTs (cheaper)
# Shape: (n_layers, n_wires)
@qml.qnode(dev)
def circuit_basic(weights):
    qml.BasicEntanglerLayers(weights, wires=range(n_wires))
    return qml.expval(qml.PauliZ(0))

shape_basic = qml.BasicEntanglerLayers.shape(n_layers=2, n_wires=n_wires)
weights_basic = np.random.random(size=shape_basic, requires_grad=True)
print(circuit_basic(weights_basic))

# RandomLayers — random gates, useful for barren plateau studies
@qml.qnode(dev)
def circuit_random(weights):
    qml.RandomLayers(weights, wires=range(n_wires), seed=42)
    return qml.expval(qml.PauliZ(0))

shape_rand = qml.RandomLayers.shape(n_layers=2, n_wires=n_wires)
print(shape_rand)

# Custom template — function that queues ops (framework-agnostic via qml.math)
def MyTemplate(a, b, wires):
    c = qml.math.sin(a) + b  # use qml.math for autodiff compatibility
    qml.RX(c, wires=wires[0])
    qml.CNOT(wires=[wires[0], wires[1]])

@qml.qnode(dev)
def circuit_custom(a, b):
    MyTemplate(a, b, wires=range(n_wires))
    return qml.expval(qml.PauliZ(0))

# Layering any template
from pennylane.templates import layer

def block(weights, wires):
    qml.RX(weights[0], wires=wires[0])
    qml.CNOT(wires=[wires[0], wires[1]])

@qml.qnode(dev)
def circuit_layered(weights):
    qml.layer(block, 3, weights, wires=range(2))  # repeat block 3 times
    return qml.expval(qml.PauliZ(0))
```

**Assistant guidance**:
- Always call `Template.shape(...)` to get weight shapes — never hardcode.
- `StronglyEntanglingLayers` is the default QML ansatz; `BasicEntanglerLayers` for NISQ-friendly depth.
- `IQPEmbedding` + `StronglyEntanglingLayers` is the canonical QML pipeline (data re-uploading).

---

## 3. Measurements — Extracting Information

All measurements are **return values** of the quantum function. Multiple measurements → tuple. Non-commuting observables → automatic circuit splitting.

Docs: `introduction/measurements.html`, `code/qp_measurements.html`

### 3.1 Core measurements

```python
import pennylane as qml
from pennylane import numpy as np

dev = qml.device("default.qubit", wires=2)

# expval — expectation value (differentiable, analytic or shot-based)
@qml.qnode(dev)
def circuit_expval(x, y):
    qml.RZ(x, wires=0)
    qml.CNOT(wires=[0, 1])
    qml.RY(y, wires=1)
    return qml.expval(qml.PauliZ(1))

# var — variance (differentiable)
@qml.qnode(dev)
def circuit_var(x):
    qml.RX(x, wires=0)
    return qml.var(qml.PauliZ(0))

# probs — computational basis probabilities (differentiable)
@qml.qnode(dev)
def circuit_probs(x, y):
    qml.RZ(x, wires=0)
    qml.CNOT(wires=[0, 1])
    qml.RY(y, wires=1)
    return qml.probs(wires=[0, 1])  # or qml.probs(op=qml.PauliZ(0))

print(circuit_probs(0.56, 0.1))  # array([0.997..., 0.002..., 0., 0.])

# sample — raw stochastic samples (NOT differentiable, requires shots)
dev_shots = qml.device("default.qubit", wires=2, shots=1000)

@qml.qnode(dev_shots)
def circuit_sample():
    qml.Hadamard(wires=0)
    qml.CNOT(wires=[0, 1])
    return qml.sample(qml.PauliZ(0)), qml.sample(qml.PauliZ(1))

s0, s1 = circuit_sample()
print(s0.shape, s1.shape)  # (1000,) (1000,) — entangled, so s0 == s1

# counts — histogram of samples (NOT differentiable, requires shots)
@qml.qnode(dev_shots)
def circuit_counts():
    qml.Hadamard(wires=0)
    qml.CNOT(wires=[0, 1])
    return qml.counts(wires=[0, 1])  # or qml.counts(qml.PauliZ(0))

print(circuit_counts())  # {'00': 512, '11': 488}
print(qml.set_shots(circuit_counts, shots=1000)(all_outcomes=True))  # includes '01': 0, '10': 0

# Tensor observables — @ for Pauli products
@qml.qnode(dev)
def circuit_tensor(x):
    qml.RX(x, wires=0)
    qml.CNOT(wires=[0, 1])
    return qml.expval(qml.PauliZ(0) @ qml.PauliX(1) @ qml.PauliZ(2))  # if 3 wires
```

### 3.2 Advanced measurements — entropy, mutual info, shadows

```python
dev = qml.device("default.qubit", wires=3)

@qml.qnode(dev)
def circuit_entropy():
    qml.Hadamard(wires=0)
    qml.CNOT(wires=[0, 1])
    return (
        qml.vn_entropy(wires=[0]),           # von Neumann entropy
        qml.mutual_info(wires0=[0], wires1=[1]),  # mutual information
        qml.purity(wires=[0]),               # Tr(ρ²)
        qml.state(),                         # full statevector (analytic only)
        qml.density_matrix(wires=[0, 1]),    # reduced density matrix
    )

# Classical shadows — efficient observable estimation
@qml.qnode(dev, shots=1000)
def circuit_shadow():
    qml.Hadamard(wires=0)
    qml.CNOT(wires=[0, 1])
    return qml.classical_shadow(wires=[0, 1])

bits, recipes = circuit_shadow()  # bits: (shots, wires), recipes: (shots, wires)

# Shadow expval — differentiable shadow estimation
H = qml.Hamiltonian([1., 0.5], [qml.PauliZ(0), qml.PauliX(1)])
@qml.qnode(dev, shots=1000)
def circuit_shadow_expval():
    qml.Hadamard(wires=0)
    return qml.shadow_expval(H)

# Combined measurements — list comprehensions, multiple returns
@qml.qnode(dev)
def circuit_combined(x):
    qml.RX(x, wires=0)
    qml.CNOT(wires=[0, 1])
    return [qml.expval(qml.PauliZ(i)) for i in range(2)]  # → tuple of 2

# Shot-aware measurement — set_shots decorator
@qml.set_shots(shots=100)
@qml.qnode(dev)
def circuit_shot_aware(x):
    qml.RX(x, wires=0)
    return qml.expval(qml.PauliZ(0))

print(circuit_shot_aware(0.5))  # stochastic
print(qml.set_shots(circuit_shot_aware, shots=None)(0.5))  # exact
```

**Differentiability matrix** (for assistant codegen):
| Measurement | Differentiable | Shots required |
|---|---|---|
| `expval`, `var`, `probs`, `vn_entropy`, `mutual_info`, `purity`, `state`, `density_matrix` | ✅ | No (analytic) or yes (stochastic) |
| `sample`, `counts`, `classical_shadow` | ❌ | Yes |
| `shadow_expval` | ✅ | Yes |

---

## 4. Optimization — Training Quantum Circuits

PennyLane optimizers are **NumPy/autograd-only**. For Torch/JAX, use native optimizers (torch.optim, optax/jaxopt). Quantum-specific optimizers (QNG, ShotAdaptive) are NumPy-only.

Docs: `introduction/interfaces.html` (Optimizers section), `code/qp_optimize.html`

### 4.1 Built-in NumPy optimizers — GradientDescent, Adam

```python
import pennylane as qml
from pennylane import numpy as np

dev = qml.device("default.qubit", wires=2)

@qml.qnode(dev)
def circuit(params):
    qml.RX(params[0], wires=0)
    qml.RY(params[1], wires=1)
    qml.CNOT(wires=[0, 1])
    return qml.expval(qml.PauliZ(0) @ qml.PauliZ(1))

def cost(params):
    return circuit(params)

# GradientDescentOptimizer — vanilla SGD
opt_gd = qml.GradientDescentOptimizer(stepsize=0.4)
params = np.array([0.1, 0.2], requires_grad=True)
for i in range(10):
    params = opt_gd.step(cost, params)
    if i % 3 == 0:
        print(f"GD step {i}: cost={cost(params):.4f}")

# AdamOptimizer — adaptive moments (most common for QML)
opt_adam = qml.AdamOptimizer(stepsize=0.1, beta1=0.9, beta2=0.999, eps=1e-8)
params = np.array([0.1, 0.2], requires_grad=True)
for i in range(20):
    params, prev_cost = opt_adam.step_and_cost(cost, params)
    # step_and_cost avoids recomputing cost

# Other NumPy optimizers (same API: .step(cost, params) or .step_and_cost)
# qml.AdagradOptimizer, qml.RMSPropOptimizer, qml.MomentumOptimizer,
# qml.NesterovMomentumOptimizer, qml.SPSAOptimizer, qml.RotosolveOptimizer
```

### 4.2 Natural gradient — QNGOptimizer (Fubini-Study metric)

```python
# QNGOptimizer — reparameterizes optimization via quantum geometric tensor
# Approximations: "diag" (diagonal) or "block-diag" (default, per-layer)
dev = qml.device("default.qubit", wires=2)

@qml.qnode(dev)
def circuit_qng(params):
    qml.RX(params[0], wires=0)
    qml.RY(params[1], wires=1)
    qml.CNOT(wires=[0, 1])
    qml.RX(params[2], wires=1)
    return qml.expval(qml.PauliZ(1))

opt_qng = qml.QNGOptimizer(stepsize=0.01, approx="block-diag", lam=0)  # lam = regularization
params = np.array([0.1, 0.2, 0.3], requires_grad=True)
for i in range(5):
    params = opt_qng.step(circuit_qng, params)
    print(f"QNG step {i}: {circuit_qng(params):.4f}")

# Manual natural gradient — Fisher information × gradient
# Useful when assistant needs to expose metric tensor
from pennylane import numpy as pnp

@qml.qnode(dev)
def circ(params):
    qml.RX(params[0], wires=0)
    qml.RY(params[1], wires=0)
    return qml.expval(qml.PauliZ(0))

params = pnp.array([0.5, 0.3], requires_grad=True)
grad = qml.grad(circ)(params)
# qfim = qml.qinfo.quantum_fisher(circ)(params)  # quantum Fisher info matrix
# cfim = qml.qinfo.classical_fisher(circ)(params)
# natural_grad = qfim @ grad
```

### 4.3 Shot-aware optimization — ShotAdaptiveOptimizer

```python
# ShotAdaptiveOptimizer — adaptively allocates shots per parameter
# Minimizes total shots while maintaining gradient accuracy
coeffs = [2, 4, -1, 5, 2]
obs = [qml.PauliX(1), qml.PauliZ(1), qml.PauliX(0) @ qml.PauliX(1),
       qml.PauliY(0) @ qml.PauliY(1), qml.PauliZ(0) @ qml.PauliZ(1)]
H = qml.Hamiltonian(coeffs, obs)

dev_shots = qml.device("default.qubit", wires=2, shots=100)
cost = qml.ExpvalCost(qml.StronglyEntanglingLayers, H, dev_shots)  # deprecated but still works
# Preferred: define QNode explicitly
@qml.qnode(dev_shots)
def cost_qnode(params):
    qml.StronglyEntanglingLayers(params, wires=[0, 1])
    return qml.expval(H)

params = qml.init.strong_ent_layers_uniform(n_layers=2, n_wires=2)
opt_shot = qml.ShotAdaptiveOptimizer(min_shots=10)
for i in range(5):
    params = opt_shot.step(cost_qnode, params)
    print(f"Step {i}: cost={cost_qnode(params):.2f}, shots_used={opt_shot.total_shots_used}")

# QNSPSAOptimizer — quantum natural SPSA (shot-efficient, hardware-friendly)
opt_qnspsa = qml.QNSPSAOptimizer(stepsize=0.01)
```

### 4.4 Framework-native optimization — Torch & JAX (idiomatic for assistants)

```python
# Torch — use torch.optim
import torch
import pennylane as qml

dev = qml.device("default.qubit", wires=2)

@qml.qnode(dev, interface="torch")
def circuit_torch(params):
    qml.RX(params[0], wires=0)
    qml.RY(params[1], wires=1)
    qml.CNOT(wires=[0, 1])
    return qml.expval(qml.Hamiltonian([1, 1], [qml.PauliZ(0), qml.PauliZ(1)]))

params = torch.tensor([0.1, 0.2], requires_grad=True)
opt = torch.optim.Adam([params], lr=0.1)
for i in range(10):
    opt.zero_grad()
    loss = circuit_torch(params)
    loss.backward()
    opt.step()

# JAX — use optax or jaxopt (PennyLane optimizers incompatible with JAX)
import jax, jax.numpy as jnp, optax

@qml.qnode(dev, interface="jax")
def circuit_jax(params):
    qml.RX(params[0], wires=0)
    qml.RY(params[1], wires=1)
    qml.CNOT(wires=[0, 1])
    return qml.expval(qml.PauliZ(0))

params = jnp.array([0.1, 0.2])
optimizer = optax.adam(0.1)
opt_state = optimizer.init(params)
for i in range(10):
    grads = jax.grad(circuit_jax)(params)
    updates, opt_state = optimizer.update(grads, opt_state)
    params = optax.apply_updates(params, updates)

# JAX + Catalyst (jit) — for HPC
# import catalyst as cata  # pip install pennylane-catalyst
# @cata.qjit
# @qml.qnode(dev, interface="jax")
# def circuit_jitted(params): ...
```

---

## 5. Devices — Simulator & Hardware Plugin Architecture

### 5.1 Built-in simulators

```python
import pennylane as qml

# default.qubit — pure statevector, Python, backprop + adjoint, broadcasting, shots
dev1 = qml.device("default.qubit", wires=4)  # or wires=["q0","q1"] or no wires (auto-infer)
# dev1 = qml.device("default.qubit")  # wires inferred from circuit (v0.33+)

# default.mixed — density matrix, supports noise
dev_mixed = qml.device("default.mixed", wires=2)

# default.clifford — stabilizer simulator (Clifford-only, fast)
dev_clifford = qml.device("default.clifford", wires=10)

# default.tensor — tensor network (quimb backend)
# dev_tensor = qml.device("default.tensor", wires=10)

# null.qubit — no-op, for resource estimation
dev_null = qml.device("null.qubit", wires=4)

# Check capabilities
print(dev1.capabilities())  # {'supports_broadcasting': True, ...}
print(dev1.shots)           # Shots(total_shots=None) → analytic
```

### 5.2 Lightning simulators — high-performance

```python
# lightning.qubit — C++ statevector, adjoint + parameter-shift, ~10-100x faster
# pip install pennylane-lightning
dev_lq = qml.device("lightning.qubit", wires=20)

@qml.qnode(dev_lq, diff_method="adjoint")  # adjoint is optimal for lightning
def circuit_lq(weights):
    qml.StronglyEntanglingLayers(weights, wires=range(20))
    return qml.expval(qml.PauliZ(0))

# lightning.gpu — cuQuantum GPU acceleration (NVIDIA)
# pip install pennylane-lightning-gpu
# dev_gpu = qml.device("lightning.gpu", wires=28)

# lightning.kokkos — Kokkos backend (HPC, AMD/NVIDIA)
# dev_kokkos = qml.device("lightning.kokkos", wires=20)

# Program capture — only these support Catalyst qjit
# Compatible: default.qubit, lightning.qubit, lightning.kokkos, lightning.gpu
```

### 5.3 Hardware plugins — 40+ devices via `qml.device("plugin.name", ...)`

```python
# IBM Quantum — pennylane-qiskit
# pip install pennylane-qiskit
# from qiskit_ibm_runtime import QiskitRuntimeService
# service = QiskitRuntimeService(channel="ibm_quantum", token="...")
# dev_ibm = qml.device("qiskit.remote", wires=5, backend="ibm_brisbane", service=service)
# dev_ibm_sim = qml.device("qiskit.aer", wires=5)  # Aer simulator

# IonQ — pennylane-ionq
# pip install pennylane-ionq
# dev_ionq = qml.device("ionq.qpu", wires=11, api_key="...", shots=1024)
# dev_ionq_sim = qml.device("ionq.simulator", wires=11)

# Rigetti — pennylane-rigetti
# pip install pennylane-rigetti
# dev_rigetti = qml.device("rigetti.qpu", wires=8, as_qvm=False)
# dev_rigetti_qvm = qml.device("rigetti.qvm", wires=8)  # QVM simulator

# Amazon Braket — pennylane-braket
# pip install amazon-braket-pennylane-plugin
# import braket.aws
# dev_braket = qml.device("braket.aws.qubit", device_arn="arn:aws:braket:::device/qpu/rigetti/Aspen-M-3", wires=8, s3_destination_folder=("bucket", "folder"))
# dev_braket_local = qml.device("braket.local.qubit", wires=5)

# Other plugins: qml.device("cirq.simulator", ...), "forest.qpu", "aqt.qpu", "pasqal.qpu", etc.
# Full list: https://pennylane.ai/plugins  and  https://docs.pennylane.ai/en/stable/code/qp_devices.html

# Unified pattern — same QNode, different device
def make_circuit(dev):
    @qml.qnode(dev)
    def circuit(x):
        qml.RX(x, wires=0)
        qml.CNOT(wires=[0, 1])
        return qml.expval(qml.PauliZ(1))
    return circuit

# for dev in [dev1, dev_lq, dev_ibm_sim]:
#     print(make_circuit(dev)(0.5))
```

### 5.4 Device plugin architecture — building a custom device

For assistant codegen that needs to **explain or scaffold** a plugin.

```python
# Minimal custom device — new Device API (PennyLane >=0.33)
from pennylane.devices import Device, ExecutionConfig
from pennylane.tape import QuantumScript

class MyDevice(Device):
    """Minimal reference device — see pennylane/devices/reference_qubit.py"""
    name = "my.device"
    short_name = "my.device"

    # Optional: TOML capabilities file (required for Catalyst qjit compatibility)
    # config_filepath = "path/to/config.toml"

    def execute(self, circuits, execution_config=None):
        # circuits: QuantumScript or tuple[QuantumScript]
        # Must handle both single and batch
        is_single = isinstance(circuits, QuantumScript)
        batch = (circuits,) if is_single else circuits
        results = []
        for circuit in batch:
            # ... simulate or dispatch to hardware ...
            # Use circuit.operations, circuit.measurements, circuit.shots
            results.append(0.0)  # placeholder
        return results[0] if is_single else tuple(results)

# With preprocessing pipeline (recommended)
from pennylane.devices.preprocess import decompose, validate_device_wires, validate_measurements

class MyDeviceWithPreprocess(Device):
    def preprocess_transforms(self, execution_config=None):
        program = qml.CompilePipeline()
        program.add_transform(validate_device_wires, wires=qml.wires.Wires([0, 1, 2]), name="my.device")
        program.add_transform(validate_measurements, name="my.device")
        program.add_transform(qml.defer_measurements)
        program.add_transform(qml.transforms.split_non_commuting)
        def stopping_condition(op):
            return op.name in {"PauliX", "PauliY", "PauliZ", "RX", "RY", "RZ", "CNOT"}
        program.add_transform(decompose, stopping_condition=stopping_condition, name="my.device")
        program.add_transform(qml.transforms.broadcast_expand)
        return program

    def execute(self, circuits, execution_config=None):
        # Now guaranteed to receive only supported ops/measurements
        ...

# TOML capabilities file (config.toml) — declarative device spec
"""
schema = 3
[operators.gates]
PauliX = { properties = ["controllable", "invertible"] }
RY = { properties = ["controllable", "invertible", "differentiable"] }
CNOT = { properties = ["invertible"] }

[operators.observables]
PauliZ = { }
Hamiltonian = { conditions = ["terms-commute"] }

[measurement_processes]
ExpectationMP = { }
SampleMP = { }
CountsMP = { conditions = ["finiteshots"] }
StateMP = { conditions = ["analytic"] }

[compilation]
qjit_compatible = false
overlapping_observables = true
non_commuting_observables = false
supported_mcm_methods = []
"""

# Legacy plugin API (still supported, but prefer Device)
# from pennylane.devices import LegacyDevice, QubitDevice
# class MyLegacyDevice(QubitDevice): ...
```

**Assistant integration notes**:
- Device selection is the primary **backend-aware transpilation** hook. Assistant should suggest `lightning.qubit` for simulation, `qiskit.remote`/`braket.aws.qubit` for hardware, and warn about shot requirements for hardware.
- `qml.device` is a factory — string name maps to entry point `pennylane.devices` (see `setup.py`/`pyproject.toml` of plugins).
- For hardware, always set `shots` explicitly; analytic `shots=None` is simulator-only.

---

## 6. Quantum Chemistry / VQE Workflows — `qml.qchem`

Docs: `introduction/chemistry.html`, `code/qp_qchem.html`, whitepaper `arxiv:2111.09967`

### 6.1 Molecular Hamiltonian — single-call driver

```python
import pennylane as qml
from pennylane import numpy as np

# Define molecule — symbols + geometry (Angstrom)
symbols = ["H", "H"]
geometry = np.array([[0., 0., -0.66140414],
                     [0., 0.,  0.66140414]])

# Option A: Molecule object (recommended, differentiable)
molecule = qml.qchem.Molecule(symbols, geometry, charge=0, mult=1, basis_name="sto-3g")
H, qubits = qml.qchem.molecular_hamiltonian(molecule)
print(f"H: {H}")          # Hamiltonian with ~15 Pauli terms for H2/sto-3g
print(f"qubits: {qubits}")  # 4

# Option B: direct arrays (also differentiable)
H2, qubits2 = qml.qchem.molecular_hamiltonian(symbols, geometry)

# With active space, mapping, external backends
H_active, q_active = qml.qchem.molecular_hamiltonian(
    molecule,
    mapping="jordan_wigner",  # or "bravyi_kitaev", "parity"
    active_electrons=2,
    active_orbitals=2,
    method="pyscf",  # or "openfermion" — non-differentiable, requires pyscf/openfermion
)

# Import from file
# symbols, geometry = qml.qchem.read_structure("h2.xyz")

# Other observables
dipole = qml.qchem.dipole_moment(molecule)()  # qubit dipole observable
# spin2 = qml.qchem.spin2(qubits)  # S^2
# particle_number = qml.qchem.particle_number(qubits)
```

### 6.2 VQE — end-to-end (H2 example, the "hello world" of quantum chemistry)

```python
import pennylane as qml
from pennylane import numpy as np

symbols = ["H", "H"]
geometry = np.array([[0., 0., -0.66140414], [0., 0., 0.66140414]])
molecule = qml.qchem.Molecule(symbols, geometry)
H, qubits = qml.qchem.molecular_hamiltonian(molecule)
print(f"H2 Hamiltonian ({qubits} qubits): {H}")

# Hartree-Fock state — reference occupation
electrons = 2
hf_state = qml.qchem.hf_state(electrons, qubits)  # array([1, 1, 0, 0])
print("HF state:", hf_state)

# Device — 4 qubits for H2/sto-3g
dev = qml.device("default.qubit", wires=qubits)

# Ansatz 1: DoubleExcitation (minimal for H2)
@qml.qnode(dev)
def circuit_double(params):
    qml.BasisState(hf_state, wires=range(qubits))
    qml.DoubleExcitation(params, wires=[0, 1, 2, 3])
    return qml.expval(H)

params = np.array(0.0, requires_grad=True)
print("Initial energy:", circuit_double(params))

# Optimize
opt = qml.GradientDescentOptimizer(stepsize=0.4)
for i in range(30):
    params = opt.step(circuit_double, params)
    if i % 10 == 0:
        print(f"Step {i}: E = {circuit_double(params):.6f}")

print(f"Optimized E: {circuit_double(params):.6f}  (exact ~ -1.137)")

# Ansatz 2: UCCSD (general)
singles, doubles = qml.qchem.excitations(electrons, qubits)
print("singles:", singles, "doubles:", doubles)
# s_wires, d_wires = qml.qchem.excitations_to_wires(singles, doubles)

@qml.qnode(dev)
def circuit_uccsd(params):
    qml.BasisState(hf_state, wires=range(qubits))
    qml.UCCSD(params, wires=range(qubits), s_wires=singles, d_wires=doubles, init_state=hf_state)
    return qml.expval(H)

# Ansatz 3: k-UpCCGSD (hardware-efficient, particle-conserving)
@qml.qnode(dev)
def circuit_kupccgsd(weights):
    qml.BasisState(hf_state, wires=range(qubits))
    qml.kUpCCGSD(weights, wires=range(qubits), k=1, delta_sz=0, init_state=hf_state)
    return qml.expval(H)

# Ansatz 4: AllSinglesDoubles / GateFabric / ParticleConservingU1/U2
@qml.qnode(dev)
def circuit_gate_fabric(weights):
    qml.BasisState(hf_state, wires=range(qubits))
    qml.GateFabric(weights, wires=range(qubits), init_state=hf_state, include_pi=True)
    return qml.expval(H)
```

### 6.3 Differentiable Hartree-Fock — geometry optimization

```python
# Fully differentiable pipeline — optimize geometry AND circuit params
symbols = ["H", "H"]
geometry = np.array([[0., 0., -0.6614], [0., 0., 0.6614]], requires_grad=True)

# qml.qchem.hf_energy, qml.qchem.scf, qml.qchem.nuclear_energy are differentiable
# Example: optimize bond length via VQE + geometry gradient
dev = qml.device("default.qubit", wires=4)

def cost_fn(geometry, params):
    mol = qml.qchem.Molecule(symbols, geometry)
    H, _ = qml.qchem.molecular_hamiltonian(mol)
    @qml.qnode(dev)
    def circuit(p):
        qml.BasisState(np.array([1, 1, 0, 0]), wires=range(4))
        qml.DoubleExcitation(p, wires=[0, 1, 2, 3])
        return qml.expval(H)
    return circuit(params)

# Grad w.r.t. geometry (for force calculations)
# g = qml.grad(cost_fn, argnum=0)(geometry, params)

# Qubit tapering — reduce qubits via symmetries
# generators = qml.qchem.symmetry_generators(H)
# paulix_ops = qml.qchem.paulix_ops(generators, 4)
# H_tapered = qml.qchem.taper(H, generators, paulix_ops, [0, 1])
```

### 6.4 VQE with Torch/JAX — hybrid workflows

```python
# Torch VQE — QNode as part of nn.Module
import torch

dev = qml.device("default.qubit", wires=4)
symbols, geometry = ["H", "H"], np.array([[0.,0.,-0.6614],[0.,0.,0.6614]])
H, qubits = qml.qchem.molecular_hamiltonian(symbols, geometry)

@qml.qnode(dev, interface="torch")
def vqe_circuit(params):
    qml.BasisState(np.array([1, 1, 0, 0]), wires=range(4))
    qml.DoubleExcitation(params, wires=[0, 1, 2, 3])
    return qml.expval(H)

params = torch.tensor(0.0, requires_grad=True)
opt = torch.optim.Adam([params], lr=0.1)
for i in range(20):
    opt.zero_grad()
    loss = vqe_circuit(params)
    loss.backward()
    opt.step()
```

---

## 7. Differentiable Programming Patterns — Summary for Assistant Codegen

| Pattern | When to generate | Template |
|---|---|---|
| **QNode + autograd** | Quick prototyping, NumPy users | `@qml.qnode(dev)` + `qml.grad` + `qml.GradientDescentOptimizer` |
| **QNode + Torch** | ML integration, `nn.Module` | `@qml.qnode(dev, interface="torch")` + `qml.qnn.TorchLayer` + `torch.optim.Adam` |
| **QNode + JAX** | HPC, jit, vmap | `@qml.qnode(dev, interface="jax")` + `jax.grad` + `optax.adam` + `jax.jit` |
| **Adjoint diff** | Large simulators (>10 qubits) | `@qml.qnode(dev, diff_method="adjoint")` on `lightning.qubit` |
| **Parameter-shift** | Hardware or non-backprop devices | `@qml.qnode(dev, diff_method="parameter-shift")` |
| **Shot vector** | Benchmarking shot noise | `@qml.set_shots(shots=[10, 100, 1000])` |
| **Broadcasting** | Batch evaluation | Pass `np.array([...])` to QNode, check `dev.capabilities()["supports_broadcasting"]` |

**Anti-patterns to avoid in generated code**:
- Don't use `qml.ExpvalCost` (deprecated) — generate explicit QNode + `qml.expval(H)`.
- Don't use `interface="tf"` for new code — TF is deprecated as of v0.44, suggest JAX/Torch.
- Don't call `qml.adjoint(qml.AngleEmbedding(params, wires=...))` — use `qml.adjoint(qml.AngleEmbedding)(params, wires=...)`.
- Don't hardcode weight shapes — always use `Template.shape(...)`.

---

## 8. Device Plugin Architecture — Cheat Sheet for Assistant

```
User code:  @qml.qnode(qml.device("plugin.name", wires=...))
                │
                ▼
        Device.execute(circuits, execution_config)
                ▲
                │  preprocess_transforms() → CompilePipeline
                │  (validate_wires, validate_measurements, decompose, split_non_commuting, broadcast_expand)
                │
        TOML config (operators.gates, operators.observables, measurement_processes, compilation)
```

- **Entry point**: plugin registers `pennylane.devices` entry point in `pyproject.toml`.
- **Minimal device**: subclass `pennylane.devices.Device`, override `execute`.
- **Full device**: also override `preprocess_transforms` and provide `config_filepath` TOML.
- **Reference impl**: `pennylane/devices/reference_qubit.py` (minimal), `pennylane/devices/default_qubit.py` (full).
- **Catalyst**: set `qjit_compatible = true` in TOML + ensure `execute` is jittable.

---

## 9. File Map & References

- **Official docs (stable 0.45.1)**: https://docs.pennylane.ai/en/stable/
  - Circuits: `/introduction/circuits.html`
  - Interfaces/gradients: `/introduction/interfaces.html`
  - Measurements: `/introduction/measurements.html`
  - Templates: `/introduction/templates.html`
  - Chemistry: `/introduction/chemistry.html`
  - Devices: `/code/qp_devices.html`
  - Plugin guide: `/development/plugins.html`
- **GitHub**: https://github.com/PennyLaneAI/pennylane
- **Plugins**: https://pennylane.ai/plugins (40+ devices)
- **Demos**: https://pennylane.ai/qml/demonstrations (VQE, QML, optimization)
- **Context7 ID**: `/pennylaneai/pennylane` (5059 snippets, benchmark 77.6)

---

*Generated for Quantic OpenAxe — sdk-pennylane track. For integration, map each section to a Paseo skill: `qnode-builder`, `template-suggester`, `measurement-advisor`, `optimizer-selector`, `device-router`, `vqe-workflow`.*
