<script lang="ts">
	import Icon from '@iconify/svelte';

	export let validate: Function;

	let status = 'default';
</script>

<div class="flex-align-middle gap-2"> 
	{#if status === 'default'}
		<button
			class=""
			hidden={status !== 'default'}
			on:click={() => [(status = 'show_confirm')]}
		>
			<slot />
		</button>
	{/if}
	{#if status === 'show_confirm'}
		<button
			on:click={() => {
				validate();
			}}
		>
			<Icon icon="mdi:done" />
		</button>
		<button
			on:click={() => {
				status = 'default';
			}}
		>
			<Icon icon="mdi:cancel" />
		</button>
	{/if}
</div>
