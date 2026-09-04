import { analyze } from '../skills/analyze-agent/analyze';

export function analyzeCommand(args: string[]) {
  let file = '',
    entry: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file') {
      if (i + 1 >= args.length || args[i + 1] === undefined || args[i + 1].startsWith('-')) throw new Error('qwispr: missing value for --file');
      file = args[++i];
    } else if (args[i] === '--entry') {
      if (i + 1 >= args.length || args[i + 1] === undefined || args[i + 1].startsWith('-')) throw new Error('qwispr: missing value for --entry');
      entry = args[++i];
    }
  }
  if (!file) throw new Error('usage: qwispr analyze --file <path> [--entry <name>]');
  return analyze({ file, entry });
}
