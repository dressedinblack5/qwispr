# Quantic OpenAxe — Re-Scoped Work Plan

**General-purpose coding assistant on OpenAxe that uses quantum algorithms for software engineering problems.**

---

## 1. Problem-Algorithm Mapping (Evidence-Based)

| Coding Problem | Quantum Algorithm | Why Quantum Wins | Classical Baseline | Evidence |
|---|---|---|---|---|
| **Large refactoring search** (find optimal sequence of semantics-preserving transforms) | QAOA / Quantum Annealing | Exponential search space (n! transform orders); quantum tunneling escapes local optima | Greedy/beam search, simulated annealing | [Farhi et al. 2014 QAOA]; D-Wave case studies on scheduling |
| **Dependency conflict resolution** (version SAT with constraints) | QUBO → QAOA / Annealing | NP-hard; quantum explores superposition of assignments | SAT solvers (CDCL), MaxSAT | [Lucas 2014 Ising formulations]; D-Wave on railway scheduling |
| **Code search / pattern matching** in 10M+ LOC | Grover's / Amplitude Amplification | O(√N) vs O(N) for unstructured search | grep, ripgrep, semantic search (embeddings) | Grover 1996; limited by oracle cost — needs cheap oracle |
| **Test input generation** (cover hard-to-reach branches) | VQE / Variational circuits | High-dim continuous input space; gradient-free optimization | Symbolic execution, fuzzing (AFL), random | [Peruzzo et al. 2014 VQE]; QC fuzzing papers (2021-2024) |
| **Call graph reachability / complexity** | Quantum Walks | Quadratic speedup on graph diameter/hitting time | BFS/DFS, static analysis | [Childs et al. 2003 quantum walk search]; limited to structured graphs |
| **Bug classification / clone detection** | QNN / QSVM | Potential advantage on high-dim sparse feature spaces | Transformers, GraphCodeBERT | [Schuld & Killoran 2019 QML]; NISQ-era advantage unproven |
| **Resource allocation / CI scheduling** | QUBO → Annealing | NP-hard combinatorial; many constraints | OR-Tools, genetic algorithms | D-Wave on job-shop scheduling |

**Reality Check**: Only **QAOA/Annealing for combinatorial optimization** (refactoring, deps, scheduling) and **Grover's for search with cheap oracle** have near-term advantage claims. VQE/QML/QWalk need error-corrected hardware for provable wins.

---

## 2. Quantum Backend Strategy

| Phase | Backend | Use Case | Rationale |
|---|---|---|---|
| **Phase 1 (Months 1-6)** | **Classical simulators only** (Qiskit Aer, Cirq Sim, Pennylane default.qubit) | All algorithm development, benchmarking | Zero cost, deterministic, no queue times, full state access for debugging |
| **Phase 2 (Months 6-12)** | **Cloud simulators + NISQ hardware** (IBM Quantum, AWS Braket, IonQ) | QAOA on ≤20 qubit problems, Grover oracles | Real noise characterization, hybrid workflows |
| **Phase 3 (Year 2+)** | **Error-mitigated hardware** (IBM Heron, Google Willow, Quantinuum H2) | Larger QAOA (30-50 qubits), VQE | Error mitigation (ZNE, PEC) enables classically-intractable instances |
| **Phase 4 (Year 3+)** | **Early FTQC** (logical qubits) | Full Grover, QPE, QML | Logical error rates <10⁻⁶ |

**Decision Rule**: Never require hardware for Phase 1. Simulator parity is the gate.

---

## 3. Agent/Skill Architecture

