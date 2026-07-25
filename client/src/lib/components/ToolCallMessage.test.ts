import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Unit tests for ToolCallMessage polling logic (without mounting Svelte component)
// Tests the fetch/state logic in isolation via a plain helper that mirrors the component behavior.

type Status = 'running' | 'done' | 'error';

interface PollState {
    status: Status;
    output: Record<string, unknown> | null;
    errorMsg: string | null;
}

async function simulateFetchStatus(
    tool_call_id: string,
    fetchFn: typeof fetch
): Promise<PollState> {
    const state: PollState = { status: 'running', output: null, errorMsg: null };
    try {
        const res = await fetchFn(`/api/agents/${encodeURIComponent(tool_call_id)}/status`);
        if (!res.ok) {
            state.status = 'error';
            state.errorMsg = `HTTP ${(res as any).status}`;
            return state;
        }
        const data = await res.json();
        state.status = data.status as Status;
        if (state.status === 'done') state.output = data.output ?? null;
        if (state.status === 'error') state.errorMsg = data.error ?? 'Unknown error';
    } catch (e: any) {
        state.status = 'error';
        state.errorMsg = e?.message ?? 'Network error';
    }
    return state;
}

describe('ToolCallMessage polling logic', () => {
    it('returns running state initially', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ status: 'running' })
        });
        const state = await simulateFetchStatus('abc', mockFetch as any);
        expect(state.status).toBe('running');
        expect(state.output).toBeNull();
        expect(state.errorMsg).toBeNull();
    });

    it('returns done state with output', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ status: 'done', output: { content: 'Hello page' } })
        });
        const state = await simulateFetchStatus('abc', mockFetch as any);
        expect(state.status).toBe('done');
        expect(state.output).toEqual({ content: 'Hello page' });
        expect(state.errorMsg).toBeNull();
    });

    it('returns error state with message', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ status: 'error', error: 'agent crashed' })
        });
        const state = await simulateFetchStatus('abc', mockFetch as any);
        expect(state.status).toBe('error');
        expect(state.errorMsg).toBe('agent crashed');
        expect(state.output).toBeNull();
    });

    it('handles non-200 HTTP response as error', async () => {
        const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
        const state = await simulateFetchStatus('abc', mockFetch as any);
        expect(state.status).toBe('error');
        expect(state.errorMsg).toContain('404');
    });

    it('handles network failure as error', async () => {
        const mockFetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
        const state = await simulateFetchStatus('abc', mockFetch as any);
        expect(state.status).toBe('error');
        expect(state.errorMsg).toBe('ECONNREFUSED');
    });
});
