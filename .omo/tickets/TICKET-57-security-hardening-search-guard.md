# TICKET-57: Security hardening — jail glob + ReDoS + file caps

**Status:** ready-for-agent
**Bloquea:** nada
**Estimado:** 0.4 día
**Severidad review:** MEDIUM (Security M1,M2,M3)

## Qué entregar
- `src/skills/search-agent/search.ts:expandGlob`: jail a `process.cwd()` → `path.resolve(full).startsWith(root)` skip, `lstatSync` + `realpathSync` check symlink, `maxFiles 5000` y `maxDepth 10` límite, rechazar globs absolutos salvo `QWISPR_ALLOW_ABSOLUTE=1`.
- `src/skills/testgen-agent/testgen.ts:12`: `const esc = fn.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')` antes de `new RegExp`.
- `src/skills/hardening/guard.ts:assertSafePattern`: añadir `pattern.length<200`, `/(?:\*\*|\+\+|\{\d{3,}\})/` y fallback `re2` doc; `assertFileExists`: `lstatSync` + `realpathSync` + `size>5MB` throw, rechazo symlink fuera de cwd.
- `extensions/vscode/src/extension.ts:55 esc`: también `"` → `&quot;` y `'` → `&#39;`.
- `src/skills/learning/telemetry.ts:getTelemetryPath`: `path.resolve` + `startsWith(homedir|cwd)` o rechazar `..`.

## Criterios
- [ ] `qwispr search --pattern TODO --files "/etc/**/*.conf"` → 0 hits o error jail, no lee /etc
- [ ] `qwispr testgen --file /tmp/foo.ts --function ".*"` no matchea falso
- [ ] `qwispr search --pattern "(a+)+"` o `a*a*` 200+ chars → `qwispr: unsafe pattern` no cuelga
- [ ] `ln -s /etc/passwd /tmp/link.json && qwispr vqe --qubo /tmp/link.json` → rechaza symlink o size cap
- [ ] `grep -n "&quot;" extensions/vscode/src/extension.ts` → 1
- [ ] `npx vitest run` 10/10 + `npm run build` pass

## Notas ponytail
Jail es 5 líneas, no WAF. `# ponytail: cwd jail + lstat, WAF when exposed over network`
