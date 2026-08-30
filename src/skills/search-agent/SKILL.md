# search-agent — Grover-ranked code search
Wraps `grover-agent` + file glob for `qwispr search`.
`search({pattern, files, top})` → `{hits: {file,line,snippet}[], amplifiedIndex}`.
Hits ranked by Grover amplification simulation (grover.ts).
CLI: `qwispr search --pattern <regex> --files <glob> [--top 10]`
Example: `qwispr search --pattern "TODO|eval\\(" --files "src/**/*.ts"`
