<script lang="ts">
	import Icon from '@iconify/svelte';

	export let validate: Function;
	export let message: string|undefined;

	let status = 'default';
</script>

<div class="flex-align-middle gap-2">
	{#if status === 'default'}
		<button class="" hidden={status !== 'default'} on:click={() => [(status = 'show_confirm')]}>
			<slot />
		</button>
	{/if}
	{#if status === 'show_confirm'}
		<button
			
			on:click={() => {
				validate();
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
			<Icon icon="typcn:cancel" class="text-red-900 md"   />
		</button>
	{/if}
</div>
