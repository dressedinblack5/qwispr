# Resumen de Investigación: Asistente Quántico OpenAxe AI

**Estado**: Completo - 4 Tracks Entregados  
**Fecha**: 29 de Agosto, 2026  
**Período de Investigación**: Sesión única (agentes en paralelo)  
**Próxima Fase**: Planificación de implementación (pendiente decisión del usuario)

---

## Resumen Ejecutivo

Esta investigación establece una base comprehensiva para construir un **Asistente de Codificación Quántica** como extensión de OpenAxe/Paseo. El asistente se posiciona **por encima** de los SDKs cuánticos existentes (Qiskit, Cirq, PennyLane, Braket, etc.) proporcionando:

- **Completado de código consciente de la cuántica**
- **Asesoría de transpilación inteligente**
- **Automatización de mitigación de errores**
- **Estimación de costos en tiempo real**
- **Orquestación de flujos híbridos cuántico-clásicos**

**Hallazgo Clave**: El panorama competitivo tiene un vacío crítico — ninguna herramienta combina soporte multi-backend, orquestación nativa de agentes, conciencia de costos e inteligencia específica cuántica. El modelo de agentes de Paseo en OpenAxe está posicionado de forma única para llenar este vacío.

---

## Entregables Producidos

### Track A: Panorama de Codificación Quántica (5 Archivos de Investigación)

