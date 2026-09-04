// ponytail: manual JSON-RPC, migrar a @modelcontextprotocol/sdk si cliente falla
import { analyze } from '../skills/analyze-agent/analyze';
import { search } from '../skills/search-agent/search';
import { generateTestInputs } from '../skills/testgen-agent/testgen';
import { refactor } from '../skills/refactor-agent/refactor';
import { Backend, getBackend, getDeviceString } from '../skills/hardware/backend';
import { assertSafePattern } from '../skills/hardening/guard';

const MAX_STDIN_BYTES = 1_048_576;
const MAX_TOP = 100;
const MAX_LAYERS = 10;
const MAX_ITERS = 1000;

function isString(v: unknown): v is string {
  return typeof v === 'string';
}
function isBoundedInt(v: unknown, min: number, max: number): boolean {
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
}
function validateArgs(name: string, args: Record<string, unknown>): string | null {
  const stringFields = ['file', 'pattern', 'files', 'function', 'functionName', 'entry'] as const;
  for (const f of stringFields) {
    if (args[f] !== undefined && !isString(args[f])) return `Invalid params: ${f} must be a string`;
  }
  switch (name) {
    case 'analyze':
      if (!isString(args.file)) return 'Invalid params: file must be a string';
      break;
    case 'search':
      if (!isString(args.pattern)) return 'Invalid params: pattern must be a string';
      if (!isString(args.files)) return 'Invalid params: files must be a string';
      try {
        assertSafePattern(args.pattern);
      } catch (e) {
        return (e as Error).message;
      }
      break;
    case 'testgen':
      if (!isString(args.file)) return 'Invalid params: file must be a string';
      if (!isString(args.function ?? args.functionName)) return 'Invalid params: function must be a string';
      break;
    case 'refactor':
      if (!isString(args.file)) return 'Invalid params: file must be a string';
      break;
    case 'hardware':
      break;
    default:
      return `Invalid params: unknown tool ${name}`;
  }
  if (args.top !== undefined && !isBoundedInt(args.top, 1, MAX_TOP))
    return 'Invalid params: top must be integer 1..100';
  if (args.layers !== undefined && !isBoundedInt(args.layers, 1, MAX_LAYERS))
    return 'Invalid params: layers must be integer 1..10';
  if (args.iters !== undefined && !isBoundedInt(args.iters, 1, MAX_ITERS))
    return 'Invalid params: iters must be integer 1..1000';
  return null;
}

const TOOLS = [
  {
    name: 'analyze',
    description: 'Call-graph + QWalk metrics (reachability, centrality, diameter, hotSpots)',
    inputSchema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Path to source file' },
        entry: { type: 'string', description: 'Entry function name' },
      },
      required: ['file'],
    },
  },
  {
    name: 'search',
    description: 'Grover-ranked code search (regex + glob)',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string' },
        files: { type: 'string', description: 'Glob pattern' },
        top: { type: 'number' },
      },
      required: ['pattern', 'files'],
    },
  },
  {
    name: 'testgen',
    description: 'VQE boundary test generation for a function',
    inputSchema: {
      type: 'object',
      properties: {
        file: { type: 'string' },
        function: { type: 'string', description: 'Function name' },
        layers: { type: 'number' },
      },
      required: ['file', 'function'],
    },
  },
  {
    name: 'refactor',
    description: 'QWalk+QML refactoring candidates',
    inputSchema: {
      type: 'object',
      properties: { file: { type: 'string' }, top: { type: 'number' } },
      required: ['file'],
    },
  },
  {
    name: 'hardware',
    description: 'List backends + current device',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
];

