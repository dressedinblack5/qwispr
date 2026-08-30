# hardware — backend abstraction (simulator vs real hardware)
`getBackend()` reads `QWISPR_BACKEND` then `QWISPR_DEVICE`; `getDeviceString(backend?)` → PennyLane device string.
Backends: `simulator→default.qubit, lightning→lightning.qubit, ibm→qiskit.ibmq, braket→braket.aws.qubit` (stubs, no SDK).
Env: `QWISPR_BACKEND=simulator|lightning|ibm|braket` or `QWISPR_DEVICE=lightning.qubit` (device string passthrough).
CLI: `qwispr hardware --list` (alias `qwispr backend --list`) shows backends + current env; `qwispr run --backend ibm` sets env.
Fallback: unknown device → `default.qubit`; ibm/braket require plugins at runtime, no credentials needed for listing.
Calibration: `QWISPR_CALIBRATION` (float, default `1.0`) scales hardware timing/energy to compensate physical drift (clock skew, PCA9685 fast, sensor offset). Set `QWISPR_CALIBRATION=0.98` if device runs fast, `1.02` if slow; applied as multiplier in backend/hamiltonian where needed.
QPU pilot (`qpu.ts`): `getQpuStatus()` reads `QWISPR_BACKEND`/`QISKIT_TOKEN`/`QWISPR_QPU_DRYRUN`/`QWISPR_QPU_SHOTS` (1024, clamp 1..10000); `applyReadoutMitigation(counts, flipProb=0.02)` 2×2 per-qubit flip + normalize; `runQpuOrFallback(quboPath)` → `{path:'qpu'|'simulator', warning?}` (no token→simulator warning, dryRun→qpu, hasToken→try `qpu.py` else fallback). `qpu.py` stub tries `qiskit_ibm_runtime` else fallback JSON. CLI `hardware --list` includes `qpuStatus`.
