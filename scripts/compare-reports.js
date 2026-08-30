#!/usr/bin/env node
import { readFileSync } from "fs";
import { join } from "path";

const [, , prevFile, currFile] = process.argv;

if (!prevFile || !currFile) {
  console.error("Usage: compare-reports.js <previous.json> <current.json>");
  process.exit(1);
}

const prev = JSON.parse(readFileSync(prevFile, "utf-8"));
const curr = JSON.parse(readFileSync(currFile, "utf-8"));

console.log("=== BENCHMARK COMPARISON ===\n");

const metrics = [
  { key: "totals.totalClassical", label: "Classical Passes", higher: true },
  { key: "totals.totalQuantum", label: "Quantum Passes", higher: true },
  { key: "totals.quantumOnlyCount", label: "Quantum Only Solves", higher: true },
  { key: "totals.criterion1", label: "C1: Quantum ≥80% of Classical", higher: true },
  { key: "totals.criterion2", label: "C2: Quantum ≥20% of Classical Fails", higher: true },
  { key: "totals.medianTimeRatio", label: "Median Time Ratio (Q/C)", higher: false },
];

function getValue(obj: any, path: string): number {
  return path.split(".").reduce((o, k) => o?.[k], obj);
}

for (const m of metrics) {
  const pv = getValue(prev, m.key);
  const cv = getValue(curr, m.key);
  const diff = cv - pv;
  const pct = pv !== 0 ? ((diff / pv) * 100).toFixed(1) : "N/A";
  const arrow = diff > 0 ? "↑" : diff < 0 ? "↓" : "→";
  const good = m.higher ? diff >= 0 : diff <= 0;
  const status = good ? "✓" : "✗";
  
  console.log(`${m.label}: ${pv} → ${cv} (${arrow} ${pct}%) ${status}`);
}

console.log("\n=== PER TYPE COMPARISON ===");
const prevTypes = Object.fromEntries(prev.byType.map((t: any) => [t.type, t]));
const currTypes = Object.fromEntries(curr.byType.map((t: any) => [t.type, t]));
const allTypes = new Set([...Object.keys(prevTypes), ...Object.keys(currTypes)]);

for (const type of allTypes) {
  const pt = prevTypes[type] || { classical: 0, quantum: 0, quantumOnly: 0 };
  const ct = currTypes[type] || { classical: 0, quantum: 0, quantumOnly: 0 };
  console.log(`${type}: Classical ${pt.classical}→${ct.classical}, Quantum ${pt.quantum}→${ct.quantum}, Only ${pt.quantumOnly}→${ct.quantumOnly}`);
}

console.log("\n=== VERDICT ===");
console.log(`Previous: ${prev.verdict.overall}`);
console.log(`Current:  ${curr.verdict.overall}`);