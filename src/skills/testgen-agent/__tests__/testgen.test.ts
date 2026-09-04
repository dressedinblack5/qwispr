import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { generateTestInputs } from '../testgen';

describe('testgen', () => {
  it('generates boundary inputs and covers branch', async () => {
    const prev = process.env.QWISPR_ALLOW_ABSOLUTE;
    process.env.QWISPR_ALLOW_ABSOLUTE = '1';
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'testgen-'));
    const file = path.join(tmp, 'foo.ts');
    try {
      fs.writeFileSync(
        file,
        `export function add(a:number,b:number){ if(a>0){ return a+b; } return b; }`
      );
      const r = await generateTestInputs({ file, functionName: 'add', layers: 1 });
      expect(r.inputs.length).toBeGreaterThan(0);
      expect(r.coverageHint).toBeTruthy();
      const triggers = r.inputs.some(([a]) => a > 0);
      expect(triggers).toBe(true);
      expect(r.inputs[0].length).toBe(2);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
      if (prev === undefined) delete process.env.QWISPR_ALLOW_ABSOLUTE;
      else process.env.QWISPR_ALLOW_ABSOLUTE = prev;
    }
  }, 30000);
});
