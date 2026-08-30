# AGENTS.md — Agent Registry

This file registers all agents available in the qwispr workspace.

## Core Agents

| Agent | Skill | Description | Trigger |
|-------|-------|-------------|---------|
| `code-graph` | code-graph | AST/CFG/DFG extraction | `qwispr code-graph` |
| `problem-encoder` | problem-encoder | Problem → QUBO encoding | `qwispr encode-deps` |
| `qaoa-agent` | qaoa-agent | QAOA quantum optimization | `qwispr qaoa` |
| `dep-agent` | dep-agent | Dependency resolution orchestrator | `qwispr resolve-deps` |

## Composite Agents (Future)

| Agent | Composition | Description |
|-------|-------------|-------------|
| `refactor-agent` | code-graph + qaoa-agent | Semantic refactoring search |
| `search-agent` | code-graph + grover-agent | Code pattern search |
| `testgen-agent` | code-graph + vqe-agent | Test input generation |
| `analyze-agent` | code-graph + qwalk-agent | Complexity/reachability analysis |

## Agent Protocol

All agents implement:
```typescript
interface Agent {
  name: string;
  skill: string;
  execute(input: unknown, options?: Record<string, unknown>): Promise<unknown>;
  validate(input: unknown): boolean;
  describe(): AgentDescription;
}
```

Agents are loaded via OpenAxe's skill system and composed by task agents.