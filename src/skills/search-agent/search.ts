import * as fs from "node:fs";
import * as path from "node:path";
import { groverProbabilities, groverIterations } from "../grover-agent/grover";
import { assertSafePattern } from "../hardening/guard";

export interface SearchHit { file: string; line: number; snippet: string; }
export interface SearchResult { hits: SearchHit[]; amplifiedIndex: number; }

// ponytail: naive glob via fs walk + regex, no minimatch dep; upgrade to fast-glob if perf matters
function globToRegExp(glob: string): RegExp {
  let re = "^";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*" && glob[i + 1] === "*") {
      if (glob[i + 2] === "/") { re += "(?:.*\\/)?"; i += 2; }
      else { re += ".*"; i++; }
    } else if (c === "*") re += "[^/]*";
    else if (c === "?") re += "[^/]";
    else if (".+^${}()|[]\\".includes(c)) re += "\\" + c;
    else re += c;
  }
  re += "$";
  return new RegExp(re);
}

// ponytail: cwd jail + lstat, WAF when exposed over network
function expandGlob(pattern: string): string[] {
  const root = path.resolve(process.cwd());
  if (path.isAbsolute(pattern) && process.env.QWISPR_ALLOW_ABSOLUTE !== "1") {
    throw new Error(`qwispr: absolute glob rejected (set QWISPR_ALLOW_ABSOLUTE=1 to allow): ${pattern}`);
  }
  const abs = path.isAbsolute(pattern) ? pattern : path.join(root, pattern);
  const globIdx = pattern.search(/[*?]/);
  const basePart = globIdx === -1 ? path.dirname(pattern) : pattern.slice(0, pattern.lastIndexOf("/", globIdx) + 1) || ".";
  const base = path.isAbsolute(basePart) ? basePart : path.join(root, basePart);
  const re = globToRegExp(abs);
  const out: string[] = [];
  const maxFiles = 5000;
  const maxDepth = 10;
  function isInsideRoot(resolved: string): boolean {
    if (process.env.QWISPR_ALLOW_ABSOLUTE === "1") return true;
    return resolved === root || resolved.startsWith(root + path.sep);
  }
  function walk(dir: string, depth: number) {
    if (depth > maxDepth) return;
    if (out.length >= maxFiles) return;
    let entries: fs.Dirent[];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (out.length >= maxFiles) break;
      const full = path.join(dir, e.name);
      let resolved: string;
      try {
        fs.lstatSync(full);
        resolved = fs.realpathSync(full);
      } catch { continue; }
      if (!isInsideRoot(resolved)) continue;
      if (e.isDirectory()) walk(full, depth + 1);
      else if (re.test(full)) out.push(full);
    }
  }
  if (globIdx === -1) {
    const p = path.isAbsolute(pattern) ? pattern : path.join(root, pattern);
    try {
      fs.lstatSync(p);
      const resolved = fs.realpathSync(p);
      if (!isInsideRoot(resolved)) return [];
      if (fs.statSync(resolved).isFile() && out.length < maxFiles) return [p];
    } catch {}
    return [];
  }
  let walkBase: string;
  try {
    const baseResolved = fs.existsSync(base) ? fs.realpathSync(base) : root;
    if (isInsideRoot(baseResolved) && fs.existsSync(base) && fs.statSync(base).isDirectory()) walkBase = base;
    else walkBase = root;
  } catch { walkBase = root; }
  walk(walkBase, 0);
  return out.sort();
}

export function search(opts: { pattern: string; files: string; top?: number }): SearchResult {
  assertSafePattern(opts.pattern);
  let regex: RegExp;
  try { regex = new RegExp(opts.pattern); } catch (e: unknown) { throw new Error(`qwispr: invalid pattern: ${opts.pattern} — ${(e as Error).message}`); }
  const fileList = expandGlob(opts.files);
  if (fileList.length === 0) throw new Error(`qwispr: file not found: ${opts.files} (no matches)`);
  const allHits: SearchHit[] = [];
  for (const file of fileList) {
    let content: string;
    try { content = fs.readFileSync(file, "utf8"); } catch { continue; }
    const lines = content.split("\n");
    lines.forEach((snippet, idx) => {
      if (regex.test(snippet)) allHits.push({ file, line: idx + 1, snippet: snippet.trim().slice(0, 200) });
    });
  }
  allHits.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  const top = opts.top ?? 10;
  const hits = allHits.slice(0, top);

  // Rank via Grover amplification: treat hits as marked items in larger space
  // N = max(total lines scanned estimate, hits.length); use hits.length for minimal case
  let amplifiedIndex = -1;
  if (hits.length > 0) {
    const n = allHits.length; // search space = all matches
    const marked = hits.map(() => true);
    // if we sliced, n > hits.length gives meaningful amplification; else n==hits.length -> uniform
    const probs = groverProbabilities(n, Array(n).fill(true).map((_, i) => i < hits.length), groverIterations(n, hits.length));
    // probs for marked subset; pick max among hits
    const hitProbs = probs.slice(0, hits.length);
    let maxP = -1;
    hitProbs.forEach((p, i) => { if (p > maxP) { maxP = p; amplifiedIndex = i; } });
    // fallback: if uniform, amplifiedIndex stays 0
    void marked;
  }
  return { hits, amplifiedIndex };
}
