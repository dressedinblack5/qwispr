# Prior Art: Quantum Coding Assistants — Competitive Landscape & Gap Analysis

**Date:** 2026-08-29  
**Project:** Quantic OpenAxe AI Assistant — Track A Deliverable  
**Status:** Research Complete  
**Sources:** Official docs, GitHub repos, vendor platforms (verified 2026-08-29)

---

## Executive Summary

The quantum coding assistant landscape is **fragmented and immature**. No single tool delivers an end-to-end AI-assisted quantum development experience comparable to classical assistants (Copilot, Cursor). The closest attempt — **Qiskit Code Assistant** — was sunset in April 2026. **Classiq** leads on high-level synthesis but is a closed platform. **Braket** and **QMware Horizon** solve orchestration, not coding. Academic languages solve correctness, not productivity. Emerging GPU/tensor tools solve simulation speed, not developer experience.

**Core gap:** No assistant automates the *quantum-specific* hard parts — qubit management, error mitigation, hardware-aware transpilation, and hybrid classical↔quantum boundary optimization — while remaining open, multi-backend, and IDE-native.

---

## 1. Classiq — High-Level Quantum Modeling & Synthesis Engine

### Core Value Prop
Functional, hardware-agnostic quantum program design. Users describe *what* to compute (Qmod/Qfunc), Classiq's synthesis engine decides *how* — qubit allocation, gate decomposition, and optimization for minimal width/depth.

