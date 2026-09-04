#!/usr/bin/env node
import { vqeCommand } from './cli/vqe';
import { searchCommand } from './cli/search';
import { testgenCommand } from './cli/testgen';
import { analyzeCommand } from './cli/analyze';
import { refactorCommand } from './cli/refactor';
import { orchestratorCommand } from './cli/orchestrator';
import { Backend, getBackend, getDeviceString } from './skills/hardware/backend';
import { getQpuStatus } from './skills/hardware/qpu';
import { startMcpServer } from './mcp/server';

function hardwareList() {
  const current = getBackend();
  const envBackend = process.env.QWISPR_BACKEND ?? '(unset)';
  const envDevice = process.env.QWISPR_DEVICE ?? '(unset)';
  const rows = Object.values(Backend).map(
    b => `${b} -> ${getDeviceString(b)}${b === current ? ' (current)' : ''}`
  );
  const qpuStatus = getQpuStatus();
  const qpuWarning = qpuStatus.dryRun ? 'dry-run: simulated QPU path' : undefined;
  console.log(
    JSON.stringify(
      {
        backends: rows,
        current,
        env: {
          QWISPR_BACKEND: envBackend,
          QWISPR_DEVICE: envDevice,
          deviceString: getDeviceString(),
        },
        qpuStatus,
        ...(qpuWarning ? { qpuWarning } : {}),
      },
      null,
      2
    )
  );
  if (qpuWarning) console.error(`[qpu] ${qpuWarning}`);
}

function printHelp() {
  console.log('qwispr — hybrid quantum/classical code intelligence');
  console.log('');
  console.log('Usage: qwispr <command> [options]');
  console.log('');
  console.log('Commands:');
  console.log('  analyze, qwalk   call-graph + QWalk metrics');
  console.log('    qwispr analyze --file <path> [--entry <name>]');
  console.log('    qwispr qwalk --file <path> [--entry <name>]  (alias)');
  console.log('  grover, search   Grover-ranked code search');
  console.log('    qwispr search --pattern <regex> --files <glob> [--top 10]');
  console.log('    qwispr grover --pattern <regex> --files <glob> [--top 10]  (alias)');
  console.log('  vqe, testgen     VQE test-input generation');
  console.log('    qwispr vqe --qubo <file> [--layers N] [--iters N]');
  console.log('    qwispr testgen --file <path> --function <name> [--layers 2]');
  console.log('  refactor         QWalk+QML refactoring suggestions');
  console.log('    qwispr refactor --file <path> [--top 5]');
  console.log('  run, orchestrate hybrid router (classical vs quantum)');
  console.log(
    '    qwispr run --task resolve|search|testgen|analyze|refactor [args...] [--backend ...]'
  );
  console.log('    qwispr orchestrate --task <task> [args...]  (alias)');
  console.log('  hardware, backend backend/device inspection');
  console.log('    qwispr hardware --list  (alias: qwispr backend --list)');
  console.log('  mcp              MCP stdio server (tools/list + tools/call)');
  console.log('    qwispr mcp --stdio');
  console.log('');
  console.log('Options:');
  console.log('  --backend <name>   simulator|lightning (also QWISPR_BACKEND env)');
  console.log('  --help, -h         show this help');
  console.log('');
  console.log(
    'Env: QWISPR_BACKEND, QWISPR_DEVICE, QWISPR_LAYERS, QWISPR_ITERS, QWISPR_CALIBRATION, QWISPR_QPU_SHOTS, QWISPR_QPU_DRYRUN, QWISPR_TELEMETRY, QWISPR_TELEMETRY_PATH, QWISPR_ALLOW_ABSOLUTE, QISKIT_TOKEN'
  );
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h' || args[0] === 'help') {
    printHelp();
    return;
  }
  const alias: Record<string, string> = {
    qwalk: 'analyze',
    grover: 'search',
  };
  if (alias[args[0]]) {
    args[0] = alias[args[0]];
  }
  if (args[0] === 'mcp') {
    await startMcpServer();
    return;
  }
  if (args[0] === 'hardware' || args[0] === 'backend') {
    hardwareList();
    return;
  }
  // passthrough --backend for run/orchestrate/vqe
  const bi = args.indexOf('--backend');
  if (bi !== -1) {
    if (bi + 1 >= args.length || args[bi + 1] === undefined || args[bi + 1].startsWith('-')) {
      throw new Error('qwispr: missing value for --backend');
    }
    process.env.QWISPR_BACKEND = args[bi + 1];
    args.splice(bi, 2);
  }
  if (args[0] === 'vqe') {
    const result = await vqeCommand(args.slice(1));
    console.log(JSON.stringify(result, null, 2));
  } else if (args[0] === 'search') {
    const result = searchCommand(args.slice(1));
    console.log(JSON.stringify(result, null, 2));
  } else if (args[0] === 'testgen') {
    const result = await testgenCommand(args.slice(1));
    console.log(JSON.stringify(result, null, 2));
  } else if (args[0] === 'analyze') {
    const result = analyzeCommand(args.slice(1));
    console.log(JSON.stringify(result, null, 2));
  } else if (args[0] === 'refactor') {
    const result = refactorCommand(args.slice(1));
    console.log(JSON.stringify(result, null, 2));
  } else if (args[0] === 'run' || args[0] === 'orchestrate') {
    const rest = args[0] === 'run' ? args.slice(1) : args.slice(1);
    const result = await orchestratorCommand(rest);
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHelp();
  }
}
main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