```
OpenAxe Workspace
├── Core Skills (always loaded)
│   ├── code-graph        # AST/CFG extraction, language-agnostic
│   ├── problem-encoder   # Coding problem → QUBO/Hamiltonian
│   ├── quantum-oracle    # Cheap oracle circuits for Grover/VQE
│   └── result-decoder    # Quantum measurement → code change
│
├── Algorithm Agents (specialized, loaded on demand)
│   ├── qaoa-agent        # Combinatorial optimization (refactoring, deps, scheduling)
│   ├── grover-agent      # Unstructured search with oracle
│   ├── vqe-agent         # Variational optimization (test gen, parameters)
│   ├── qwalk-agent       # Graph algorithms (reachability, centrality)
│   └── qml-agent         # Classification (bug detection, clones)
│
├── Task Agents (user-facing, compose algorithm agents)
│   ├── refactor-agent    # "Optimize this module" → qaoa-agent
│   ├── search-agent      # "Find all X patterns" → grover-agent
│   ├── testgen-agent     # "Generate tests for coverage" → vqe-agent
│   ├── dep-agent         # "Resolve conflicts" → qaoa-agent
│   └── analyze-agent     # "Complexity/reachability" → qwalk-agent
│
└── Hybrid Orchestrator
    ├── classical-pre     # Problem reduction, kernel extraction
    ├── quantum-core      # Algorithm agent delegation
    └── classical-post    # Result validation, patch application
```

**Skill Loading**: `load_skills` per task agent — only loads needed algorithm agents.

---

## 4. Unified IR: Coding Problem → Quantum Problem

```
Source Code
    │
    ▼
[code-graph skill] ──▶ AST + CFG + DFG (language-agnostic, Tree-sitter based)
    │
    ▼
[problem-encoder skill] ──▶ Problem-Specific IR
    │
    ├─▶ Refactoring/Deps/Scheduling → QUBO Matrix (Ising Hamiltonian)
    ├─▶ Search → Oracle Circuit + Target State
    ├─▶ Test Gen → Parameterized Circuit + Cost Function
    ├─▶ Graph Analysis → Adjacency Matrix + Walk Operator
    └─▶ Classification → Feature Map Circuit + Kernel
    │
    ▼
[Algorithm Agent] ──▶ Quantum Result (bitstring / expectation values / samples)
    │
    ▼
[result-decoder skill] ──▶ Concrete Code Changes (patches, test cases, decisions)
```

**Key Insight**: The encoder is the hard part. Each coding problem needs a *provably correct* encoding to QUBO/Hamiltonian. Start with **dependency resolution** (well-studied QUBO mapping) and **refactoring search** (transform sequence as permutation → QUBO).

---

## 5. Phase 1 MVP (Months 1-6) — "One Real Win"

### Scope
**Single coding task with measurable quantum advantage on simulator:**

**Task**: *Automatic dependency version conflict resolution for npm/pip/cargo lockfiles*

- **Input**: `package.json` + `package-lock.json` with version conflicts
- **Problem**: Find valid version assignment satisfying all constraints (NP-hard)
- **Encoding**: Variables = package@version; Constraints = clauses → QUBO
- **Algorithm**: QAOA (p=2-4 layers) on simulator
- **Baseline**: `npm dedupe`, `pip-tools`, `cargo update`, OR-Tools CP-SAT
- **Success Metric**: **Quantum finds valid solution where classical times out OR finds better solution (fewer major version bumps) in ≤2x classical time**

### Deliverables
1. `code-graph` skill: Tree-sitter parsers for JS/Python/Rust → unified CFG
2. `problem-encoder` skill: Dependency graph → QUBO (with constraint penalties)
3. `qaoa-agent`: QAOA implementation (PennyLane + Qiskit backends)
4. `dep-agent`: Orchestrates encoder → QAOA → decoder → lockfile patch
5. Benchmark suite: 50 real conflicted lockfiles from GitHub
6. CI pipeline: Classical baseline + quantum run + comparison report

### Go/No-Go Checkpoint (Month 6)
| Criterion | Threshold |
|---|---|
| Quantum solves ≥80% of instances classical solves | ✓ Required |
| Quantum solves ≥20% instances classical *fails* on | ✓ Required |
| Median quantum time ≤2x classical median | ✓ Required |
| Encoding correctness verified (all solutions valid) | ✓ Required |
| **If ANY fails → Pivot/Stop** | |

---

