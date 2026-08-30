# Quantum vs Classical Benchmark Report

Generated: 2026-08-29T18:51:06.435Z

## Executive Summary (Phase 1 MVP Criteria)

| Criterio | Valor | Umbral | Estado |
|----------|-------|--------|--------|
| C1: Quantum resuelve ≥80% de lo que resuelve Classical | 100.0% | ≥80% | PASS |
| C2: Quantum resuelve ≥20% de lo que Classical falla | 100.0% | ≥20% | PASS |
| C3: Tiempo mediano Quantum ≤ 2x Classical | Infinity | ≤2.0 | FAIL |
| **Total** | | | **PASS** |

## Por Tipo de Conflicto

| Tipo de Conflicto | Casos | Classical ✓ | Quantum ✓ | Solo Quantum |
|-------------------|-------|-------------|-----------|--------------|
| complex-mixed | 10 | 10 | 10 | 0 |
| cyclic-conflict | 10 | 10 | 10 | 0 |
| diamond-conflict | 10 | 0 | 10 | 10 |
| direct-conflict | 10 | 10 | 10 | 0 |
| optional-conflict | 10 | 0 | 10 | 10 |
| peer-conflict | 10 | 0 | 10 | 10 |

## Resultados Detallados

| Lockfile | Tipo | Classical | Quantum | Ratio Tiempo | Solo Quantum |
|----------|------|-----------|---------|--------------|--------------|
| lockfile-complex-mixed-1.json | complex-mixed | ✓ | ✓ | 6.42 | no |
| lockfile-complex-mixed-10.json | complex-mixed | ✓ | ✓ | 23.33 | no |
| lockfile-complex-mixed-2.json | complex-mixed | ✓ | ✓ | Infinity | no |
| lockfile-complex-mixed-3.json | complex-mixed | ✓ | ✓ | Infinity | no |
| lockfile-complex-mixed-4.json | complex-mixed | ✓ | ✓ | Infinity | no |
| lockfile-complex-mixed-5.json | complex-mixed | ✓ | ✓ | Infinity | no |
| lockfile-complex-mixed-6.json | complex-mixed | ✓ | ✓ | 22.00 | no |
| lockfile-complex-mixed-7.json | complex-mixed | ✓ | ✓ | Infinity | no |
| lockfile-complex-mixed-8.json | complex-mixed | ✓ | ✓ | Infinity | no |
| lockfile-complex-mixed-9.json | complex-mixed | ✓ | ✓ | Infinity | no |
| lockfile-cyclic-conflict-1.json | cyclic-conflict | ✓ | ✓ | Infinity | no |
| lockfile-cyclic-conflict-10.json | cyclic-conflict | ✓ | ✓ | 21.00 | no |
| lockfile-cyclic-conflict-2.json | cyclic-conflict | ✓ | ✓ | Infinity | no |
| lockfile-cyclic-conflict-3.json | cyclic-conflict | ✓ | ✓ | Infinity | no |
| lockfile-cyclic-conflict-4.json | cyclic-conflict | ✓ | ✓ | Infinity | no |
| lockfile-cyclic-conflict-5.json | cyclic-conflict | ✓ | ✓ | Infinity | no |
| lockfile-cyclic-conflict-6.json | cyclic-conflict | ✓ | ✓ | Infinity | no |
| lockfile-cyclic-conflict-7.json | cyclic-conflict | ✓ | ✓ | Infinity | no |
| lockfile-cyclic-conflict-8.json | cyclic-conflict | ✓ | ✓ | Infinity | no |
| lockfile-cyclic-conflict-9.json | cyclic-conflict | ✓ | ✓ | Infinity | no |
| lockfile-diamond-conflict-1.json | diamond-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-diamond-conflict-10.json | diamond-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-diamond-conflict-2.json | diamond-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-diamond-conflict-3.json | diamond-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-diamond-conflict-4.json | diamond-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-diamond-conflict-5.json | diamond-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-diamond-conflict-6.json | diamond-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-diamond-conflict-7.json | diamond-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-diamond-conflict-8.json | diamond-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-diamond-conflict-9.json | diamond-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-direct-conflict-1.json | direct-conflict | ✓ | ✓ | Infinity | no |
| lockfile-direct-conflict-10.json | direct-conflict | ✓ | ✓ | Infinity | no |
| lockfile-direct-conflict-2.json | direct-conflict | ✓ | ✓ | Infinity | no |
| lockfile-direct-conflict-3.json | direct-conflict | ✓ | ✓ | 21.67 | no |
| lockfile-direct-conflict-4.json | direct-conflict | ✓ | ✓ | Infinity | no |
| lockfile-direct-conflict-5.json | direct-conflict | ✓ | ✓ | Infinity | no |
| lockfile-direct-conflict-6.json | direct-conflict | ✓ | ✓ | Infinity | no |
| lockfile-direct-conflict-7.json | direct-conflict | ✓ | ✓ | Infinity | no |
| lockfile-direct-conflict-8.json | direct-conflict | ✓ | ✓ | Infinity | no |
| lockfile-direct-conflict-9.json | direct-conflict | ✓ | ✓ | Infinity | no |
| lockfile-optional-conflict-1.json | optional-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-optional-conflict-10.json | optional-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-optional-conflict-2.json | optional-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-optional-conflict-3.json | optional-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-optional-conflict-4.json | optional-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-optional-conflict-5.json | optional-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-optional-conflict-6.json | optional-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-optional-conflict-7.json | optional-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-optional-conflict-8.json | optional-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-optional-conflict-9.json | optional-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-peer-conflict-1.json | peer-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-peer-conflict-10.json | peer-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-peer-conflict-2.json | peer-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-peer-conflict-3.json | peer-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-peer-conflict-4.json | peer-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-peer-conflict-5.json | peer-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-peer-conflict-6.json | peer-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-peer-conflict-7.json | peer-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-peer-conflict-8.json | peer-conflict | ✗ | ✓ | N/A | SÍ |
| lockfile-peer-conflict-9.json | peer-conflict | ✗ | ✓ | N/A | SÍ |

## Decisión Go/No-Go

**PASS** — Los criterios del MVP Fase 1 se cumplen. Proceder a la siguiente fase.
