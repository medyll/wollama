<script lang="ts">
	import { hooks, selectedHook, filter, select, toggleEnabled } from '$lib/stores/hooks';

	const selectHook = (id: string) => select(id);
	const toggle = (id: string) => toggleEnabled(id);
</script>

<hook-inspector>
	<h3>Hook Inspector</h3>
	<inspector-layout>
		<hook-list-panel>
			<input placeholder="Filter hooks" class="w-full" bind:value={$filter} />
			<ul>
				{#each $hooks as hook}
					<li>
						<hook-summary>
							<strong>{hook.name}</strong>
							<small>{hook.id}</small>
						</hook-summary>
						<hook-actions>
							<label class="checkbox-row">
								<input type="checkbox" checked={hook.enabled} onchange={() => toggle(hook.id)} />
								<span>Enabled</span>
							</label>
							<button class="btn-ghost btn-sm" onclick={() => selectHook(hook.id)}>Inspect</button>
						</hook-actions>
					</li>
				{/each}
			</ul>
		</hook-list-panel>
		<hook-detail-panel>
			{#if $selectedHook}
				<h4>{$selectedHook.name}</h4>
				<pre>{JSON.stringify($selectedHook, null, 2)}</pre>
			{:else}
				<inspector-empty>Select a hook to inspect details</inspector-empty>
			{/if}
		</hook-detail-panel>
	</inspector-layout>
</hook-inspector>

<style>
	@layer components {
		hook-inspector,
		inspector-layout,
		hook-list-panel,
		hook-summary,
		hook-actions,
		hook-detail-panel,
		inspector-empty {
			display: flex;
		}

		hook-inspector {
			padding: var(--pad-lg);
			flex-direction: column;
			gap: var(--gap-md);
			background: var(--color-surface-raised);
			border-radius: var(--radius-md);
			box-shadow: var(--shadow-sm);
		}

		inspector-layout {
			gap: var(--gap-lg);
		}

		hook-list-panel,
		hook-detail-panel {
			min-width: 0;
			flex-direction: column;
		}

		hook-list-panel {
			flex: 1;
		}

		hook-list-panel ul {
			max-height: 20rem;
			margin: var(--gap-sm) 0 0;
			padding: 0;
			overflow-y: auto;
			list-style: none;
		}

		hook-list-panel li {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: var(--gap-md);
			padding: var(--pad-sm);
			border-bottom: var(--border-width) solid var(--color-border);
		}

		hook-summary {
			min-width: 0;
			flex-direction: column;
		}

		hook-summary small {
			overflow: hidden;
			color: var(--color-text-muted);
			text-overflow: ellipsis;
		}

		hook-actions {
			align-items: center;
			gap: var(--gap-sm);
		}

		hook-detail-panel {
			flex: 2;
			padding: var(--pad-lg);
			background: var(--color-surface);
			border-radius: var(--radius-md);
			overflow: auto;
		}

		hook-detail-panel pre {
			max-width: 100%;
			overflow: auto;
			font-size: var(--text-sm);
		}

		inspector-empty {
			min-height: 12rem;
			align-items: center;
			justify-content: center;
			color: var(--color-text-muted);
		}

		@media (max-width: 48rem) {
			inspector-layout {
				flex-direction: column;
			}

			hook-list-panel li {
				align-items: flex-start;
				flex-direction: column;
			}
		}
	}
</style>
