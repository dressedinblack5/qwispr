# TICKET-22: Hardware Integration — IBM Quantum / IonQ

**Owner**: Sisyphus
**Estimate**: 2 days
**Blocks**: None
**Blocked by**: 11 (real-qaoa)

## Acceptance Criteria
- [ ] `skills/hardware/SKILL.md` with proper frontmatter
- [ ] `hardware.ts` — `execute(circuit, backend) → Result`
- [ ] Backends: `ibmq`, `ionq`, `aws-braket`, `simulator`
- [ ] Auth: env vars `IBMQ_TOKEN`, `IONQ_API_KEY`
- [ ] Error mitigation: ZNE (zero-noise extrapolation), PEC (probabilistic error cancellation)
- [ ] CLI: `qwispr qaoa --qubo qubo.json --backend ibmq --shots 1000`
- [ ] Unit tests: mock backend, verify circuit submission
- [ ] Benchmark: simulator vs hardware on 20-qubit QUBO

## Implementation Notes
- PennyLane `qml.device("ibmq", ...)`, `qml.device("ionq", ...)`
- ZNE: scale noise, extrapolate to zero
- Circuit transpilation for backend topology
- Job polling with timeout
- Cost tracking: shots × backend rate