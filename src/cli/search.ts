import { search } from '../skills/search-agent/search';
import { parseIntSafe } from './parse-int';

export function searchCommand(args: string[]) {
  let pattern = '',
    files = '',
    top = 10;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pattern' && args[i + 1]) pattern = args[++i];
    else if (args[i] === '--files' && args[i + 1]) files = args[++i];
    else if (args[i] === '--top' && args[i + 1]) {
      top = parseIntSafe(args[++i], '--top');
    }
  }
  if (!pattern || !files)
    throw new Error('usage: qwispr search --pattern <regex> --files <glob> [--top 10]');
  return search({ pattern, files, top });
}
