export type Task = 'resolve' | 'search' | 'testgen' | 'analyze' | 'refactor';

export const AGENT_MAP: Record<Task, string> = {
  resolve: 'qaoa-agent',
  search: 'search-agent',
  testgen: 'testgen-agent',
  analyze: 'analyze-agent',
  refactor: 'refactor-agent',
};
