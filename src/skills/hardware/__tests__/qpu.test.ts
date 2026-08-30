import { describe, it, expect, afterEach } from "vitest";
import { applyReadoutMitigation, getQpuStatus, runQpuOrFallback } from "../qpu";
import { Backend } from "../backend";

const orig = { ...process.env };
afterEach(() => {
  for (const k of ["QWISPR_BACKEND", "QWISPR_DEVICE", "QISKIT_TOKEN", "QWISPR_QPU_DRYRUN", "QWISPR_QPU_SHOTS"]) {
    if (orig[k] === undefined) delete process.env[k]; else process.env[k] = orig[k];
  }
});

describe("qpu", () => {
  it("no token → fallback simulator with warning", async () => {
    process.env.QWISPR_BACKEND = "ibm";
    delete process.env.QISKIT_TOKEN;
    delete process.env.QWISPR_QPU_DRYRUN;
    const s = getQpuStatus();
    expect(s.backend).toBe(Backend.ibm);
    expect(s.hasToken).toBe(false);
    expect(s.dryRun).toBe(false);
    const r = await runQpuOrFallback("dummy.json");
    expect(r.path).toBe("simulator");
    expect(r.warning).toMatch(/QISKIT_TOKEN missing/);
  });

  it("dryRun → qpu path", async () => {
    process.env.QWISPR_BACKEND = "ibm";
    process.env.QWISPR_QPU_DRYRUN = "1";
    delete process.env.QISKIT_TOKEN;
    const s = getQpuStatus();
    expect(s.dryRun).toBe(true);
    const r = await runQpuOrFallback("dummy.json");
    expect(r.path).toBe("qpu");
    expect(r.warning).toMatch(/dry-run/);
  });

  it("shots clamp and default", () => {
    delete process.env.QWISPR_QPU_SHOTS;
    expect(getQpuStatus().shots).toBe(1024);
    process.env.QWISPR_QPU_SHOTS = "0";
    expect(getQpuStatus().shots).toBe(1);
    process.env.QWISPR_QPU_SHOTS = "99999";
    expect(getQpuStatus().shots).toBe(10000);
    process.env.QWISPR_QPU_SHOTS = "512";
    expect(getQpuStatus().shots).toBe(512);
  });

  it("applyReadoutMitigation preserves total and fixes flip", () => {
    const counts = { "00": 100, "01": 0, "10": 0, "11": 0 };
    const out = applyReadoutMitigation(counts, 0.02);
    const total = Object.values(out).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(100, 6);
    expect(out["00"]).toBeLessThan(100);
    expect(out["01"] + out["10"]).toBeGreaterThan(0);
  });

  it("non-ibm backend → simulator no warning", async () => {
    process.env.QWISPR_BACKEND = "simulator";
    const r = await runQpuOrFallback("dummy.json");
    expect(r.path).toBe("simulator");
    expect(r.warning).toBeUndefined();
  });
});
