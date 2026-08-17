import { WebSearchAgent } from './web-search.agent.js';
import { PageFetchAgent } from './page-fetch.agent.js';
import type { ToolRisk } from '../orchestration/types.js';

export type AgentHandler = (input: Record<string, unknown>) => Promise<Record<string, unknown>>;

export interface BuiltinToolDescriptor {
	name: string;
	description: string;
	inputSchema: Record<string, unknown>;
	risk: ToolRisk;
}

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

export function getAgent(slug: string): AgentHandler | null {
	return registry[slug]?.run ?? null;
}

export function listBuiltins(): Record<string, BuiltinTool> {
	return registry;
}

export { WebSearchAgent, PageFetchAgent };
