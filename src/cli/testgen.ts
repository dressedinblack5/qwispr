import { generateTestInputs } from '../skills/testgen-agent/testgen';
import { parseIntSafe } from './parse-int';

export async function testgenCommand(args: string[]) {
  let file = '',
    fn = '',
    layers = 2;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) file = args[++i];
    else if (args[i] === '--function' && args[i + 1]) fn = args[++i];
    else if (args[i] === '--layers' && args[i + 1]) {
      layers = parseIntSafe(args[++i], '--layers');
    }
  }
  if (!file || !fn)
    throw new Error('usage: qwispr testgen --file <path> --function <name> [--layers 2]');
  return generateTestInputs({ file, functionName: fn, layers });
}
