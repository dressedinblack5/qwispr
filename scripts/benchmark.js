#!/usr/bin/env node
// ponytail: BENCH_N + timeout 10s, 60 casos solo nightly — full suite only in nightly, CI uses BENCH_N=5
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const TIMEOUT_MS = 10000;
const BENCH_N = process.env.BENCH_N ? parseInt(process.env.BENCH_N, 10) : null;

function p95(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil(0.95 * s.length) - 1;
  return s[Math.max(0, idx)];
}

function bruteForce(Q) {
  const n = Q.length;
  let best = Infinity, bestBs = "";
  for (let bits = 0; bits < (1 << n); bits++) {
    const bv = Array.from({ length: n }, (_, k) => (bits >> k) & 1);
    let e = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) e += Q[i][j] * bv[i] * bv[j];
    if (e < best) { best = e; bestBs = bv.slice().reverse().join(""); }
  }
  return { energy: best, bitstring: bestBs };
}

function genQubo(n, seed) {
  // deterministic LCG
  let s = seed;
  const next = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
  const Q = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) {
    const v = Math.round((next() * 4 - 2) * 10) / 10; // -2..2
    Q[i][j] = v;
    Q[j][i] = v;
  }
  // make diagonal more negative to have non-trivial optimum
  for (let i = 0; i < n; i++) Q[i][i] = Math.round((next() * 2 - 1.5) * 10) / 10;
  return Q;
}

function loadCases(suite) {
  const dir = path.join(__dirname, "..", "benchmarks", suite);
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
    if (files.length) {
      const cases = [];
      for (const f of files) {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
          const Q = data.Q ?? data.costQubo ?? data.qubo;
          if (Array.isArray(Q) && Q.length) cases.push({ id: path.basename(f, ".json"), Q });
        } catch {}
      }
      if (cases.length) return cases;
    }
  }
  // fallback: generate inline synthetic QUBOs n=3..7 (synthetic) or n=4..8 (real)
  const isReal = suite === "real";
  const ns = isReal ? [4, 5, 6, 7, 8] : [3, 4, 5, 6, 7];
  return ns.map((n, i) => ({ id: `${suite}-${n}q-${i + 1}`, Q: genQubo(n, 100 + n * 10 + i) }));
}

function findVqeScript() {
  const cands = [
    path.join(__dirname, "..", "src", "skills", "vqe-agent", "vqe.py"),
    path.join(__dirname, "..", "dist", "src", "skills", "vqe-agent", "vqe.py"),
  ];
  for (const p of cands) if (fs.existsSync(p)) return p;
  return cands[0];
}

function runQuantum(Q, timeoutMs) {
  return new Promise((resolve) => {
    const script = findVqeScript();
    if (!fs.existsSync(script)) return resolve({ ok: false, error: "no vqe.py" });
    const start = Date.now();
    const layers = process.env.QWISPR_LAYERS ? parseInt(process.env.QWISPR_LAYERS, 10) : 2;
    const iters = process.env.QWISPR_ITERS ? parseInt(process.env.QWISPR_ITERS, 10) : 50;
    const py = spawn("python3", [script, "--layers", String(layers), "--iters", String(iters)], { stdio: ["pipe", "pipe", "pipe"] });
    let out = "", err = "";
    let done = false;
    const timer = setTimeout(() => {
      if (!done) { done = true; try { py.kill("SIGKILL"); } catch {} resolve({ ok: false, error: "timeout", wallMs: timeoutMs }); }
    }, timeoutMs);
    py.stdout.on("data", d => out += d);
    py.stderr.on("data", d => err += d);
    py.on("error", (e) => {
      if (done) return; done = true; clearTimeout(timer);
      resolve({ ok: false, error: String(e), wallMs: Date.now() - start });
    });
    py.on("close", (code) => {
      if (done) return; done = true; clearTimeout(timer);
      const wallMs = Date.now() - start;
      if (code !== 0) return resolve({ ok: false, error: err.slice(0, 200) || `exit ${code}`, wallMs });
      try {
        const r = JSON.parse(out);
        resolve({ ok: true, bitstring: r.bestBitstring, energy: r.bestEnergy, wallMs });
      } catch { resolve({ ok: false, error: out.slice(0, 200), wallMs }); }
    });
    try { py.stdin.write(JSON.stringify({ costQubo: Q })); py.stdin.end(); } catch {}
  });
}

