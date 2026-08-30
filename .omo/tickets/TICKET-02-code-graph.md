# TICKET-02: code-graph Skill — Tree-sitter Parsers + AST→CFG Extraction

**Owner**: Sisyphus
**Estimate**: 2 days
**Blocks**: (future refactor/search agents)
**Blocked by**: 01

## Acceptance Criteria
- [ ] `skills/code-graph/SKILL.md` with proper frontmatter
- [ ] Tree-sitter grammars for JavaScript/TypeScript installed
- [ ] `parsers/javascript.ts` — `parse(filePath) → AST`
- [ ] `extractors/cfg.ts` — `ast → CFG` (nodes=basic blocks, edges=control flow)
- [ ] `extractors/dfg.ts` — `ast → DFG` (data flow edges)
- [ ] CLI: `openaxe code-graph --file <path> --format json` outputs `{nodes, edges, meta}`
- [ ] Unit tests: 5 test files covering if/else, loops, functions, try/catch, async
- [ ] `npm run test:code-graph` passes
- [ ] Handles syntax errors gracefully (partial parse + error nodes)

## Implementation Notes
- Use `tree-sitter` + `tree-sitter-javascript` + `tree-sitter-typescript`
- CFG: Standard basic block construction (entry, exit, branches)
- DFG: Def-use chains for variables
- Output format: adjacency list + node metadata (type, location, text)