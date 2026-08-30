export enum Backend {
  simulator = 'simulator',
  lightning = 'lightning',
}

const DEVICE_MAP: Record<Backend, string> = {
  [Backend.simulator]: 'default.qubit',
  [Backend.lightning]: 'lightning.qubit',
};

export function getBackend(): Backend {
  const raw = (process.env.QWISPR_BACKEND ?? '').toLowerCase().trim();
  if (raw === Backend.simulator || raw === Backend.lightning) return raw as Backend;
  const dev = (process.env.QWISPR_DEVICE ?? '').toLowerCase();
  if (dev.includes('lightning')) return Backend.lightning;
  if (dev.includes('default')) return Backend.simulator;
  return Backend.simulator;
}

// qpu pilot: see ./qpu.ts (getQpuStatus, applyReadoutMitigation, runQpuOrFallback)
export function getDeviceString(backend?: Backend): string {
  return DEVICE_MAP[backend ?? getBackend()];
}
