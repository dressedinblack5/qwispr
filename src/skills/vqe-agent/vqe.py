"""VQE for test-input generation — minimizes cost Hamiltonian (QUBO→Ising)."""
import os, sys, json, argparse
import pennylane as qml
from pennylane import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "qaoa-agent"))
from qaoa import qubo_to_ising, ising_hamiltonian, get_device  # get_device uses hardware backend abstraction (QWISPR_BACKEND/QWISPR_DEVICE) — see src/skills/hardware/backend.ts


def hardware_efficient_ansatz(params, n, n_layers):
    # ponytail: 2-layer hardware-efficient ansatz, deeper if n>8 needs more expressivity
    idx = 0
    for layer in range(n_layers):
        for w in range(n):
            qml.RY(params[idx], wires=w); idx += 1
            qml.RZ(params[idx], wires=w); idx += 1
        for w in range(n - 1):
            qml.CNOT(wires=[w, w + 1])
        if n > 2:
            qml.CNOT(wires=[n - 1, 0])


def _bitstring_from_state(best_p, n, n_layers, dev):
    @qml.qnode(dev, diff_method=None)
    def z_circuit(p):
        hardware_efficient_ansatz(p, n, n_layers)
        return [qml.expval(qml.PauliZ(w)) for w in range(n)]
    zs = z_circuit(best_p)
    return "".join("0" if z > 0 else "1" for z in zs)


def run_vqe(Q, n_layers=2, iters=50):
    n = len(Q)
    h, J, offset = qubo_to_ising(Q)
    H = ising_hamiltonian(h, J, n)
    dev = get_device(n)
    n_params = n * 2 * n_layers
    # deterministic seed from Q for benchmark determinism
    try:
        import hashlib
        seed = int(hashlib.md5(str(Q).encode()).hexdigest()[:8], 16) % (2**31)
        np.random.seed(seed)
    except:
        pass
    params = np.random.uniform(0, 2 * np.pi, n_params, requires_grad=True)

    @qml.qnode(dev, diff_method="parameter-shift")
    def cost_fn(p):
        hardware_efficient_ansatz(p, n, n_layers)
        return qml.expval(H)

    opt = qml.GradientDescentOptimizer(stepsize=0.3)
    trajectory = []
    best_e = float("inf")
    best_p = params.copy()
    for _ in range(iters):
        params = opt.step(cost_fn, params)
        e = float(cost_fn(params)) + offset
        trajectory.append(e)
        if e < best_e:
            best_e = e
            best_p = params.copy()

    if n <= 10:
        best_bs, best_qe = None, float("inf")
        for bits in range(2**n):
            bv = [(bits >> k) & 1 for k in range(n)]
            e = sum(Q[i][j] * bv[i] * bv[j] for i in range(n) for j in range(n))
            if e < best_qe:
                best_qe = e
                best_bs = "".join(str(b) for b in reversed(bv))
        if abs(best_e - best_qe) < 1e-9:
            return {"bestBitstring": best_bs, "bestEnergy": best_qe, "trajectory": trajectory}
        bs = _bitstring_from_state(best_p, n, n_layers, dev)
        qe = sum(Q[i][j] * int(bs[n-1-i]) * int(bs[n-1-j]) for i in range(n) for j in range(n))
        return {"bestBitstring": bs, "bestEnergy": float(qe), "trajectory": trajectory}
    bs = _bitstring_from_state(best_p, n, n_layers, dev)
    qe = sum(Q[i][j] * int(bs[n-1-i]) * int(bs[n-1-j]) for i in range(n) for j in range(n))
    return {"bestBitstring": bs, "bestEnergy": float(qe), "trajectory": trajectory}


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--qubo", help="path to JSON with Q or costQubo")
    ap.add_argument("--layers", type=int, default=2)
    ap.add_argument("--iters", type=int, default=50)
    args = ap.parse_args()
    if args.qubo:
        with open(args.qubo) as f:
            d = json.load(f)
        Q = d.get("Q", d.get("costQubo"))
    else:
        d = json.load(sys.stdin)
        Q = d.get("Q", d.get("costQubo"))
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
    json.dump(run_vqe(Q, n_layers=n_layers, iters=iters), sys.stdout)
