"""QPU pilot stub — no queue/cost, fallback if qiskit missing."""
import json, argparse
p = argparse.ArgumentParser()
p.add_argument("--qubo", required=True)
p.add_argument("--shots", type=int, default=1024)
args = p.parse_args()
try:
    import qiskit_ibm_runtime  # noqa: F401
    print(json.dumps({"path": "qpu", "dryRun": False, "shots": args.shots}))
except ImportError:
    print(json.dumps({"path": "simulator", "warning": "qiskit_ibm_runtime not installed — fallback", "shots": args.shots}))
