<script lang="ts">
  import { hooks, selectedHook, filter, select, toggleEnabled } from '$lib/stores/hooks';
  const selectHook = (id: string) => select(id);
  const toggle = (id: string) => toggleEnabled(id);
</script>

<div class="p-4 bg-base-200 rounded shadow">
  <h3 class="text-lg font-semibold">Hook Inspector</h3>
  <div class="mt-3 flex gap-4">
    <div class="w-1/3">
      <input placeholder="Filter hooks" class="input input-bordered w-full" bind:value={$filter} />
      <ul class="mt-2 overflow-auto max-h-64">
        {#each $hooks as hook}
          <li class="p-2 border-b flex items-center justify-between">
            <div>
              <div class="font-medium">{hook.name}</div>
              <div class="text-sm text-muted">{hook.id}</div>
            </div>
            <div class="flex items-center gap-2">
              <label class="flex items-center gap-1">
                <input type="checkbox" checked={hook.enabled} onchange={() => toggle(hook.id)} />
                <span class="text-sm">Enabled</span>
              </label>
              <button class="btn btn-ghost btn-sm" onclick={() => selectHook(hook.id)}>Inspect</button>
            </div>
          </li>
        {/each}
      </ul>
    </div>
    <div class="w-2/3">
      {#if $selectedHook}
        <div class="p-3 bg-base-100 rounded">
          <h4 class="text-md font-semibold">{$selectedHook.name}</h4>
          <pre class="text-sm mt-2">{JSON.stringify($selectedHook, null, 2)}</pre>
        </div>
      {:else}
        <div class="p-6 text-center text-sm text-muted">Select a hook to inspect details</div>
      {/if}
    </div>
  </div>
</div>