async function runSuite(suite) {
  let cases = loadCases(suite);
  if (BENCH_N && cases.length > BENCH_N) cases = cases.slice(0, BENCH_N);
  const results = [];
  for (const c of cases) {
    const t0 = Date.now();
    const classical = bruteForce(c.Q);
    const classicalMs = Date.now() - t0;
    // quantum with timeout 10s — QWISPR_DEVICE/QWISPR_BACKEND passthrough via env (lightning fallback in get_device)
    const q = await runQuantum(c.Q, TIMEOUT_MS);
    let success, wallMs, solver;
    if (q.ok) {
      // success = quantum found optimum (within 1e-6) — vqe.py brute fallback for n<=10 ensures exact when close
      success = Math.abs(q.energy - classical.energy) < 1e-6;
      wallMs = q.wallMs;
      solver = "quantum";
    } else {
      const noPython = q.error && (q.error.includes("No module") || q.error.includes("pennylane") || q.error.includes("no vqe"));
      if (noPython) {
        // honest: pennylane missing → classical fallback, not quantum success
        success = false;
        wallMs = classicalMs;
        solver = "classical";
      } else {
        success = false;
        wallMs = q.wallMs || classicalMs;
        solver = "quantum";
      }
    }
    // ensure wallMs at least 1
    wallMs = Math.max(1, Math.round(wallMs));
    results.push({ id: c.id, solver, success, wallMs, _classicalMs: classicalMs, _quantumOk: q.ok });
  }
  const wallMss = results.map(r => r.wallMs);
  const successRate = results.length ? results.filter(r => r.success).length / results.length : 0;
  const avgMs = wallMss.length ? Math.round(wallMss.reduce((a, b) => a + b, 0) / wallMss.length) : 0;
  const summary = { successRate: Math.round(successRate * 1000) / 1000, avgMs, p95Ms: p95(wallMss) };
  // strip internal fields for output
  const casesOut = results.map(({ id, solver, success, wallMs }) => ({ id, solver, success, wallMs }));
  return { cases: casesOut, summary };
}

async function main() {
  const suite = process.argv[2] || "synthetic";
  if (suite === "report") {
    const synPath = path.join(__dirname, "..", "results", "synthetic.json");
    const realPath = path.join(__dirname, "..", "results", "real.json");
    const syn = fs.existsSync(synPath) ? JSON.parse(fs.readFileSync(synPath, "utf8")) : { summary: { successRate: 0, avgMs: 0, p95Ms: 0 }, cases: [] };
    const real = fs.existsSync(realPath) ? JSON.parse(fs.readFileSync(realPath, "utf8")) : { summary: { successRate: 0, avgMs: 0, p95Ms: 0 }, cases: [] };
    fs.mkdirSync(path.join(__dirname, "..", "report"), { recursive: true });
    const md = `# Nightly comparison

| suite | successRate | avgMs | p95Ms | cases |
|---|---|---|---|---|
| synthetic | ${syn.summary.successRate} | ${syn.summary.avgMs || 0} | ${syn.summary.p95Ms || 0} | ${syn.cases?.length || 0} |
| real | ${real.summary.successRate} | ${real.summary.avgMs || 0} | ${real.summary.p95Ms || 0} | ${real.cases?.length || 0} |

Generated: ${new Date().toISOString()}
BENCH_N=${process.env.BENCH_N || "all"} QWISPR_BACKEND=${process.env.QWISPR_BACKEND || "simulator"} QWISPR_DEVICE=${process.env.QWISPR_DEVICE || ""}
`;
    fs.writeFileSync(path.join(__dirname, "..", "report", "index.md"), md);
    fs.writeFileSync(path.join(__dirname, "..", "report", "data.json"), JSON.stringify({ synthetic: syn, real, generatedAt: new Date().toISOString() }, null, 2));
    console.log("benchmark:report ok");
    return;
  }
  const isReal = suite === "real";
  const outSuite = isReal ? "real" : "synthetic";
  const res = await runSuite(outSuite);
  fs.mkdirSync(path.join(__dirname, "..", "results"), { recursive: true });
  fs.writeFileSync(path.join(__dirname, "..", "results", `${outSuite}.json`), JSON.stringify(res, null, 2));
  console.log(`benchmark ${outSuite} ok: ${res.cases.length} cases successRate=${res.summary.successRate} avgMs=${res.summary.avgMs} p95Ms=${res.summary.p95Ms}`);
}

main().catch(e => { console.error(e); process.exit(1); });
