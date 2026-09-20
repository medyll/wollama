import { WebSearchAgent } from './web-search.agent.js';
import { PageFetchAgent } from './page-fetch.agent.js';
import type { ToolRisk } from '../orchestration/types.js';

/** The callable half of a builtin tool: takes parsed input, returns a structured result. */
export type AgentHandler = (input: Record<string, unknown>) => Promise<Record<string, unknown>>;

/** How a builtin tool advertises itself to the model. */
export interface BuiltinToolDescriptor {
	name: string;
	description: string;
	inputSchema: Record<string, unknown>;
	risk: ToolRisk;
}

/** A builtin tool: what it looks like to the model, and what runs it. */
export interface BuiltinTool {
	descriptor: BuiltinToolDescriptor;
	run: AgentHandler;
}

const registry: Record<string, BuiltinTool> = {
	[WebSearchAgent.slug]: {
		descriptor: WebSearchAgent.descriptor,
		run: (input) => WebSearchAgent.run(input as any) as any
	},
	[PageFetchAgent.slug]: {
		descriptor: PageFetchAgent.descriptor,
		run: (input) => PageFetchAgent.run(input as any) as any
	}
};

/** Looks a builtin tool's handler up by slug. Returns `null` when unknown. */
export function getAgent(slug: string): AgentHandler | null {
	return registry[slug]?.run ?? null;
}

/** Returns every registered builtin tool, keyed by slug. */
export function listBuiltins(): Record<string, BuiltinTool> {
	return registry;
}

export { WebSearchAgent, PageFetchAgent };
