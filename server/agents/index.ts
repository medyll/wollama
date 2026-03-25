import { WebSearchAgent } from './web-search.agent.js';
import { PageFetchAgent } from './page-fetch.agent.js';

export type AgentHandler = (input: Record<string, unknown>) => Promise<Record<string, unknown>>;

const registry: Record<string, AgentHandler> = {
    [WebSearchAgent.slug]: (input) => WebSearchAgent.run(input as any) as any,
    [PageFetchAgent.slug]: (input) => PageFetchAgent.run(input as any) as any,
};

export function getAgent(slug: string): AgentHandler | null {
    return registry[slug] ?? null;
}

export { WebSearchAgent, PageFetchAgent };
