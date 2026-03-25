
<script lang="ts">
  import type { ToolCallMessage } from '$lib/types/messages';
  export let message: ToolCallMessage;
</script>

<div class="p-3 rounded bg-base-100 border">
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
    <details class="mt-2">
      <summary class="cursor-pointer">Outputs</summary>
      <pre class="text-xs mt-2">{JSON.stringify(message.outputs, null, 2)}</pre>
    </details>
  </div>
</div>

