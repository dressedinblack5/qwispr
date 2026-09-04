// ponytail: JSONL + heurística, DB si >10k eventos/día
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export interface TelemetryEvent {
  ts: number;
  task: string;
  route: 'classical' | 'quantum';
  nVars: number;
  wallMs: number;
  success: boolean;
}

function getTelemetryPath(): string {
  const raw = process.env.QWISPR_TELEMETRY_PATH;
  if (!raw) return path.join(os.homedir(), '.qwispr', 'telemetry.jsonl');
  if (raw.includes('..')) throw new Error(`qwispr: telemetry path traversal rejected: ${raw}`);
  const resolved = path.resolve(raw);
  const home = path.resolve(os.homedir());
  const cwd = path.resolve(process.cwd());
  const tmp = path.resolve(os.tmpdir());
  const inside = (base: string, p: string) => p === base || p.startsWith(base + path.sep);
  if (!inside(home, resolved) && !inside(cwd, resolved) && !inside(tmp, resolved)) {
    throw new Error(`qwispr: telemetry path outside allowed dirs: ${raw}`);
  }
  let realResolved: string;
  try {
    realResolved = fs.realpathSync(resolved);
  } catch {
    try {
      const realDir = fs.realpathSync(path.dirname(resolved));
      realResolved = path.join(realDir, path.basename(resolved));
    } catch {
      realResolved = resolved;
    }
  }
  try {
    const lst = fs.lstatSync(resolved);
    if (lst.isSymbolicLink() && realResolved !== resolved) {
      if (!inside(home, realResolved) && !inside(cwd, realResolved) && !inside(tmp, realResolved)) {
        throw new Error(`qwispr: telemetry symlink outside allowed dirs: ${raw} -> ${realResolved}`);
      }
    }
  } catch {
    // lstatSync failed (path may not exist yet): realpath check below still applies
  }
  if (realResolved !== resolved) {
    if (!inside(home, realResolved) && !inside(cwd, realResolved) && !inside(tmp, realResolved)) {
      throw new Error(`qwispr: telemetry path resolves outside allowed dirs: ${raw} -> ${realResolved}`);
    }
  }
  return resolved;
}

export function appendEvent(ev: TelemetryEvent): void {
  if (process.env.QWISPR_TELEMETRY !== '1') return;
  try {
    const file = getTelemetryPath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, JSON.stringify(ev) + '\n', 'utf8');
  } catch {
    /* ignore */
  }
}

export function readRecent(n = 100): TelemetryEvent[] {
  try {
    const file = getTelemetryPath();
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    const events: TelemetryEvent[] = [];
    for (const line of lines) {
      try {
        events.push(JSON.parse(line));
      } catch {
        /* ignore bad lines */
      }
    }
    return events.slice(-n);
  } catch {
    return [];
  }
}

export function clearTelemetry(): void {
  try {
    const file = getTelemetryPath();
    fs.unlinkSync(file);
  } catch {
    /* ignore */
  }
}
