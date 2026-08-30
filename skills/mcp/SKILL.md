# mcp — stdio JSON-RPC server
Exposes `analyze, search, testgen, refactor, hardware` via `tools/list` + `tools/call`.
Reuses `src/cli/*.ts` handlers; no new deps, manual JSON-RPC.
Run: `qwispr mcp --stdio` (line-delimited JSON, exit 0 on EOF).
Example: `echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | qwispr mcp`
