# vqe-agent — VQE Test-Input Generation
Finds minimal unsatisfying inputs by minimizing a cost Hamiltonian (QUBO→Ising→VQE).
Input: `{costQubo: number[][], nLayers?: number, iters?: number}` — QUBO matrix encoding test-failure energy / branch distance.
Output: `{bestBitstring, bestEnergy, trajectory}` — ground-state bitstring = minimal failing input.
Ansatz: hardware-efficient RY/RZ + CNOT, parameter-shift, `QWISPR_DEVICE` (lightning.qubit→default.qubit).
Example: `runVqe({costQubo: [[-1,2],[2,-1]], nLayers: 2, iters: 50})` → `{bestBitstring:"01", bestEnergy:-1}`
CLI: `qwispr vqe --qubo qubo.json --layers 2 --iters 50`
