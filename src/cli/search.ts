import { search } from '../skills/search-agent/search';
import { parseIntSafe } from './parse-int';

export function searchCommand(args: string[]) {
  let pattern = '',
    files = '',
    top = 10;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pattern') {
      if (i + 1 >= args.length || args[i + 1] === undefined || args[i + 1].startsWith('-')) throw new Error('qwispr: missing value for --pattern');
      pattern = args[++i];
    } else if (args[i] === '--files') {
      if (i + 1 >= args.length || args[i + 1] === undefined || args[i + 1].startsWith('-')) throw new Error('qwispr: missing value for --files');
      files = args[++i];
    } else if (args[i] === '--top') {
      if (i + 1 >= args.length || args[i + 1] === undefined || args[i + 1].startsWith('-')) throw new Error('qwispr: missing value for --top');
      top = parseIntSafe(args[++i], '--top');
    }
  }
  if (!pattern || !files)
    throw new Error('usage: qwispr search --pattern <regex> --files <glob> [--top 10]');
  return search({ pattern, files, top });
}