## 6. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Encoding overhead > quantum speedup** | High | Fatal | Profile encoder; cache QUBO; only quantum for n>50 variables |
| **Classical heuristics "good enough"** | High | High | Target problems where classical *fails* (not just slower) |
| **Simulator ≠ hardware (noise)** | Medium | High | Phase 1 simulator-only; noise-aware QAOA in Phase 2 |
| **QUBO size explodes (n² variables)** | Medium | Medium | Problem decomposition; kernel extraction; hybrid classical-quantum |
| **Oracle cost kills Grover advantage** | High | Fatal for search | Only use Grover when oracle is O(1) circuit (e.g., exact AST match) |
| **Skill/agent complexity unmaintainable** | Medium | Medium | Strict interfaces; integration tests per skill; skill registry |
| **OpenAxe API changes break skills** | Low | High | Pin OpenAxe version; adapter layer |

---

## 7. 4-Phase Roadmap (Adapted from Vision)

| Phase | Timeline | Theme | Key Deliverable |
|---|---|---|---|
| **1. Quantum-Enhanced Solver** | Months 1-6 | One combinatorial problem (deps) with proven advantage | `dep-agent` + benchmark report |
| **2. Algorithm Portfolio** | Months 6-18 | QAOA (refactoring), Grover (search), VQE (test gen) | 3 task agents working on real codebases |
| **3. Hybrid Orchestrator** | Year 2 | Classical pre/post + quantum core + auto-problem-routing | Single "quantum-assist" command |
| **4. Self-Improving Loop** | Year 3+ | Quantum learns from classical feedback; classical uses quantum results | Continuous improvement on benchmarks |

---

## 8. Next Steps (Immediate)

1. **Initialize OpenAxe** in `/home/dressedinblack/Projects/qwispr`
2. **Create skill scaffolding**: `code-graph`, `problem-encoder`, `qaoa-agent`, `dep-agent`
3. **Build encoder** for npm/pip/cargo → QUBO (start with npm — most conflicts)
4. **Implement QAOA** in PennyLane (simulator backend, gradient-free optimizer)
5. **Collect benchmark set**: 50 real conflicted lockfiles
6. **Run baseline** (classical solvers) → establish ground truth
7. **Run quantum** → compare

---

## 9. File Structure (Target)

```
qwispr/
├── .omo/
│   └── plans/
│       └── quantic-openaxe-re-scoped.md    # This file
├── skills/
│   ├── code-graph/
│   │   ├── SKILL.md
│   │   ├── parsers/        # Tree-sitter grammars
│   │   └── extractors/     # AST → CFG/DFG
│   ├── problem-encoder/
│   │   ├── SKILL.md
│   │   ├── dep-encoder.ts  # Lockfile → QUBO
│   │   └── refactor-encoder.ts
│   ├── qaoa-agent/
│   │   ├── SKILL.md
│   │   ├── qaoa.ts         # PennyLane QAOA
│   │   └── optimizer.ts    # COBYLA/SPSA
│   ├── grover-agent/
│   ├── vqe-agent/
│   ├── qwalk-agent/
│   ├── qml-agent/
│   ├── refactor-agent/
│   ├── search-agent/
│   ├── testgen-agent/
│   ├── dep-agent/
│   └── analyze-agent/
├── benchmarks/
│   ├── lockfiles/          # 50 real conflicted lockfiles
│   ├── baselines/          # Classical solver results
│   └── quantum-results/    # QAOA results
├── tests/
│   ├── integration/        # Skill integration tests
│   └── unit/               # Per-skill unit tests
├── AGENTS.md               # Agent registry for OpenAxe
├── openaxe.json            # OpenAxe config
└── README.md
```

---

## 10. Decision Request

**Proceed with Phase 1 as defined?** (Dep-agent + QAOA on simulator, 6-month MVP)

- **Yes** → I'll create tickets via `to-tickets` and start implementation
- **Modify** → Tell me what to change (different Phase 1 task, different algorithm, different scope)
- **No** → Different direction