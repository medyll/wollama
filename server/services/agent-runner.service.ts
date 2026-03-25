import { randomUUID } from 'crypto';
import { dbManager } from '../db/database.js';
import { getAgent } from '../agents/index.js';
import type { ToolCall } from '../../shared/types/agents.js';

export interface AgentRunRequest {
    slug: string;
    input: Record<string, unknown>;
    message_id?: string;
    agent_id?: string;
}

export interface AgentRunResponse {
    tool_call_id: string;
    status: 'running' | 'done' | 'error';
    output?: Record<string, unknown>;
    error?: string;
}

export class AgentRunnerService {
    static async run(req: AgentRunRequest): Promise<AgentRunResponse> {
        const { slug, input, message_id = 'standalone', agent_id = slug } = req;

        const handler = getAgent(slug);
        if (!handler) {
            return { tool_call_id: '', status: 'error', error: `No agent registered for slug: ${slug}` };
        }

        const tool_call_id = randomUUID();
        const db = dbManager.getDb('tool_calls');

        const record: ToolCall & { _id: string } = {
            _id: tool_call_id,
            tool_call_id,
            message_id,
            agent_id,
            status: 'running',
            input,
            started_at: new Date().toISOString()
        };

        await db.put(record);

        try {
            const output = await handler(input);
            const existing: any = await db.get(tool_call_id);
            await db.put({
                ...existing,
                status: 'done',
                output,
                finished_at: new Date().toISOString()
            });
            return { tool_call_id, status: 'done', output };
        } catch (err: any) {
            const existing: any = await db.get(tool_call_id);
            await db.put({
                ...existing,
                status: 'error',
                error: err?.message ?? 'Unknown error',
                finished_at: new Date().toISOString()
            });
            return { tool_call_id, status: 'error', error: err?.message ?? 'Unknown error' };
        }
    }

    static async getStatus(tool_call_id: string): Promise<ToolCall | null> {
        const db = dbManager.getDb('tool_calls');
        try {
            const doc: any = await db.get(tool_call_id);
            return doc as ToolCall;
        } catch (e: any) {
            if (e.status === 404) return null;
            throw e;
        }
    }
}

export default AgentRunnerService;
