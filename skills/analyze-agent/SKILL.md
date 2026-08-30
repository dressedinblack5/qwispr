# analyze-agent — QWalk call-graph insights
Wraps `qwalk-agent` + `code-graph` (regex fallback) for `qwispr analyze`.
`analyze({file, entry})` → `{nodes, edges, reachableFromEntry, centrality, diameter, hotSpots}`.
QWalk: BFS reachability, degree centrality, BFS diameter, top-3 hot spots.
CLI: `qwispr analyze --file src/foo.ts [--entry main]`
Example: `qwispr analyze --file src/foo.ts --entry main` → `{nodes:["main","a","b"], edges:[["main","a"]], ...}`
