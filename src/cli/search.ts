import { search } from "../skills/search-agent/search";

export function searchCommand(args: string[]) {
  let pattern = "", files = "", top = 10;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--pattern" && args[i + 1]) pattern = args[++i];
    else if (args[i] === "--files" && args[i + 1]) files = args[++i];
    else if (args[i] === "--top" && args[i + 1]) { const v = parseInt(args[++i], 10); if (Number.isNaN(v) || v <= 0) throw new Error("qwispr: invalid --top"); top = v; }
  }
  if (!pattern || !files) throw new Error("usage: qwispr search --pattern <regex> --files <glob> [--top 10]");
  return search({ pattern, files, top });
}
