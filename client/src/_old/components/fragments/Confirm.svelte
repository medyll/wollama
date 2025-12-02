<script lang="ts">
	import { Icon } from '@medyll/idae-slotui-svelte';

	interface ConfirmProps {
		collection: string;
		field:      string;
		validate:   Function;
		message?:   string | undefined;
		initial?:   import('svelte').Snippet;
		children?:  import('svelte').Snippet;
	}

	let { validate, message = undefined, initial, children }: ConfirmProps = $props();

	let status = $state('default');
</script>

<div class="line-gap-2 w-full">
	{@render initial?.()}
	{#if status === 'default'}
		<button
			class="line-gap-2"
			hidden={status !== 'default'}
			onclick={() => {
				status = 'show_confirm';
			}}
		>
			{@render children?.()}
		</button>
	{/if}
	{#if status === 'show_confirm'}
		<button
			onclick={() => {
				validate?.();
				status = 'default';
			}}
		>
			{message ?? ''}
			<Icon class="color-success md text-green-800" icon="mdi:done" />
		</button>
		<button
			onclick={() => {
				status = 'default';
			}}
		>
			<Icon icon="typcn:cancel" style="color: red" class="md fill-red-800 " />
		</button>
	{/if}
</div>

<style lang="postcss">
	@reference "../../styles/references.css";
	svg {
		> path {
			color: red !important;
		}
	}
</style>
