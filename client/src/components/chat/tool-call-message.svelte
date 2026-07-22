<script lang="ts">
  interface ToolCallMessage {
    toolName: string;
    toolId: string;
    timestamp: number;
    inputs: Record<string, unknown>;
    outputs?: Record<string, unknown>;
  }

  const { message } = $props();
</script>

<tool-call-message>
  <div class="flex justify-between items-start">
    <div>
      <div class="font-semibold">Tool: {message.toolName}</div>
      <div class="text-sm text-muted">{message.toolId}</div>
    </div>
    <div class="text-sm text-muted">{new Date(message.timestamp).toLocaleString()}</div>
  </div>
  <div class="mt-2 text-sm">
    <details>
      <summary class="cursor-pointer">Inputs</summary>
      <pre class="text-xs mt-2">{JSON.stringify(message.inputs, null, 2)}</pre>
    </details>
    {#if message.outputs}
    <details class="mt-2">
      <summary class="cursor-pointer">Outputs</summary>
      <pre class="text-xs mt-2">{JSON.stringify(message.outputs, null, 2)}</pre>
    </details>
    {/if}
  </div>
</tool-call-message>

<style>
	@layer components {
		tool-call-message {
			display: block;
			padding: var(--pad-md);
			background: var(--color-surface);
			border: var(--border-width) solid var(--color-border);
			border-radius: var(--radius-md);
		}
	}
</style>