async function dispatch(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'analyze':
      return analyze({ file: args.file as string, entry: args.entry as string | undefined });
    case 'search':
      return search({
        pattern: args.pattern as string,
        files: args.files as string,
        top: args.top as number | undefined,
      });
    case 'testgen':
      return generateTestInputs({
        file: args.file as string,
        functionName: (args.function ?? args.functionName) as string,
        layers: args.layers as number | undefined,
      });
    case 'refactor':
      return refactor({ file: args.file as string, top: args.top as number | undefined });
    case 'hardware': {
      const current = getBackend();
      const rows = (Object.values(Backend) as string[]).map(
        b =>
          `${b} -> ${getDeviceString(b as Backend)}${(b as Backend) === current ? ' (current)' : ''}`
      );
      return {
        backends: rows,
        current,
        env: {
          QWISPR_BACKEND: process.env.QWISPR_BACKEND ?? '(unset)',
          QWISPR_DEVICE: process.env.QWISPR_DEVICE ?? '(unset)',
          deviceString: getDeviceString(),
        },
      };
    }
    default:
      throw new Error(`unknown tool: ${name}`);
  }
}

export async function startMcpServer(): Promise<void> {
  let buf = '';
  process.stdin.setEncoding('utf8');

  const send = (obj: unknown) => process.stdout.write(JSON.stringify(obj) + '\n');

  const handle = async (msg: unknown) => {
    const m = msg as Record<string, unknown>;
    const id = m.id;
    const method = typeof m.method === 'string' ? m.method : undefined;
    try {
      if (method === 'initialize') {
        const res = {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'qwispr', version: '0.1.0' },
          },
        };
        send(res);
      } else if (method === 'notifications/initialized' || method === 'notifications/cancelled') {
        return;
      } else if (method === 'tools/list') {
        send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
      } else if (method === 'tools/call') {
        const params = m.params as Record<string, unknown> | undefined;
        const name = params?.name as string;
        const rawArgs = params?.arguments;
        const args = (rawArgs as Record<string, unknown> | undefined) ?? {};
        if (typeof name !== 'string' || !TOOLS.some(t => t.name === name)) {
          if (id !== undefined)
            send({
              jsonrpc: '2.0',
              id,
              error: { code: -32602, message: `Invalid params: unknown tool ${String(name)}` },
            });
          return;
        }
        if (
          rawArgs !== undefined &&
          (typeof rawArgs !== 'object' || rawArgs === null || Array.isArray(rawArgs))
        ) {
          if (id !== undefined)
            send({
              jsonrpc: '2.0',
              id,
              error: { code: -32602, message: 'Invalid params: arguments must be an object' },
            });
          return;
        }
        const validationError = validateArgs(name, args);
        if (validationError) {
          if (id !== undefined)
            send({ jsonrpc: '2.0', id, error: { code: -32602, message: validationError } });
          return;
        }
        try {
          const result = await dispatch(name, args);
          send({
            jsonrpc: '2.0',
            id,
            result: {
              content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
              isError: false,
            },
          });
        } catch (e: unknown) {
          const msg = (e as Error)?.message ?? String(e);
          send({
            jsonrpc: '2.0',
            id,
            result: { content: [{ type: 'text', text: msg }], isError: true },
          });
        }
      } else if (method === 'ping') {
        send({ jsonrpc: '2.0', id, result: {} });
      } else {
        if (id !== undefined)
          send({
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Method not found: ${method}` },
          });
      }
    } catch (e: unknown) {
      const err = { code: -32603, message: (e as Error)?.message ?? String(e) };
      if (id !== undefined) send({ jsonrpc: '2.0', id, error: err });
      else send({ jsonrpc: '2.0', error: err });
    }
  };

  process.stdin.on('data', async (chunk: string) => {
    buf += chunk;
    if (Buffer.byteLength(buf, 'utf8') > MAX_STDIN_BYTES) {
      send({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32603, message: `stdin buffer exceeded ${MAX_STDIN_BYTES} bytes` },
      });
      buf = '';
      return;
    }
    let idx: number;
    while ((idx = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line) continue;
      let msg: unknown;
      try {
        msg = JSON.parse(line) as unknown;
      } catch {
        continue;
      }
      await handle(msg);
    }
  });

  process.stdin.on('end', async () => {
    if (buf.trim()) {
      try {
        await handle(JSON.parse(buf.trim()));
      } catch {
        /* ignore */
      }
    }
    process.exit(0);
  });

  // keep alive until stdin ends
  process.stdin.resume();
}
