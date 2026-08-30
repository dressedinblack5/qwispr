#!/usr/bin/env node
import * as fs from 'node:fs';
import { runVqe } from './skills/vqe-agent/vqe';
import { assertFileExists } from './skills/hardening/guard';
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
  const rows = (Object.values(Backend) as string[]).map(
    b => `${b} -> ${getDeviceString(b as Backend)}${(b as Backend) === current ? ' (current)' : ''}`
  );
  const qpuStatus = getQpuStatus();
  const qpuWarning =
    qpuStatus.backend === Backend.ibm && !qpuStatus.hasToken && !qpuStatus.dryRun
      ? 'QISKIT_TOKEN missing — falling back to simulator'
      : qpuStatus.dryRun && qpuStatus.backend === Backend.ibm
        ? 'dry-run: simulated QPU path'
        : undefined;
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
  console.log('  code-graph, analyze, qwalk   call-graph + QWalk metrics');
  console.log('    qwispr analyze --file <path> [--entry <name>]');
  console.log('    qwispr code-graph --file <path> [--entry <name>]  (alias)');
  console.log('  dep-agent, qaoa, resolve     QUBO dependency resolution (QAOA/classical)');
  console.log(
    '    qwispr run --task resolve --qubo <file> [--backend simulator|lightning|ibm|braket]'
  );
  console.log('  grover, search               Grover-ranked code search');
  console.log('    qwispr search --pattern <regex> --files <glob> [--top 10]');
  console.log('    qwispr grover --pattern <regex> --files <glob> [--top 10]  (alias)');
  console.log('  vqe, testgen                 VQE test-input generation');
  console.log('    qwispr vqe --qubo <file> [--layers N] [--iters N]');
  console.log('    qwispr testgen --file <path> --function <name> [--layers 2]');
  console.log('  refactor                     QWalk+QML refactoring suggestions');
  console.log('    qwispr refactor --file <path> [--top 5]');
  console.log('  run, orchestrate             hybrid router (classical vs quantum)');
  console.log(
    '    qwispr run --task resolve|search|testgen|analyze|refactor [args...] [--backend ...]'
  );
  console.log('    qwispr orchestrate --task <task> [args...]  (alias)');
  console.log('  hardware, backend            backend/device inspection');
  console.log('    qwispr hardware --list  (alias: qwispr backend --list)');
  console.log('  mcp                          MCP stdio server (tools/list + tools/call)');
  console.log('    qwispr mcp --stdio');
  console.log('');
  console.log('Options:');
  console.log('  --backend <name>   simulator|lightning|ibm|braket (also QWISPR_BACKEND env)');
  console.log('  --help, -h         show this help');
  console.log('');
  console.log(
    'Env: QWISPR_BACKEND, QWISPR_DEVICE (e.g. lightning.qubit), QWISPR_LAYERS, QWISPR_ITERS, QWISPR_CALIBRATION'
  );
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h' || args[0] === 'help') {
    printHelp();
    return;
  }
  const alias: Record<string, string> = {
    'code-graph': 'analyze',
    code_graph: 'analyze',
    qwalk: 'analyze',
    grover: 'search',
    'dep-agent': 'resolve',
    qaoa: 'resolve',
  };
  if (alias[args[0]]) {
    if (args[0] === 'dep-agent' || args[0] === 'qaoa' || args[0] === 'resolve') {
      args[0] = 'run';
      args.splice(1, 0, '--task', 'resolve');
    } else {
      args[0] = alias[args[0]];
    }
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
  if (bi !== -1 && args[bi + 1]) {
    process.env.QWISPR_BACKEND = args[bi + 1];
    args.splice(bi, 2);
  }
  if (args[0] === 'vqe') {
    let quboFile = '',
      layers = 2,
      iters = 50;
    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--qubo' && args[i + 1]) quboFile = args[++i];
      else if (args[i] === '--layers' && args[i + 1]) {
        const v = parseInt(args[++i], 10);
        if (Number.isNaN(v) || v <= 0) throw new Error('qwispr: invalid --layers/--iters');
        layers = v;
      } else if (args[i] === '--iters' && args[i + 1]) {
        const v = parseInt(args[++i], 10);
        if (Number.isNaN(v) || v <= 0) throw new Error('qwispr: invalid --layers/--iters');
        iters = v;
      }
    }
    if (!quboFile) {
      console.error('usage: qwispr vqe --qubo <file> --layers 2 --iters 50');
      process.exit(1);
    }
    assertFileExists(quboFile);
    let data: unknown;
    try {
      data = JSON.parse(fs.readFileSync(quboFile, 'utf8')) as unknown;
    } catch (e: unknown) {
      throw new Error(`qwispr: invalid JSON in ${quboFile}: ${(e as Error).message}`);
    }
    const d = data as Record<string, unknown>;
    const Q = (d.Q ?? d.costQubo) as number[][];
    const result = await runVqe({ costQubo: Q, nLayers: layers, iters });
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
