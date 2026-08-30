import { analyze } from '../skills/analyze-agent/analyze';

export function analyzeCommand(args: string[]) {
  let file = '',
    entry: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) file = args[++i];
    else if (args[i] === '--entry' && args[i + 1]) entry = args[++i];
  }
  if (!file) throw new Error('usage: qwispr analyze --file <path> [--entry <name>]');
  return analyze({ file, entry });
}
