import { describe, it, expect, afterEach } from "vitest";
import { Backend, getBackend, getDeviceString } from "../backend";

const origBackend = process.env.QWISPR_BACKEND;
const origDevice = process.env.QWISPR_DEVICE;
afterEach(() => {
  if (origBackend === undefined) delete process.env.QWISPR_BACKEND; else process.env.QWISPR_BACKEND = origBackend;
  if (origDevice === undefined) delete process.env.QWISPR_DEVICE; else process.env.QWISPR_DEVICE = origDevice;
});

describe("hardware backend", () => {
  it("respects env and maps device strings", () => {
    delete process.env.QWISPR_BACKEND; delete process.env.QWISPR_DEVICE;
    expect(getBackend()).toBe(Backend.simulator);
    expect(getDeviceString()).toBe("default.qubit");

    process.env.QWISPR_BACKEND = "lightning";
    expect(getBackend()).toBe(Backend.lightning);
    expect(getDeviceString()).toBe("lightning.qubit");

    process.env.QWISPR_BACKEND = "ibm";
    expect(getDeviceString()).toBe("qiskit.ibmq");
    expect(getDeviceString(Backend.braket)).toBe("braket.aws.qubit");

    delete process.env.QWISPR_BACKEND;
    process.env.QWISPR_DEVICE = "lightning.qubit";
    expect(getBackend()).toBe(Backend.lightning);
    process.env.QWISPR_DEVICE = "qiskit.ibmq";
    expect(getBackend()).toBe(Backend.ibm);
    process.env.QWISPR_DEVICE = "braket.aws.qubit";
    expect(getBackend()).toBe(Backend.braket);

    process.env.QWISPR_BACKEND = "ibm";
    process.env.QWISPR_DEVICE = "default.qubit";
    expect(getBackend()).toBe(Backend.ibm);
  });
});
