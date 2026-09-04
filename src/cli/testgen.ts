import { generateTestInputs } from '../skills/testgen-agent/testgen';
import { parseIntSafe } from './parse-int';

export async function testgenCommand(args: string[]) {
  let file = '',
    fn = '',
    layers = 2;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file') {
      if (i + 1 >= args.length || args[i + 1] === undefined || args[i + 1].startsWith('-')) throw new Error('qwispr: missing value for --file');
      file = args[++i];
    } else if (args[i] === '--function') {
      if (i + 1 >= args.length || args[i + 1] === undefined || args[i + 1].startsWith('-')) throw new Error('qwispr: missing value for --function');
      fn = args[++i];
    } else if (args[i] === '--layers') {
      if (i + 1 >= args.length || args[i + 1] === undefined || args[i + 1].startsWith('-')) throw new Error('qwispr: missing value for --layers');
      layers = parseIntSafe(args[++i], '--layers');
    }
  }
  if (!file || !fn)
    throw new Error('usage: qwispr testgen --file <path> --function <name> [--layers 2]');
  return generateTestInputs({ file, functionName: fn, layers });
}
