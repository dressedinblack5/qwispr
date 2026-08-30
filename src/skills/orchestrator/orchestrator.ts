import { AGENT_MAP, type Task } from "./router";
import { readRecent } from "../learning/telemetry";

export type Route = "classical" | "quantum";
export interface OrchestratorInput { task: Task; nVars?: number; trivial?: boolean; }
export interface OrchestratorDecision { route: Route; reason: string; agent: string; }

// ponytail: JSONL + heurística, DB si >10k eventos/día
export const THRESHOLD_DEFAULT = 4;
const THRESHOLD = THRESHOLD_DEFAULT;

export function getAdaptiveThreshold(): number {
  const events = readRecent(100);
  if (events.length === 0) return THRESHOLD_DEFAULT;
  const classical = events.filter((e) => e.route === "classical");
  const quantum = events.filter((e) => e.route === "quantum");
  if (classical.length === 0 || quantum.length === 0) return THRESHOLD_DEFAULT;
  const avg = (arr: typeof events) => arr.reduce((s, e) => s + e.wallMs, 0) / arr.length;
  const rate = (arr: typeof events) => arr.filter((e) => e.success).length / arr.length;
  const cAvg = avg(classical);
  const qAvg = avg(quantum);
  const cRate = rate(classical);
  const qRate = rate(quantum);
  let k = THRESHOLD_DEFAULT;
  if (qAvg > 2 * cAvg && qRate <= cRate) k++;
  else if (qRate > cRate + 0.1) k--;
  return Math.max(2, Math.min(8, k));
}

export function orchestrateAdaptive(input: OrchestratorInput): OrchestratorDecision {
  const k = getAdaptiveThreshold();
  const n = input.nVars ?? 0;
  const agent = AGENT_MAP[input.task] ?? "unknown";
  if (input.trivial || n <= k) {
    return { route: "classical", reason: input.trivial ? "trivial" : `nVars=${n} <= ${k}`, agent };
  }
  return { route: "quantum", reason: `nVars=${n} > ${k}`, agent };
}

export function orchestrate(input: OrchestratorInput): OrchestratorDecision {
  const n = input.nVars ?? 0;
  const agent = AGENT_MAP[input.task] ?? "unknown";
  if (input.trivial || n <= THRESHOLD) {
    return { route: "classical", reason: input.trivial ? "trivial" : `nVars=${n} <= ${THRESHOLD}`, agent };
  }
  return { route: "quantum", reason: `nVars=${n} > ${THRESHOLD}`, agent };
}
