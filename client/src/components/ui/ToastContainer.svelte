<script lang="ts">
	import { toast } from '$lib/state/notifications.svelte';
	import { fade, fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	function getIcon(type: string) {
		switch (type) {
			case 'success':
				return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
			case 'error':
				return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
			case 'warning':
				return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
			default:
				return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
		}
	}
</script>

<aside class="toast-component" data-position={toast.position} aria-label="Notifications">
	{#each toast.toasts as item (item.id)}
		<!-- Section: Toast Item -->
		<div
			animate:flip={{ duration: 300 }}
			in:fly={{ y: 20, duration: 300 }}
			out:fade={{ duration: 200 }}
			class="toast-item"
			data-type={item.type}
			role="status"
		>
			<div class="flex items-center gap-2">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIcon(item.type)} />
				</svg>
				<span>{item.message}</span>
			</div>
			{#if !item.timeout}
				<button
					class="btn-icon btn-sm"
					aria-label="Close"
					onclick={(e) => {
						e.stopPropagation();
						toast.remove(item.id);
					}}>✕</button
				>
			{/if}
		</div>
	{/each}
</aside>

<style>
	.toast-component {
		position: fixed;
		display: flex;
		max-width: min(24rem, calc(100vw - (2 * var(--pad-md))));
		flex-direction: column;
		gap: var(--gap-sm);
		padding: var(--pad-md);
		z-index: var(--z-toast);
		pointer-events: none;
	}

	.toast-component[data-position^='top'] {
		top: 0;
	}
	.toast-component[data-position^='bottom'] {
		bottom: 0;
	}
	.toast-component[data-position$='left'] {
		left: 0;
	}
	.toast-component[data-position$='right'] {
		right: 0;
	}
	.toast-component[data-position$='center'] {
		left: 50%;
		transform: translateX(-50%);
	}

	.toast-item {
		display: flex;
		min-width: min(18rem, calc(100vw - (2 * var(--pad-md))));
		align-items: center;
		justify-content: space-between;
		gap: var(--gap-md);
		padding: var(--pad-md);
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-overlay);
		box-shadow: var(--shadow-lg);
		pointer-events: auto;

		&[data-type='success'] {
			border-color: var(--color-success);
		}
		&[data-type='error'] {
			border-color: var(--color-critical);
		}
		&[data-type='warning'] {
			border-color: var(--color-warning);
		}
		&[data-type='info'] {
			border-color: var(--color-info);
		}
	}
</style>
