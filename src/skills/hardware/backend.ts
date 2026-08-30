export enum Backend { simulator = "simulator", lightning = "lightning", ibm = "ibm", braket = "braket" }

const DEVICE_MAP: Record<Backend, string> = {
  [Backend.simulator]: "default.qubit",
  [Backend.lightning]: "lightning.qubit",
  [Backend.ibm]: "qiskit.ibmq", // ponytail: stub — no SDK import, requires qiskit plugin at runtime
  [Backend.braket]: "braket.aws.qubit", // ponytail: stub — requires amazon-braket plugin at runtime
};

export function getBackend(): Backend {
  const raw = (process.env.QWISPR_BACKEND ?? "").toLowerCase().trim();
  if (raw === Backend.simulator || raw === Backend.lightning || raw === Backend.ibm || raw === Backend.braket) return raw as Backend;
  const dev = (process.env.QWISPR_DEVICE ?? "").toLowerCase();
  if (dev.includes("lightning")) return Backend.lightning;
  if (dev.includes("qiskit") || dev.includes("ibmq") || dev.includes("ibm")) return Backend.ibm;
  if (dev.includes("braket")) return Backend.braket;
  if (dev.includes("default")) return Backend.simulator;
  return Backend.simulator;
}

// qpu pilot: see ./qpu.ts (getQpuStatus, applyReadoutMitigation, runQpuOrFallback)
export function getDeviceString(backend?: Backend): string {
  return DEVICE_MAP[backend ?? getBackend()];
}
