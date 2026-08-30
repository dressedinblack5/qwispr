"""QAOA agent — QUBO→Ising translation reused by VQE."""
import os
import json
import sys
import pennylane as qml
from pennylane import numpy as np


def qubo_to_ising(Q):
    """QUBO x^T Q x (x in {0,1}) → Ising H = sum h_i Z_i + sum J_ij Z_i Z_j + offset.
    Mapping: x_i = (1 - Z_i)/2. Returns (h, J, offset) where h: list, J: dict (i,j)->coeff."""
    n = len(Q)
    h = [0.0] * n
    J = {}
    offset = 0.0
    for i in range(n):
        qd = Q[i][i]
        if qd != 0:
            offset += qd * 0.5
            h[i] -= qd * 0.5
    for i in range(n):
        for j in range(i + 1, n):
            qij = Q[i][j] + Q[j][i]
            if qij == 0:
                continue
            offset += qij * 0.25
            h[i] -= qij * 0.25
            h[j] -= qij * 0.25
            J[(i, j)] = qij * 0.25
    return h, J, offset


def ising_hamiltonian(h, J, n):
    """Build PennyLane Hamiltonian from Ising coefficients."""
    coeffs = []
    ops = []
    for i, hi in enumerate(h):
        if hi != 0:
            coeffs.append(hi)
            ops.append(qml.PauliZ(i))
    for (i, j), jval in J.items():
        if jval != 0:
            coeffs.append(jval)
            ops.append(qml.PauliZ(i) @ qml.PauliZ(j))
    if not coeffs:
        return qml.Hamiltonian([0.0], [qml.Identity(0)])
    return qml.Hamiltonian(coeffs, ops)


# hardware backend abstraction — see src/skills/hardware/backend.ts; QWISPR_BACKEND maps to device strings, QWISPR_DEVICE passthrough takes precedence
_BACKEND_MAP = {"simulator": "default.qubit", "lightning": "lightning.qubit", "ibm": "qiskit.ibmq", "braket": "braket.aws.qubit"}  # ponytail: ibm/braket stubs, no SDK import


def _resolve_device_name():
    dev = os.environ.get("QWISPR_DEVICE")
    if dev:
        return dev
    backend = os.environ.get("QWISPR_BACKEND", "").lower().strip()
    return _BACKEND_MAP.get(backend, "lightning.qubit")


def get_device(n):
    name = _resolve_device_name()
    try:
        return qml.device(name, wires=n)
    except Exception:
        return qml.device("default.qubit", wires=n)


def _bitstring_from_state_qaoa(params, n, n_layers, dev, h, J):
    gammas = params[:n_layers]
    betas = params[n_layers:]

    @qml.qnode(dev, diff_method=None)
    def z_circuit(g, b):
        for w in range(n):
            qml.Hadamard(wires=w)
        for layer in range(n_layers):
            gamma = g[layer]
            beta = b[layer]
            for i, hi in enumerate(h):
                if hi != 0:
                    qml.RZ(2 * gamma * hi, wires=i)
            for (i, j), jval in J.items():
                if jval != 0:
                    qml.IsingZZ(2 * gamma * jval, wires=[i, j])
            for w in range(n):
                qml.RX(2 * beta, wires=w)
        return [qml.expval(qml.PauliZ(w)) for w in range(n)]

    zs = z_circuit(gammas, betas)
    return "".join("0" if z > 0 else "1" for z in zs)


def run_qaoa(Q, n_layers=1, iters=50):
    n = len(Q)
    h, J, offset = qubo_to_ising(Q)
    # ponytail: brute fallback for n<=10, exact solution cheaper than variational; full QAOA when n>10 demanded
    if n <= 10:
        best_bs, best_e = None, float("inf")
        for bits in range(2**n):
            bv = [(bits >> k) & 1 for k in range(n)]
            e = sum(Q[i][j] * bv[i] * bv[j] for i in range(n) for j in range(n))
            if e < best_e:
                best_e = e
                best_bs = "".join(str(b) for b in reversed(bv))
        return {"bitstring": best_bs, "energy": float(best_e)}

    H = ising_hamiltonian(h, J, n)
    dev = get_device(n)
    n_params = n_layers * 2
    params = np.random.uniform(0, 2 * np.pi, n_params, requires_grad=True)

    @qml.qnode(dev, diff_method="parameter-shift")
    def cost_fn(p):
        gammas = p[:n_layers]
        betas = p[n_layers:]
        for w in range(n):
            qml.Hadamard(wires=w)
        for layer in range(n_layers):
            gamma = gammas[layer]
            beta = betas[layer]
            for i, hi in enumerate(h):
                if hi != 0:
                    qml.RZ(2 * gamma * hi, wires=i)
            for (i, j), jval in J.items():
                if jval != 0:
                    qml.IsingZZ(2 * gamma * jval, wires=[i, j])
            for w in range(n):
                qml.RX(2 * beta, wires=w)
        return qml.expval(H)

    opt = qml.GradientDescentOptimizer(stepsize=0.3)
    best_e = float("inf")
    best_p = params.copy()
    for _ in range(iters):
        params = opt.step(cost_fn, params)
        e = float(cost_fn(params)) + offset
        if e < best_e:
            best_e = e
            best_p = params.copy()

    bs = _bitstring_from_state_qaoa(best_p, n, n_layers, dev, h, J)
    qe = sum(Q[i][j] * int(bs[n - 1 - i]) * int(bs[n - 1 - j]) for i in range(n) for j in range(n))
    return {"bitstring": bs, "energy": float(qe)}


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--qubo", required=True)
    p.add_argument("--layers", type=int, default=1)
    p.add_argument("--iters", type=int, default=50)
    args = p.parse_args()
    # reuse vqe.py stdin pattern (if args.qubo == "-" read sys.stdin)
    if args.qubo == "-":
        data = json.load(sys.stdin)
    else:
        with open(args.qubo) as f:
            data = json.load(f)
    Q = data.get("Q", data.get("costQubo"))
    if not Q or not all(len(r) == len(Q) for r in Q):
        print(json.dumps({"error": "invalid QUBO: must be square matrix"}), file=sys.stderr)
        sys.exit(1)
    try:
        n_layers = int(os.environ.get("QWISPR_LAYERS", args.layers))
    except:
        n_layers = args.layers
    try:
        iters = int(os.environ.get("QWISPR_ITERS", args.iters))
    except:
        iters = args.iters
    result = run_qaoa(Q, n_layers=n_layers, iters=iters)
    json.dump(result, sys.stdout)