> "Classiq provides a powerful platform for designing, optimizing, analyzing, and executing quantum programs... high-level functional design approach... transform quantum logic into optimized circuits by leveraging our high-level functional design" — [Classiq Library README](https://github.com/Classiq/classiq-library)

**Key differentiator:** Synthesis engine that reuses qubits and minimizes circuit width automatically — no manual gate-level optimization.

### Target User
- Enterprise R&D teams building large algorithms (optimization, QML, chemistry)
- Researchers who need to scale beyond hand-crafted circuits
- Students via 2,000+ example library (largest collection per Classiq)

### Integration Model
| Layer | Mechanism |
|-------|-----------|
| **IDE** | Browser platform at `platform.classiq.io` — Model editor (green), Synthesis tab, Execution tab, Analyze & Debug |
| **SDK** | `pip install classiq` — Python SDK with `@qfunc`, `synthesize()`, `execute()`, `show()` |
| **CLI/API** | Upload `.qmod` files to Synthesis tab; Jupyter `.ipynb` for SDK |
| **Backends** | IBM, Amazon Braket, Azure Quantum, Nvidia (via execution layer) |

```python
from classiq import *

@qfunc
def main(res: Output[QNum]) -> None:
    a = QNum("a"); b = QNum("b")
    prepare_3(a); prepare_5(b)
    res |= a + b  # 3+5 = 8
    drop(a); drop(b)

quantum_program = synthesize(main)
show(quantum_program)
result = execute(quantum_program).result_value()
```

### Limitations
- **Black-box synthesis:** Optimization decisions opaque; hard to debug when synthesis fails or produces unexpected depth
- **Qmod learning curve:** New language (`QNum`, `QArray`, `allocate`, `drop`) — not Qiskit/Cirq compatible
- **Platform lock-in:** Best experience requires Classiq cloud; SDK still calls synthesis service
- **No AI assistant:** Library mentions "Use the library with AI agents" but no native code completion — relies on external LLMs
- **Scale ceiling:** Synthesis for 100+ qubit algorithms can be slow; no incremental synthesis

### Pricing / Access
- **Community:** Free tier on platform.classiq.io (limited synthesis/execution)
- **Enterprise:** Contact sales — custom quotas, private deployment, support
- **Open source:** `classiq-library` MIT-licensed (2.0k stars, 878 forks), but engine is proprietary
- **Docs:** https://docs.classiq.io (requires account for full platform)

### Automate vs User Does
| AUTOMATED | USER STILL DOES |
|-----------|-----------------|
| Qubit allocation & reuse | Define algorithmic logic & constraints |
| Gate synthesis & decomposition | Choose functional decomposition |
| Width/depth optimization | Set optimization preferences (width vs depth) |
| Hardware mapping (via backends) | Select target backend & verify results |
| Visualization (`show()`) | Interpret circuit & debug logic errors |

---

## 2. Qiskit Code Assistant (IBM) — VS Code Extension

### Core Value Prop
Generative AI code completion for Qiskit SDK v2.x, trained on millions of Qiskit tokens. Accelerates boilerplate circuit generation and surfaces best practices for IBM Quantum Platform services.

> "Trained with millions of text tokens from Qiskit SDK v2.x, years of Qiskit code examples, and IBM Quantum features... powered by IBM watsonx... Mistral-Small-3.2-24B-Instruct-2506" — [qiskit-code-assistant-vscode README](https://github.com/Qiskit/qiskit-code-assistant-vscode)

**Status: SUNSET** — Service discontinued 2026-04-28, repo archived 2026-05-29, read-only.

### Target User
- Qiskit developers (69% of Unitary Fund survey respondents prefer Qiskit; ~600k registered users)
- IBM Quantum Premium Plan users (cloud model)
- Non-premium users via local model (self-hosted)

### Integration Model
| Layer | Mechanism |
|-------|-----------|
| **IDE** | VS Code extension (`Qiskit.qiskit-vscode` on Marketplace + Open VSX) — also Cursor, Windsurf, VSCodium, IBM Bob |
| **Trigger** | `Ctrl+.` after `#comment` or code → faded suggestion → `Tab` accept / `Esc` dismiss |
| **Auth** | IBM Quantum API token (`quantum.cloud.ibm.com`) or `~/.qiskit/qiskit-ibm.json` multi-credential picker |
| **Local** | `bash <(curl -fsSL https://raw.githubusercontent.com/Qiskit/qiskit-code-assistant-vscode/main/setup_local.sh)` — runs Mistral locally |
| **Telemetry** | Opt-out via `qiskitCodeAssistant.enableTelemetry` — does NOT collect code |

### Limitations
- **Dead product:** No longer maintained; "may contain errors" per archive notice
- **Python-only:** No QASM, no Q# support
- **Premium gate:** Cloud model required IBM Quantum Premium Plan — excluded most users
- **Narrow scope:** Code completion only — no transpiler suggestions beyond what LLM hallucinates, no error mitigation, no backend advisor
- **No transpiler integration:** Despite name, does NOT call Qiskit transpiler passes; suggestions are text-based, not circuit-aware
- **95 stars, 35 forks:** Low adoption vs Qiskit SDK itself

### Pricing / Access
- **Cloud:** Included with IBM Quantum Premium Plan (paid) — now discontinued
- **Local:** Free but requires GPU for Mistral-24B; setup via `LOCAL_SETUP.md`
- **License:** Apache-2.0 (repo), but model EULA required acceptance
- **Marketplace:** Still installable but non-functional without service

### Automate vs User Does
| AUTOMATED | USER STILL DOES |
|-----------|-----------------|
| Boilerplate `QuantumCircuit` creation | Design algorithm & choose gates |
| Import & API usage (Qiskit 2.x) | Verify correctness & handle deprecations |
| Abstract prompt → circuit sketch | Refine parameters & add error mitigation |
| Code completion via semantic analysis | Transpile for specific backend (manual) |
| Best-practice surfacing | Select backend, manage jobs, interpret results |

**Lesson for OpenAxe:** The market *tried* a Copilot-for-Qiskit and failed — not due to tech, but due to premium gating and lack of circuit-aware intelligence. Opportunity: open, multi-backend, transpiler-aware assistant.

---

## 3. Horizon (QMware) — Hybrid Quantum-Classical Workflow Orchestration

> **Note:** "Horizon" branding is not consistently used in 2026; QMware's platform is now **QMware Cloud** (formerly referenced as Horizon/QMware Cloud). No separate "Horizon" product found — QMware Cloud is the hybrid orchestration layer.

### Core Value Prop
Hybrid quantum cloud that merges HPC (CPU/GPU) + virtual quantum processors (simulators + native QPUs) into a single backend. Focus: run hybrid algorithms *today* with 40 error-free simulated qubits, prepare for native QPUs tomorrow.

> "The QMware Cloud merges HPC, simulated and native quantum hardware to provide next-level computing performance... virtual quantum processors can include both classical simulators and native quantum registers" — [qm-ware.com](https://qm-ware.com/)

### Target User
| Segment | Need |
|---------|------|
| **Business & Industry** | Optimization (logistics, finance), simulation (drug discovery) |
| **Research & Academia** | Education, algorithm prototyping |
| **Software Providers** | Add quantum acceleration to existing apps |
| **Hardware Vendors** | Expose QPUs via QMware integration (4 levels: web service → co-location) |
| **Platform Providers** | Offer quantum-classical compute to customers |

### Integration Model
| Layer | Mechanism |
|-------|-----------|
| **Cloud** | `qm-ware.com` — Cloud Computing + Cloud@Customer (on-prem) |
| **SDK** | Quantum SDK (Python) — `qmware` package |
| **Runtime** | Quantum Runtime Environment — orchestrates classical↔quantum tasks |
| **Simulator** | Up to 40 error-free qubits (cost-effective vs hardware) |
| **Hardware** | Deep QPU integration: QuEra, QuiX Quantum, etc. (co-located in HPC data center) |
| **Compliance** | GDPR, GAIA-X, ISO, SOC — private cloud option |

### Limitations
- **Simulator ceiling:** 40 qubits — insufficient for advantage-scale algorithms
- **European focus:** Data centers in EU; latency for US/Asia users
- **Opaque pricing:** No public pricing; "Contact us" for trial — enterprise sales cycle
- **Limited QPU diversity:** Fewer backends than Braket (focused on QuEra, QuiX)
- **No coding assistant:** Orchestration only — no IDE, no code generation, no transpilation help
- **Vendor lock-in:** Workflows tied to QMware runtime; not portable to Braket/Azure

### Pricing / Access
- **Access Plans:** Tiered cloud plans (not public) — trial via contact form
- **Cloud@Customer:** Enterprise on-prem deployment (custom pricing)
- **Professional Services:** Algorithm design, customization, benchmarking, training (paid)
- **Simulator:** Included in cloud access; 40 qubits free during trial

### Automate vs User Does
| AUTOMATED | USER STILL DOES |
|-----------|-----------------|
| HPC + QPU resource provisioning | Design hybrid algorithm & partition classical/quantum |
| Simulator allocation (40 qubits) | Optimize for simulator vs hardware |
| Hardware abstraction (4 integration levels) | Choose integration level & manage data flow |
| Secure, compliant execution | Handle compliance & data governance |
| End-to-end support (consulting) | Define use case & validate business value |

---

## 4. Amazon Braket SDK Patterns — Hybrid Jobs, Hybrid Algorithms, Device Selection

### Core Value Prop
Single-point access to diverse QPUs + simulators with **one-line backend switching** and **Hybrid Jobs** for iterative variational algorithms (VQE, QAOA, QML) with priority queueing and parametric compilation.

> "With the Amazon Braket SDK, you can build quantum algorithms and then test and run them on different quantum computers and simulators by changing a single line of code" — [AWS Braket Docs](https://docs.aws.amazon.com/braket/latest/developerguide/what-is-braket.html)

### Target User
- AWS-native developers & researchers
- Teams needing multi-backend benchmarking (AQT, IonQ, IQM, QuEra, Rigetti)
- Variational algorithm practitioners (chemistry, optimization, QML)

### Integration Model
| Layer | Mechanism |
|-------|-----------|
| **SDK** | `amazon-braket-sdk-python` — `pip install amazon-braket-sdk` |
| **Notebooks** | Fully managed Jupyter notebooks (pre-installed SDK, examples) |
| **Console** | `console.aws.amazon.com/braket` — device management, job monitoring |
| **API** | Braket API + `AwsDevice` abstraction |
| **Hybrid Jobs** | Containerized: algorithm script + dependencies → S3 → CloudWatch metrics |
| **Embedded Simulators** | `lightning.qubit`, `lightning.gpu`, `braket:default-simulator` in same container as algorithm |

**Device Selection Pattern:**
```python
from braket.aws import AwsDevice
from braket.devices import LocalSimulator

# One-line switch:
device = LocalSimulator()  # local
device = AwsDevice('arn:aws:braket:::device/quantum-simulator/amazon/sv1')  # SV1
device = AwsDevice('arn:aws:braket:us-east-1::device/qpu/ionq/Forte-1')  # IonQ
device = AwsDevice('arn:aws:braket:eu-north-1::device/qpu/iqm/Garnet')  # IQM
device.properties  # topology, calibration, native gates
```

**Hybrid Jobs Pattern:**
```python
from braket.jobs import hybrid_job

@hybrid_job(device="arn:aws:braket:::device/quantum-simulator/amazon/sv1")
def my_vqe():
    # Classical optimization loop + quantum tasks
    # Priority queueing, parametric compilation, CloudWatch metrics
    pass
```

### Limitations
- **Regional fragmentation:** Devices tied to regions (e.g., AQT only in eu-north-1, Rigetti only in us-west-1) — cross-region SDK handles it but adds latency
- **One job per QPU:** Only one Hybrid Job runs per QPU at a time — queueing delays for iterative algorithms
- **Cost complexity:** Per-task + per-shot + instance hours; easy to overspend on iterative jobs
- **No transpiler assistant:** Device selection is manual; no advisor for "which device for my circuit?"
- **Container overhead:** BYOC (Bring Your Own Container) for custom libs adds Docker complexity
- **NISQ reality:** No error correction; hybrid algorithms required — pure quantum (Shor, Grover) not practical

### Pricing / Access
| Component | Pricing |
|-----------|---------|
| **QPUs** | Per-task + per-shot (e.g., IonQ Forte ~$0.30/task + $0.03/shot) — see [aws.amazon.com/braket/pricing](https://aws.amazon.com/braket/pricing/) |
| **Simulators** | SV1/DM1 per-minute; Local simulators free |
| **Hybrid Jobs** | EC2 instance hours + QPU tasks (priority queueing included) |
| **Free Tier** | Example notebooks free; no free QPU time |
| **Access** | AWS account required; no upfront commitment |

### Automate vs User Does
| AUTOMATED | USER STILL DOES |
|-----------|-----------------|
| Device abstraction (single line) | Choose device based on topology/gates/cost |
| Resource spin-up/teardown (Hybrid Jobs) | Write algorithm script & dependencies |
| Priority queueing for hybrid tasks | Manage queue waits & job cancellation |
| Parametric compilation (compile once) | Define parameterized circuits |
| Metrics to CloudWatch/S3 | Define custom metrics & interpret |
| Cross-region session handling | Handle regional device availability |

---

## 5. Academic Tools — Language-Level Approaches

### Overview
Academic languages prioritize **correctness, type safety, and formal reasoning** over developer productivity. They are research vehicles, not production tools.

| Language | Institution | Year | Paradigm | Key Innovation |
|----------|-------------|------|----------|----------------|
| **Quipper** | U Penn / Dalhousie | 2013 | Haskell-embedded | Scalable circuit description, hierarchical circuits |
| **Silq** | ETH Zurich | 2020 | Standalone | Automatic uncomputation, safe quantum memory management |
| **Q#** | Microsoft Research | 2017 | Standalone (C#/F# inspired) | QIR, Azure Quantum, 32-40 qubit simulator |
| **Scaffold** | Princeton / UCSB | 2012 | C-like | CTQG, hierarchical modules, resource estimation |
| **ProjectQ** | ETH Zurich | 2016 | Python-embedded | Extensible compiler, FermiLib, hardware backends |

### Core Value Prop (Shared)
- **Type safety:** Prevent quantum-specific bugs (cloning, measurement, entanglement) at compile time
- **Formal verification:** Prove circuit correctness vs classical testing
- **Abstraction:** High-level constructs (e.g., Silq's `forget`, Q#'s `using`/`borrowing`) hide manual qubit management

### Q# Deep Dive (Most Mature Academic Tool)
- **Syntax:** `operation`, `function`, `using (qubit = Qubit())`, `Adjoint`, `Controlled` — C#/F# hybrid
- **Platform:** Common Language Infrastructure, QIR (Quantum Intermediate Representation) via LLVM (2023)
- **Simulator:** 30 qubits local, 40 on Azure
- **Integration:** VS Code + Visual Studio extension, CLI, Jupyter, Azure Quantum
- **License:** MIT (open-sourced at Build 2019)
- **Community:** QuantumKatas (learning exercises), Codeforces contests

```qsharp
operation MultiplexOperationsFromGenerator<'T>(
    unitaryGenerator : (Int, (Int -> ('T => Unit is Adj + Ctl))),
    index: LittleEndian, target: 'T
) : Unit is Ctl + Adj {
    // Type-safe, adjointable, controllable
}
```

### Target User
- PL researchers & formal methods community
- Graduate students learning quantum programming
- Teams needing verified circuits (e.g., cryptography)

### Integration Model
| Tool | Integration |
|------|-------------|
| **Quipper** | Haskell library — `cabal install quipper` — CLI, no IDE |
| **Silq** | Standalone compiler — `silq` CLI — VS Code syntax highlighting (community) |
| **Q#** | VS Code + Visual Studio + CLI + Jupyter — `dotnet` toolchain |
| **Scaffold** | C compiler — `scaffold` CLI — CTQG backend |
| **ProjectQ** | `pip install projectq` — Python — Jupyter, CLI |

### Limitations
| Tool | Limitation |
|------|------------|
| **Quipper** | Haskell prerequisite; no hardware backend; unmaintained (last release 2019) |
| **Silq** | Small community; limited hardware support; no package ecosystem |
| **Q#** | Microsoft-centric (Azure); QIR still maturing; 32-qubit sim limit |
| **Scaffold** | C-like but quantum semantics bolted on; no modern tooling |
| **ProjectQ** | Python overhead; compiler extensibility is complex; limited docs |

**Shared:** No AI assistance, no transpilation advisor, no error mitigation, no hybrid orchestration, steep learning curves, small communities (<1k stars each).

### Pricing / Access
- **All open source:** MIT, Apache-2.0, or BSD — free
- **No cloud costs:** Simulators local only (except Q# on Azure)
- **Access:** GitHub + package managers

### Automate vs User Does
| AUTOMATED | USER STILL DOES |
|-----------|-----------------|
| Type checking (no-cloning, etc.) | Write correct algorithmic logic |
| Automatic uncomputation (Silq) | Manage quantum memory explicitly (others) |
| Compilation to gates | Choose gate set & optimize |
| Resource estimation (Scaffold) | Interpret estimates & redesign |
| Adjoint/Controlled generation (Q#) | Define base operations |

---

## 6. Emerging: TensorCircuit, Yao.jl, CUDA Quantum — Tensor Network / GPU Approaches

### Core Value Prop (Shared)
**Simulation speed via tensor networks + GPU acceleration + ML integration.** These are not coding assistants — they are high-performance *simulators* that happen to have Python/Julia APIs. Their value is enabling variational algorithms (VQE, QAOA, QML) at scales that would be impossible on QPUs or naive state-vector simulators.

| Tool | Creator | Language | Backend | Key Strength |
|------|---------|----------|---------|--------------|
| **TensorCircuit** | Tencent Quantum Lab (Shi-Xin Zhang) | Python | JAX/TF/PyTorch/Numpy/CuPy | Unified ML frameworks, AD, JIT, vmap, contractor |
| **Yao.jl** | QuantumBFS (Julia) | Julia | CPU/CUDA, batched registers | Quantum Blocks IR, differentiable, extensible |
| **CUDA Quantum (CUDA-Q)** | NVIDIA | Python/C++ | CPU/GPU/multi-GPU/multi-QPU | Kernels, dynamics, multi-GPU workflows |

### Target User
- HPC researchers & QML practitioners
- Teams needing 30+ qubit simulation with gradients
- Performance-focused developers (GPU clusters)

### Integration Model

**TensorCircuit:**
```python
import tensorcircuit as tc
tc.set_backend("jax")  # or tensorflow, pytorch, numpy
c = tc.Circuit(3)
c.H(0); c.CNOT(0,1); c.rx(1, theta=0.5)
exp = c.expectation_ps(z=[0,1])  # AD, JIT, vmap ready
# pip install tensorcircuit — docs: tensorcircuit.readthedocs.io
# Backends: JAX/TF/PyTorch — Devices: CPU/GPU/TPU — Providers: local/cloud/HPC
```

**Yao.jl:**
```julia
using Yao
reg = rand_state(3)
circuit = chain(3, put(1=>H), cn(1,2=>X), put(2=>Ry(0.5)))
expect(put(3=>Z), reg => circuit)  # AD, CUDA via CuYao
# add Yao / add CuYao — docs: docs.yaoquantum.org
```

**CUDA Quantum:**
```python
import cudaq
@cudaq.kernel
def bell():
    q = cudaq.qvector(2)
    h(q[0]); x.ctrl(q[0], q[1])
    mz(q)
# Backends: CPU, single-GPU, multi-GPU (mgpu), multi-QPU (mqpu)
# Hardware: IonQ, IQM, Quantinuum, QuEra, etc. via providers
# Docs: nvidia.github.io/cuda-quantum
```

| Tool | Integration |
|------|-------------|
| **TensorCircuit** | `pip install tensorcircuit` — Jupyter, Docker, Tencent Quantum Cloud — `tc.Circuit`, `tc.templates`, `tc.applications` |
| **Yao.jl** | `add Yao` in Julia REPL — Pluto notebooks — `Yao` blocks, registers, AD |
| **CUDA-Q** | `pip install cuda-quantum` or Docker — `cudaq.kernel` — CLI, Jupyter, HPC (Slurm) |

### Limitations
| Tool | Limitation |
|------|------------|
| **TensorCircuit** | Simulation only — no QPU control; contractor tuning required for >30 qubits; JAX/PyTorch version conflicts |
| **Yao.jl** | Julia niche — small hiring pool; CUDA setup complex; docs in Julia idioms |
| **CUDA-Q** | NVIDIA lock-in (GPU required for speed); C++ kernel syntax unfamiliar to Python devs; multi-GPU setup complex |

**Shared:** No coding assistant, no transpilation, no error mitigation, no natural language interface, simulation-focused (not hardware-aware coding).

### Pricing / Access
- **All open source:** Apache-2.0 (Yao, CUDA-Q), MIT (TensorCircuit) — free
- **GPU costs:** User pays for GPU time (local or cloud) — e.g., A100 ~$2-3/hr
- **Cloud:** Tencent Quantum Cloud (TensorCircuit), NVIDIA DGX Cloud (CUDA-Q) — paid
- **Stars:** TensorCircuit ~1k, Yao.jl ~500, CUDA-Q ~1k (niche but active)

### Automate vs User Does
| AUTOMATED | USER STILL DOES |
|-----------|-----------------|
| Tensor contraction optimization | Choose contraction path & backend |
| Automatic differentiation (AD) | Define cost function & optimizer |
| JIT compilation & vmap | Manage JIT compatibility & batching |
| GPU acceleration & multi-GPU | Configure GPU memory & distribution |
| Noise models (some) | Define noise & interpret results |
| State vector / MPS simulation | Choose simulation method & scale |

---

## Comparison Matrix

| Dimension | Classiq | Qiskit Code Assistant | QMware Cloud | Braket SDK | Academic (Q#/Silq/etc.) | Emerging (TC/Yao/CUDA-Q) |
|-----------|---------|----------------------|--------------|------------|-------------------------|--------------------------|
| **Core Value** | High-level synthesis | LLM code completion | Hybrid orchestration | Multi-backend access | Type safety & verification | GPU simulation speed |
| **Target User** | Enterprise R&D | Qiskit devs | Business + Research | AWS devs | PL researchers | HPC/QML researchers |
| **Integration** | Browser IDE + Python SDK | VS Code extension | Cloud + SDK + Runtime | Python SDK + Notebooks + Console | CLI + VS Code (Q#) | Python/Julia + Jupyter + HPC |
| **IDE** | ✅ Platform IDE | ✅ VS Code (archived) | ❌ No IDE | ❌ Notebooks only | ⚠️ Q# only | ❌ No IDE |
| **CLI** | ⚠️ Via SDK | ❌ No | ⚠️ Via SDK | ✅ API/CLI | ✅ All | ✅ All |
| **API** | ✅ SDK | ❌ Extension only | ✅ SDK | ✅ SDK + API | ⚠️ Library | ✅ SDK |
| **Automates** | Qubit alloc, synthesis, optimization | Boilerplate, imports | Resource provisioning | Device abstraction, Hybrid Jobs | Type checking, uncomputation | Contraction, AD, JIT |
| **User Still Does** | Logic, constraints, backend choice | Algorithm, verification, transpilation | Algorithm partition, data flow | Device choice, script, error mitigation | Logic, resource mgmt | Circuit design, GPU config |
| **Limitations** | Black-box, Qmod lock-in | Sunset, Python-only, premium gate | 40-qubit sim, opaque pricing | Regional, queueing, cost | Small community, no hardware | Sim-only, GPU lock-in |
| **Pricing** | Freemium + Enterprise | Premium (now dead) / Free local | Contact sales | Pay-per-task/shot | Free (OSS) | Free + GPU costs |
| **Access** | platform.classiq.io | Marketplace (non-functional) | qm-ware.com | AWS account | GitHub | pip/julia |
| **Stars/Forks** | 2.0k/878 (library) | 95/35 (archived) | N/A (private) | N/A (AWS) | <1k each | ~1k each |
| **Maturity** | Production | Dead | Production | Production | Research | Production (sim) |
| **AI Assistance** | ❌ No | ✅ LLM (dead) | ❌ No | ❌ No | ❌ No | ❌ No |
| **Transpilation** | ✅ Synthesis | ❌ No | ❌ No | ❌ Manual | ❌ No | ❌ No |
| **Error Mitigation** | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ⚠️ Noise models |
| **Hybrid Support** | ⚠️ Via backends | ❌ No | ✅ Native | ✅ Hybrid Jobs | ❌ No | ⚠️ Via backends |

---

## Gap Analysis: What's Missing?

### 1. No True Quantum-Aware AI Assistant
**Gap:** Qiskit Code Assistant was the only LLM-based quantum coding assistant and it is dead. No tool understands quantum semantics (superposition, entanglement, no-cloning) — they treat quantum code as text.

**What's needed:**
- LLM fine-tuned on quantum circuits *as circuits* (not just text) — with transpiler feedback loop
- Suggestions that are *circuit-aware* (e.g., "this CNOT chain will fail on IonQ's topology — use this instead")
- Natural language → verified circuit (with formal checks)

**OpenAxe opportunity:** Paseo agent that is quantum-aware — not just a wrapper around Mistral, but an agent that calls transpiler, simulator, and verifier tools.

### 2. No Cross-Platform Transpilation Advisor
**Gap:** Every tool is backend-siloed. Classiq synthesizes but doesn't advise "which backend for this circuit?" Braket lets you switch backends with one line but doesn't tell you *which* line to use. No tool compares depth/gate count/fidelity across IBM, IonQ, Rigetti, etc.

**What's needed:**
- Auto-transpile to multiple backends and rank by cost/fidelity/depth
- "This circuit is 40% deeper on Rigetti Ankaa-3 than IonQ Forte — recommend IonQ"
- Cost estimator before execution

**OpenAxe opportunity:** Skill `quantum-transpile-advisor` that takes a circuit IR and returns ranked backend recommendations with cost/depth estimates.

### 3. No Error Mitigation Automation
**Gap:** NISQ era requires error mitigation (readout mitigation, zero-noise extrapolation, probabilistic error cancellation) but no assistant automates it. Users manually add mitigation — or ignore it and get noisy results.

**What's needed:**
- Auto-detect when mitigation is needed (based on circuit depth + device calibration)
- Suggest and apply mitigation (e.g., "add readout mitigation for this 20-qubit circuit on IBM")
- Verify mitigation effectiveness via simulation

**OpenAxe opportunity:** Agent `error-mitigation-agent` that wraps Qiskit/Braket mitigation tools and applies them automatically.

### 4. No Hybrid Workflow Debugger
**Gap:** Hybrid algorithms (VQE, QAOA) involve classical↔quantum loops. No tool visualizes or debugs the loop — e.g., "why did my VQE not converge?" Users print expectation values and guess.

**What's needed:**
- Live visualization of variational loop (energy vs iteration, gradient norms)
- Breakpoints in hybrid jobs (pause after quantum task, inspect state)
- Auto-tune classical optimizer based on quantum noise

**OpenAxe opportunity:** Paseo workspace where hybrid job = task graph — classical tasks + quantum tasks with shared context and live metrics (like Braket Hybrid Jobs but with debugging).

### 5. No Cost/Performance Advisor
**Gap:** Quantum execution is expensive and unpredictable. No assistant warns "this circuit will cost $50 on IonQ" or "this transpilation will double your shot count."

**What's needed:**
- Pre-execution cost estimate (tasks × shots × device rate)
- Performance prediction (fidelity vs depth tradeoff)
- Budget-aware suggestions ("use simulator for debugging, QPU for final run")

**OpenAxe opportunity:** Skill `quantum-cost-estimator` that queries device pricing and estimates cost before submission.

### 6. No Collaborative Quantum IDE
**Gap:** Quantum development is solo — no pair programming, no shared circuit editing, no review workflow for quantum code. Classical IDEs have live share, but quantum IDEs (Classiq platform, Braket notebooks) are single-user.

**What's needed:**
- Shared circuit editing with live simulation
- Quantum code review (e.g., "this entanglement pattern is inefficient")
- Version control for circuits (diff circuits, not just code)

**OpenAxe opportunity:** Paseo workspace as collaborative quantum project — circuits as files, jobs as tasks, agents as reviewers.

### 7. No Learning Path Integration
**Gap:** Quantum is hard to learn. Tools assume expertise. No assistant guides novices from "what is a qubit?" to "my first VQE" with adaptive help.

**What's needed:**
- Novice mode: explain gates, suggest next steps, link to QuantumKatas
- Adaptive difficulty: detect user level and adjust suggestions
- Interactive tutorials with live circuit execution

**OpenAxe opportunity:** Skill `quantum-tutor` that is context-aware — knows user's circuit and suggests learning resources.

### 8. No Unified Quantum IR
**Gap:** Each tool has its own IR (Qmod, Qiskit Circuit, QIR, Braket IR, Yao Blocks, CUDA-Q kernels). No assistant translates between them or provides a unified view.

**What's needed:**
- Universal circuit IR that can target any backend (like LLVM for quantum)
- QIR is closest but not widely adopted outside Microsoft
- Auto-translate: "convert this Qiskit circuit to Braket" or "to Q#"

**OpenAxe opportunity:** Use QIR or OpenQASM 3 as internal IR — agents translate to/from any SDK.

---

## Strategic Implications for OpenAxe Quantic Assistant

### What to Build (Priority Order)

1. **Quantum-Aware Code Completion (P0)** — VS Code extension + Paseo agent that is circuit-aware, not just text-aware. Fine-tune on Qiskit/Braket/Classiq examples + transpiler feedback. *Differentiator: not sunset like Qiskit Code Assistant.*

2. **Transpilation & Backend Advisor (P0)** — Skill that auto-transpiles and ranks backends by cost/fidelity. *Differentiator: no one does this.*

3. **Hybrid Workflow Orchestrator (P1)** — Paseo workspace for VQE/QAOA with live loop visualization and debugging. *Differentiator: Braket Hybrid Jobs without debugging.*

4. **Error Mitigation Agent (P1)** — Auto-apply mitigation based on circuit + device. *Differentiator: NISQ necessity, no one automates.*

5. **Cost Estimator (P1)** — Pre-execution cost/performance prediction. *Differentiator: prevents bill shock.*

6. **Quantum Tutor (P2)** — Adaptive learning assistant. *Differentiator: lowers barrier to entry.*

### What NOT to Build (YAGNI)

- **Another simulator:** TensorCircuit/Yao/CUDA-Q already excel — integrate, don't replicate
- **Another language:** Q# / Silq already exist — support them via IR translation
- **Another cloud:** Braket/QMware already orchestrate — be the *assistant* that sits on top, not the cloud itself

### Architecture Sketch

```
User (VS Code) → OpenAxe Paseo
  ├── quantum-code-agent (completion, synthesis)
  ├── transpile-advisor-skill (backend ranking)
  ├── hybrid-orchestrator-agent (VQE/QAOA loops)
  ├── error-mitigation-agent (auto-mitigation)
  ├── cost-estimator-skill (pre-execution)
  └── quantum-tutor-skill (adaptive help)
        ↓
  Tools: Qiskit transpiler, Braket SDK, Classiq SDK (optional),
         TensorCircuit (sim), QIR/OpenQASM (IR)
        ↓
  Backends: IBM, IonQ, IQM, Rigetti, QuEra, Simulators
```

### Competitive Moat

- **Open & multi-backend:** Unlike Classiq (closed) or Qiskit Code Assistant (IBM-only), OpenAxe is backend-agnostic
- **Agent-native:** Unlike Braket/QMware (orchestration only), OpenAxe has *agents* that reason about quantum code
- **IDE + CLI + API:** Unlike academic tools (CLI only), OpenAxe meets users where they are
- **Cost-aware:** No competitor warns about cost before execution

---

## Sources & Verification

| Claim | Source | Verified |
|-------|--------|----------|
| Classiq synthesis engine & Qmod | [Classiq Library README](https://github.com/Classiq/classiq-library) | 2026-08-29 |
| Classiq platform & backends | [platform.classiq.io](https://platform.classiq.io) | 2026-08-29 |
| Qiskit Code Assistant sunset | [qiskit-code-assistant-vscode](https://github.com/Qiskit/qiskit-code-assistant-vscode) — archived 2026-05-29 | 2026-08-29 |
| Qiskit Code Assistant model | Mistral-Small-3.2-24B, watsonx, 600k users | README |
| QMware Cloud hybrid | [qm-ware.com](https://qm-ware.com) — 40 qubits, GDPR, HPC+QPU | 2026-08-29 |
| Braket Hybrid Jobs | [AWS Braket Docs](https://docs.aws.amazon.com/braket/latest/developerguide/braket-jobs.html) | 2026-08-29 |
| Braket devices | [Braket Devices](https://docs.aws.amazon.com/braket/latest/developerguide/braket-devices.html) — AQT, IonQ, IQM, QuEra, Rigetti | 2026-08-29 |
| Q# & QIR | [Wikipedia Q Sharp](https://en.wikipedia.org/wiki/Q_Sharp) + Microsoft QDK | 2026-08-29 |
| TensorCircuit | [tensorcircuit.readthedocs.io](https://tensorcircuit.readthedocs.io) — Tencent, JAX/TF/PyTorch | 2026-08-29 |
| Yao.jl | [yaoquantum.org](https://yaoquantum.org) + [docs.yaoquantum.org](https://docs.yaoquantum.org/dev/) | 2026-08-29 |
| CUDA Quantum | [nvidia.github.io/cuda-quantum](https://nvidia.github.io/cuda-quantum/latest/index.html) | 2026-08-29 |

---

## Appendix: Quick Reference — What They Automate vs User Does

| Tool | Automates | User Still Does |
|------|-----------|-----------------|
| **Classiq** | Qubit alloc, synthesis, optimization, visualization | Logic, constraints, backend choice, verification |
| **Qiskit Code Assistant** | Boilerplate, imports, best practices | Algorithm, verification, transpilation, backend |
| **QMware Cloud** | Resource provisioning, simulator, hardware abstraction | Algorithm partition, data flow, optimization |
| **Braket SDK** | Device abstraction, Hybrid Jobs, priority queueing | Device choice, script, error mitigation, cost mgmt |
| **Academic** | Type checking, uncomputation, compilation | Logic, resource mgmt, hardware mapping |
| **Emerging** | Contraction, AD, JIT, GPU acceleration | Circuit design, backend choice, GPU config |

**Universal gap:** No tool automates *quantum-specific* decisions (error mitigation, transpilation, cost, hybrid debugging) — all require manual expertise. This is the OpenAxe opportunity.

---

*Next: `architecture/quantic-integration.md` — How these patterns map to Paseo agents/skills.*
