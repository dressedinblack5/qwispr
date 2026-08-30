import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawn } from 'node:child_process';

export function getCalibration(): number {
  const v = parseFloat(process.env.QWISPR_CALIBRATION ?? '1.0');
  return isNaN(v) ? 1.0 : v;
}

export function assertFileExists(p: string): void {
  try {
    const lst = fs.lstatSync(p);
    let real = p;
    try {
      real = fs.realpathSync(p);
    } catch {
      void 0;
    }
    const root = path.resolve(process.cwd());
    const resolved = path.resolve(real);
    if (lst.isSymbolicLink() && resolved !== root && !resolved.startsWith(root + path.sep)) {
      throw new Error(`qwispr: symlink outside workspace: ${p} -> ${resolved}`);
    }
    const st = fs.statSync(real);
    if (!st.isFile()) throw new Error();
    if (st.size > 5 * 1024 * 1024) throw new Error(`qwispr: file too large (>5MB): ${p}`);
  } catch (e: unknown) {
    if ((e as Error).message.startsWith('qwispr:')) throw e;
    throw new Error(`qwispr: file not found: ${p}`);
  }
}

export function assertSafePattern(pattern: string): void {
  // ponytail: heuristic ReDoS check, upgrade to re2 if needed
  let re: RegExp;
  try {
    re = new RegExp(pattern);
  } catch (e: unknown) {
    throw new Error(`qwispr: invalid pattern: ${pattern} — ${(e as Error).message}`);
  }
  if (pattern.length > 200) throw new Error(`qwispr: unsafe pattern (potential ReDoS): ${pattern}`);
  const nested = /\([^)]*[+*][^)]*\)[+*]/;
  if (nested.test(pattern)) {
    throw new Error(`qwispr: unsafe pattern (potential ReDoS): ${pattern}`);
  }
  if (pattern.length > 50 && /\([^)]*\+[^)]*\)/.test(pattern)) {
    throw new Error(`qwispr: unsafe pattern (potential ReDoS): ${pattern}`);
  }
  if (/\+\+/.test(pattern)) throw new Error(`qwispr: unsafe pattern (potential ReDoS): ${pattern}`);
  if (/\.\*\.\*/.test(pattern))
    throw new Error(`qwispr: unsafe pattern (potential ReDoS): ${pattern}`);
  if (/\{\d{3,}\}/.test(pattern))
    throw new Error(`qwispr: unsafe pattern (potential ReDoS): ${pattern}`);
  if (/\w\*\w*\*/.test(pattern))
    throw new Error(`qwispr: unsafe pattern (potential ReDoS): ${pattern}`);
  if (/\(.*\|.*\)[+*]/.test(pattern))
    throw new Error(`qwispr: unsafe pattern (potential ReDoS): ${pattern}`);
  void re;
}

export function spawnWithTimeout(
  cmd: string,
  args: string[],
  opts: { timeout?: number; maxBuffer?: number; input?: string } = {}
): Promise<{ stdout: string; stderr: string }> {
  const timeout = opts.timeout ?? 30000;
  const maxBuffer = opts.maxBuffer ?? 1024 * 1024;
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let killed = false;

    const kill = () => {
      killed = true;
      try {
        child.kill('SIGTERM');
      } catch {
        void 0;
      }
      setTimeout(() => {
        try {
          child.kill('SIGKILL');
        } catch {
          void 0;
        }
      }, 1000);
    };

    const timer = setTimeout(() => {
      kill();
      reject(new Error(`qwispr: process timed out after ${timeout}ms: ${cmd} ${args.join(' ')}`));
    }, timeout);

    const onData = (chunk: Buffer, isStdout: boolean) => {
      const s = chunk.toString();
      if (isStdout) stdout += s;
      else stderr += s;
      if (stdout.length + stderr.length > maxBuffer) {
        kill();
        clearTimeout(timer);
        reject(new Error(`qwispr: process output exceeded maxBuffer ${maxBuffer}: ${cmd}`));
      }
    };

    child.stdout.on('data', d => onData(d, true));
    child.stderr.on('data', d => onData(d, false));

    child.on('error', (err: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      if (err.code === 'ENOENT') {
        reject(new Error(`qwispr: spawn failed (ENOENT): ${cmd} not found`));
      } else {
        reject(new Error(`qwispr: spawn failed: ${err.message}`));
      }
    });

    child.on('close', code => {
      clearTimeout(timer);
      if (killed) return; // already rejected via timeout/maxBuffer
      if (code !== 0) {
        reject(new Error(stderr || `qwispr: ${cmd} exited ${code}`));
        return;
      }
      resolve({ stdout, stderr });
    });

    if (opts.input !== undefined) {
      if (child.stdin) {
        child.stdin.write(opts.input);
        child.stdin.end();
      }
    } else {
      if (child.stdin) child.stdin.end();
    }
  });
}
