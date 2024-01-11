<script lang="ts">
	import Icon from '@iconify/svelte';

	export let validate: Function;
	export let message: string | undefined = undefined;

	let status = 'default';
</script>

<div class="line-gap-2 w-full">
	<slot name="initial" />
	{#if status === 'default'}
		<button
			class="line-gap-2"
			hidden={status !== 'default'}
			on:click={() => {
				status = 'show_confirm';
			}}
		>
			<slot />
		</button>
	{/if}
	{#if status === 'show_confirm'}
		<button
			on:click={() => {
				validate();
				status = 'default';
			}}
		>
			{message ?? ''}
			<Icon class="text-green-800 color-success md" icon="mdi:done" />
		</button>
		<button
			on:click={() => {
				status = 'default';
			}}
		>
			<Icon icon="typcn:cancel" style="color: red" class="md fill-red-800 " />
		</button>
	{/if}
</div>

<style lang="postcss">
	svg {
		> path {
			color: red !important;
		}
	}
</style>
