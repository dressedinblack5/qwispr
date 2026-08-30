export type Task = 'resolve' | 'search' | 'testgen' | 'analyze' | 'refactor';

export const AGENT_MAP: Record<Task, string> = {
  resolve: 'qaoa-agent',
  search: 'search-agent',
  testgen: 'testgen-agent',
  analyze: 'analyze-agent',
  refactor: 'refactor-agent',
};

export function agentFor(task: string): string {
  return (AGENT_MAP as Record<string, string>)[task] ?? 'unknown';
}
