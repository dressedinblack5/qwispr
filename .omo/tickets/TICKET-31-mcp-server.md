# TICKET-31: MCP server

**Status:** ready-for-agent
**Bloquea:** none
**Estimado:** 1 día

## Qué entregar
- `src/mcp/server.ts` stdio JSON-RPC `tools/list` + `tools/call` expone analyze/search/testgen/refactor/hardware reusando `src/cli/*.ts`
- `src/cli.ts` wiring `qwispr mcp --stdio`
- `skills/mcp/SKILL.md`

## Criterios
- [ ] `echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npx qwispr mcp` devuelve 5 tools
- [ ] `tools/call` search devuelve hits
- [ ] `npm run build` ok

## Notas ponytail
Manual JSON-RPC, migrar a @modelcontextprotocol/sdk si cliente falla.
