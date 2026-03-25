<script lang="ts" context="module">
  export const tag = 'ToolCallMessage';
</script>

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let tool_call_id: string;
  export let slug: string = '';
  export let input: Record<string, unknown> = {};

  type Status = 'running' | 'done' | 'error';

  let status: Status = 'running';
  let output: Record<string, unknown> | null = null;
  let errorMsg: string | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  async function fetchStatus() {
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(tool_call_id)}/status`);
      if (!res.ok) {
        status = 'error';
        errorMsg = `HTTP ${res.status}`;
        stopPolling();
        return;
      }
      const data = await res.json();
      status = data.status as Status;
      if (status === 'done') {
        output = data.output ?? null;
        stopPolling();
      } else if (status === 'error') {
        errorMsg = data.error ?? 'Unknown error';
        stopPolling();
      }
    } catch (e: any) {
      status = 'error';
      errorMsg = e?.message ?? 'Network error';
      stopPolling();
    }
  }

  function stopPolling() {
    if (pollTimer !== null) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  onMount(() => {
    fetchStatus();
    pollTimer = setInterval(fetchStatus, 1000);
  });

  onDestroy(() => {
    stopPolling();
  });

  function formatOutput(out: Record<string, unknown> | null): string {
    if (!out) return '';
    // Show content field if present (PageFetchAgent), else JSON
    if (typeof out.content === 'string') return out.content;
    if (Array.isArray(out.results)) {
      return (out.results as any[])
        .map((r: any) => `• ${r.title}\n  ${r.url}\n  ${r.snippet}`)
        .join('\n\n');
    }
    return JSON.stringify(out, null, 2);
  }
</script>

<div class="tool-call-message" role="status" aria-live="polite">
  {#if status === 'running'}
    <div class="tool-call-running" aria-label="Agent running">
      <span class="spinner" aria-hidden="true">⏳</span>
      <span class="tool-call-label">Running <em>{slug || 'agent'}</em>…</span>
    </div>
  {:else if status === 'done'}
    <div class="tool-call-done">
      <span class="tool-call-label">✅ <strong>{slug || 'Agent'}</strong> result:</span>
      <pre class="tool-call-output">{formatOutput(output)}</pre>
    </div>
  {:else if status === 'error'}
    <div class="tool-call-error" role="alert">
      <span>❌ <strong>{slug || 'Agent'}</strong> failed: {errorMsg}</span>
    </div>
  {/if}
</div>

<style>
  .tool-call-message {
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    background: var(--color-surface, #f8f8f8);
    border: 1px solid var(--color-border, #e2e2e2);
    margin: 0.25rem 0;
  }
  .tool-call-running {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-muted, #666);
  }
  .tool-call-done {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .tool-call-output {
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 0.8rem;
    margin: 0;
    padding: 0.5rem;
    background: var(--color-code-bg, #f0f0f0);
    border-radius: 0.25rem;
  }
  .tool-call-error {
    color: var(--color-error, #c0392b);
  }
  .spinner {
    animation: spin 1s linear infinite;
    display: inline-block;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
