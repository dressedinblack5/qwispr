import { refactor } from '../skills/refactor-agent/refactor';
import { parseIntSafe } from './parse-int';

export function refactorCommand(args: string[]) {
  let file = '',
    top = 5;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file') {
      if (i + 1 >= args.length || args[i + 1] === undefined || args[i + 1].startsWith('-')) throw new Error('qwispr: missing value for --file');
      file = args[++i];
    } else if (args[i] === '--top') {
      if (i + 1 >= args.length || args[i + 1] === undefined || args[i + 1].startsWith('-')) throw new Error('qwispr: missing value for --top');
      top = parseIntSafe(args[++i], '--top');
    }
  }
  if (!file) throw new Error('usage: qwispr refactor --file <path> [--top 5]');
  return refactor({ file, top });
}