| Archivo | Líneas | Cobertura |
|---------|--------|-----------|
| `research/qiskit-1x-production-patterns.md` | 881 | Construcción de circuitos, pipeline de transpilación, primitivas Runtime (SamplerV2/EstimatorV2), BackendV2/Target, Modelado de ruido, Patrones (VQE/QAOA/QML) |
| `research/cirq-v1-patterns.md` | 1084 | GridQubit/LineQubit/NamedQubit, Gate→Operation, Moment/InsertStrategy, Simuladores (5 tipos), Google Quantum AI (Engine/Processor/QVM), Modelos de ruido (override de 3 métodos), API Transformer, Resolución de parámetros |
| `research/pennylane-patterns.md` | 1013 | QNode (decorador/constructor), Ejecución agnóstica de dispositivo, 4 interfaces autodiff, Templates (embedding/ansatz), Mediciones (12+ tipos), Optimizadores (clásicos + shot-adaptive), Dispositivos (7 built-in + 40+ plugins), qchem/VQE |
| `research/prior-art-quantum-coding-assistants.md` | 606 | Classiq, Qiskit Code Assistant (descontinuado), Horizon/QMware, Braket SDK, Académicos (Q#/Silq/Quipper), Emergentes (TensorCircuit/Yao.jl/CUDA-Q) — matriz de comparación + 8 oportunidades de gap |

### Track B: Arquitectura de Integración OpenAxe
- **`architecture/quantic-integration.md`** — Arquitectura completa de componentes, modelo de workspace, registro de agentes, sistema de skills, IR unificado (QASM 3.0 + QIR), gestión de contexto para circuitos grandes, patrones de delegación kanban-swarm, prioridad de implementación (4 fases), mitigación de riesgos

### Track C: Marco de Cuantificación de Ventajas
- **`analysis/advantage-framework.md`** — 5 dimensiones medibles (Acceso a Espacio de Problemas, Corrección de Código, Calidad de Optimización, Aceleración de Aprendizaje, Adaptividad de Hardware) con hipótesis, métodos de validación, suite de benchmarks (20 circuitos × 5 backends), plan estadístico, evaluación de factibilidad para integración en OpenAxe core

### Track D: Visión Next-Gen (2-5 Años)
- **`vision/next-gen-roadmap.md`** — Capacidades por fases (Año 1: Asistente Consciente Cuántico → Año 4-5: Stack Cuántico Auto-Optimizador), grafo de dependencias, vectores de evolución técnica (contexto, agentes, IR, hardware), posicionamiento de mercado, requisitos de inversión, métricas de éxito, puntos de decisión go/no-go

---

## Insights Críticos

### 1. La Estrategia de "Capa Asistente" es Correcta

| **NO Construir** | **SÍ Construir** |
|------------------|------------------|
| Simuladores | Agente que entiende física cuántica |
| Lenguajes | Orquesta herramientas existentes |
| Plataformas cloud | Multi-backend nativo |
| Hardware | Consciente de costos |

**Foso defensivo**: Open Source + Multi-backend + Agent-native + Cost-aware

### 2. OpenAxe/Paseo Proporciona 80% de la Infraestructura Requerida

| Necesidad | OpenAxe/Paseo Proporciona | Gap |
|-----------|---------------------------|-----|
| Aislamiento de workspace | ✅ `workspace create --isolation worktree` | Adaptador cuántico |
| Agentes especializados | ✅ Agentes custom en `openaxe.jsonc` | Templates de agentes cuánticos |
| Sistema de skills | ✅ Discovery + loading + permisos | Skills cuánticos |
| Delegación de tareas | ✅ Kanban-swarm (worker + verifiers) | Templates de flujo cuántico |
| Gestión de contexto | ✅ Compaction + spill + handoff | Streaming de circuitos grandes |
| Programación | ✅ Paseo schedule + OpenAxe scheduler | Integración bucles variacionales |
| Multi-usuario | 🔄 Workspace sharing (planificado) | Features de colaboración |

### 3. IR Unificado es el Linchpin

**QASM 3.0 + QIR (LLVM)** con anotaciones de metadatos permite:
- Escribe una vez (cualquier SDK) → transpila a cualquier backend
- Comparación cross-backend (profundidad, fidelidad, costo)
- Razonamiento del asistente sobre representación canónica
- Validación round-trip por backend

### 4. Gestión de Contexto para Circuitos Grandes es Resoluble

**Patrón Streaming spill + metadata preview**:
- QASM completo derramado a `compaction/tool-outputs/<session>/circuit_<hash>.qasm`
- Preview de 2k chars + metadatos estructurados mantenidos en contexto
- Detección `ghostSkills: ["quantum-circuit"]` preserva intención
- Briefing de handoff incluye datos de calibración + estimaciones de fidelidad

### 5. La Ventaja es Medible y Significativa

| Dimensión | Ventaja Objetivo | Validación |
|-----------|------------------|------------|
| Acceso Espacio Problemas | Nativo cuántico (BQP) vs Solo clásico | Benchmark: Shor, Grover, VQE, QAOA |
| Corrección Código | >85% F1 detección bugs cuánticos | 250 bugs inyectados × 5 clases |
| Calidad Optimización | >1.3x profundidad/fidelidad vs baseline | 100 transpilaciones circuito×backend |
| Aceleración Aprendizaje | >3x novato time-to-VQE | Estudio 20 usuarios |
| Adaptividad Hardware | >5x velocidad porting, >90% fidelidad | 10 circuitos × 4 backends |

---

## Factibilidad de Integración en OpenAxe Core

### Must-Have (Bajo Esfuerzo, Alto Impacto) — **Añadir a OpenAxe Core**

1. **Tipo de workspace cuántico** — Extender registro de adaptadores en `Workspace.Service`
2. **Detección ghost skills en compaction** — Añadir `ghostSkills` a input de `Compressor.compress()`
3. **Documentar límite profundidad subagent para cuántico** — `experimental.subagent_depth_limit: 3`

### Should-Have (Esfuerzo Medio, Alto Impacto) — **Añadir a OpenAxe Core**

4. **API custom compaction hook** — Skills registran `compactionHooks` para spill dominio-específico
5. **Sección cuántica en structured summary** — Añadir `quantumContext` a schema de summary
6. **Persistencia schedule Paseo** — Sobrevivir reinicio daemon para bucles variacionales

### Nice-to-Have (Futuro) — **Diferir**

7. Integración QIR/LLVM (si se añade language server support)
8. Sync multi-user workspace (desarrollo cuántico colaborativo)

---

## Prioridad de Implementación (Por Fases)

### Fase 1 (Semana 1-2): Fundación
- [ ] Skill `quantum-circuit` (templates SDK, patrones transpilador)
- [ ] Skill `quantum-backend` (comparación, estimador costo, monitor cola)
- [ ] Adaptador workspace cuántico (OpenAxe + Paseo)
- [ ] Parser/generador QASM 3.0 IR

### Fase 2 (Semana 2-3): Inteligencia
- [ ] Skill `quantum-noise` (modelos ruido, automatización ZNE/PEC/CDR)
- [ ] Skill `quantum-transpiler` (asesor transpilación cross-platform)
- [ ] Registro circuit-agent + backend-agent + noise-agent
- [ ] Flujo kanban-swarm (circuito → ruido → backend verificación)

### Fase 3 (Semana 3-4): Orquestación Híbrida
- [ ] Skill `quantum-hybrid` (bucle VQE/QAOA, integración optimizador clásico)
- [ ] Skill `quantum-optimizer` (métodos gradiente, shot-adaptive)
- [ ] Hybrid-agent para bucles variacionales end-to-end
- [ ] Integración Paseo schedule para iteraciones automatizadas

### Fase 4 (Mes 2+): Next-Gen
- [ ] Skill `quantum-tutor` (aprendizaje adaptativo, integración QuantumKatas)
- [ ] Transpilador auto-optimizador (selección passes ML-driven)
- [ ] IDE cuántico colaborativo (workspaces Paseo multi-usuario)
- [ ] Descubrimiento autónomo mitigación errores

---

## Registro de Riesgos Resumido

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Volatilidad API SDK (Qiskit 2.0) | Alta | Media | Target 1.x estable; IR QASM 3.0 como buffer |
| Ventana contexto muy pequeña | Alta | Alta | Streaming spill + metadata preview (diseñado) |
| Sin acceso hardware real | Alta | Baja | Simulador primero; fake backends (FakeBrisbane, QSimSimulator) |
| Complejidad permisos skills | Media | Media | Empezar read-only (`explore`-like); escalar gradual |
| Pérdida traducción IR | Media | Alta | QASM 3.0 + anotaciones; validar round-trip por backend |

---

## Próximos Pasos Recomendados

### Inmediato (Esta Sesión)
1. **Usuario revisa** este documento de resultados
2. **Usuario decide** qué tracks perseguir (todos / subset / modificado)
3. **Si procede**: Disparar `metis` para consulta pre-planning arquitectura

### Semana 1 (Si Aprobado)
1. Crear skill `quantum-circuit` + test `skill({name:"quantum-circuit"})`
2. Registrar agentes en `openaxe.jsonc`
3. Prototipar kanban-swarm: circuit worker + noise/backend verifiers
4. Implementar QASM 3.0 IR round-trip en Qiskit/Cirq/PennyLane

### Semana 2
1. Consulta `metis` sobre granularidad IR, granularidad agentes
2. Construir skills `quantum-backend` + `quantum-noise`
3. Ejecutar primer benchmark suite (5 circuitos × 3 backends)
4. Review `momus` de arquitectura antes Fase 2

---

## Inventario de Archivos

```
quantna/
├── INVESTIGATION_PLAN.md                    # Plan original
├── INVESTIGATION_RESULTS.md                 # Resultados en inglés
├── RESUMEN_INVESTIGACION_QUANTIC_ES.md      # Este archivo (español)
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
└── prototypes/                              # (vacío - para Fase 1)
```

---

## Solicitud de Decisión

**Por favor elija una opción:**

1. **Proceder con implementación completa** — Las 4 fases como diseñadas
2. **Proceder solo Fase 1** — Fundación (skills, workspace, IR, agentes)
3. **Proceder con alcance modificado** — Especificar qué tracks/prioridades cambian
4. **Pausar** — Investigar área específica más profundo primero (especificar cuál)
5. **Dirección diferente** — Describir enfoque alternativo

**Una vez decida**, yo:
- Dispararé `metis` para consulta pre-planning (si procede)
- Crearé `to-tickets` detallados para implementación
- Iniciaré trabajo prototipo Fase 1

---

## Apéndice: Detalle Técnico por SDK

### Qiskit 1.x (Patrones Producción)
- **Construcción**: `QuantumCircuit(n, m)` flat preferred, `ParameterVector` para binding vectorizado
- **Transpilación**: `generate_preset_pass_manager(target=backend.target)` única vía 2.0-safe, 6 stages, optimization_level 0-3
- **Runtime**: `SamplerV2`/`EstimatorV2` modelo PUB `[(circuit, observables, param_values)]`, `Session` iterativo vs `Batch` paralelo
- **Backend**: `BackendV2` + `Target` source of truth, `FakeBrisbane`/`FakeKyoto` para CI
- **Ruido**: `AerSimulator.from_backend()` (device) vs `NoiseModel` custom, basis-gate attachment crítico
- **Patterns**: 4-step Pattern (Map→Optimize→Execute→Post-process), `qiskit_algorithms` VQE/QAOA con `EstimatorV2`/`SamplerV2`

### Cirq v1.x (Patrones Idiomáticos)
- **Qubits**: `GridQubit` (hardware Google), `LineQubit` (simulador), `NamedQubit` (lógico), `LineQid`/`GridQid` (qudits)
- **Gate→Operation**: Gate agnóstico, Operation = Gate + qubits, modificadores `.controlled()`, `.on()`
- **Moment**: Colección operaciones disjoint qubits, `InsertStrategy` (EARLIEST, NEW, INLINE, NEW_THEN_INLINE)
- **Simulación**: Taxonomía `SimulatesSamples`/`Amplitudes`/`ExpectationValues`/`FinalState`, 5 simuladores
- **Google Quantum AI**: `cirq_google.Engine`/`Processor`/`Sampler`, QVM (`SimulatedLocalEngine` + `QSimSimulator`) para mocking local
- **Ruido**: `NoiseModel` 3-method override, `ConstantQubitNoiseModel`, `InsertionNoiseModel`, canales (depolarize, amplitude_damp, etc.)
- **Transpilación**: Transformer API (`Circuit → Circuit`), pipeline merge→drop→expand→synchronize, `optimize_for_target_gateset`
- **Parámetros**: `sympy.Symbol`/`cirq.Symbol`, `ParamResolver`, `Sweepable` algebra (`*`, `+`, `Linspace`, `Points`)

### PennyLane v0.45.1 (Programación Diferenciable)
- **QNode**: `@qml.qnode(dev)` decorator, `device` agnóstico via `update(device=)`, 4 interfaces (autograd/torch/jax/tf), `diff_method="best"`
- **Templates**: `AngleEmbedding`/`IQPEmbedding`/`AmplitudeEmbedding`, `StronglyEntanglingLayers` vs `BasicEntanglerLayers`, `Template.shape()` pattern
- **Mediciones**: `expval`/`var`/`probs`/`sample`/`counts`/`mutual_info` + `vn_entropy`/`purity`/`state`/`density_matrix`/`classical_shadow`/`shadow_expval`, tensores Pauli
- **Optimización**: `GradientDescentOptimizer`/`AdamOptimizer`, `QNGOptimizer` (quantum natural gradient), `ShotAdaptiveOptimizer`, JAX/Torch nativo
- **Dispositivos**: `default.qubit`/`default.mixed`/`default.clifford`/`null.qubit`, `lightning.qubit` (adjoint) / `lightning.gpu` (cuQuantum) / `lightning.kokkos`, 40+ plugins hardware
- **QChem/VQE**: `qml.qchem.Molecule` + `molecular_hamiltonian` (diferenciable), `UCCSD`/`kUpCCGSD`/`GateFabric`, HF geometry optimization diferenciable

---

## Análisis Competitivo: Gap Opportunities

| Gap | Descripción | Oportunidad OpenAxe |
|-----|-------------|---------------------|
| **1. Sin Asistente IA Consciente Cuántico** | Qiskit Code Assistant era solo texto y está muerto. Ninguna herramienta entiende superposición/entrelazamiento/no-clonación | LLM fine-tuned en circuitos como circuitos con feedback loop transpilador |
| **2. Sin Asesor Transpilación Cross-Platform** | Todas herramientas son backend-siloadas. Nadie rankea "este circuito 40% más profundo en Rigetti vs IonQ" | Skill `quantum-transpile-advisor` |
| **3. Sin Automatización Mitigación Errores** | NISQ requiere mitigación pero todas dejan manual | Agente `error-mitigation` auto-aplica readout/ZNE basado en profundidad + calibración |
| **4. Sin Debugger Flujo Híbrido** | Bucles VQE/QAOA son cajas negras | Workspace Paseo con visualización loop en vivo + breakpoints |
| **5. Sin Asesor Costo/Rendimiento** | Sin warning pre-ejecución ("esto costará $50 en IonQ") | Skill `quantum-cost-estimator` |
| **6. Sin IDE Cuántico Colaborativo** | Solo single-user (Classiq platform, Braket notebooks) | Workspace Paseo — circuitos como archivos, jobs como tareas, agentes como reviewers |
| **7. Sin Ruta Aprendizaje** | Herramientas asumen expertise | Skill `quantum-tutor` (adaptativo, links QuantumKatas) |
| **8. Sin IR Unificado** | Qmod vs Qiskit Circuit vs QIR vs Braket IR vs Yao Blocks — sin traducción | IR interno QASM 3.0/OpenQASM 3 + auto-traducción |

---

## Métricas de Éxito por Horizonte

### Año 1 (Tracción)
- [ ] 500 MAU (usuarios activos mensuales)
- [ ] 1000 circuitos cuánticos transpilados/día
- [ ] 50% mejora profundidad transpilación vs baseline
- [ ] 10 integraciones cursos universitarios

### Año 2 (Product-Market Fit)
- [ ] 10,000 MAU
- [ ] 50 runs producción VQE/QAOA/día en hardware real
- [ ] 3x aceleración aprendizaje validada
- [ ] $1M ARR (licencias enterprise)

### Año 3 (Liderazgo Mercado)
- [ ] 100,000 MAU
- [ ] IDE default para 50% cursos computación cuántica
- [ ] 10 clientes enterprise >$100k/año
- [ ] Ecosistema skills auto-sostenible (50+ skills comunidad)

### Año 4-5 (Definición Categoría)
- [ ] 1M+ MAU
- [ ] "Asistente cuántico" = término genérico (como "Copilot")
- [ ] Asistente descubre algoritmos cuánticos publicados
- [ ] $100M+ ARR o adquisición estratégica/IPO

---

*Este documento es vivo. Actualizar trimestralmente basado en progreso técnico, feedback mercado, y evolución hardware cuántico.*