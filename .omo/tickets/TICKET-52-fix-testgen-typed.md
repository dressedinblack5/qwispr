# TICKET-52: Fix testgen — TS typed params + RegExp escape

**Status:** ready-for-agent
**Bloquea:** nada
**Estimado:** 0.3 día
**Severidad review:** BLOCKING P0 (QA #2)

## Qué entregar
- `src/skills/testgen-agent/testgen.ts`: `extractFunction` debe soportar `function myFn(x: number, y: string): boolean {` y `export async function`. Escapar `fn` antes de `new RegExp` (`fn.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')`). Wrap `new RegExp` en try/catch y strip tipos de params antes de QUBO. `ifRe` tolera tipos y parens anidados básico.
- Test extra: typed fixture `/tmp/typed.ts` debe generar inputs sin `not found`.

## Criterios
- [ ] `qwispr testgen --file /tmp/typed.ts --function myFn` con `export function myFn(x: number): string { if(x>10) return "big"; }` retorna `inputs` y `coverageHint` (no `not found`)
- [ ] `qwispr testgen --file /tmp/foo.ts --function ".*"` no hace ReDoS ni match falso — escapa y retorna error controlado o 0 inputs sin crash
- [ ] `new RegExp("a)(.*")` no lanza SyntaxError sin catch — error tipado `qwispr: invalid function name`
- [ ] `npx vitest run src/skills/testgen-agent` 3/3 pass (incl. typed case, sin regresión untyped)
- [ ] `npm run build` pass

## Notas ponytail
No parser AST completo; regex con tipo opcional `(?::\s*[^{]+)?` basta. `# ponytail: regex with optional type, upgrade to tree-sitter when parser lands`
