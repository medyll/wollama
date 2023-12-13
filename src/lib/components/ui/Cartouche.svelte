<script lang="ts">
	import Icon from '@iconify/svelte';

	export let title: string;

	export let open = false;

	function openClose() {
		open = !open;
	}
</script>

<div class="cartouche">
	<button class="cartoucheTitle flex-align-middle" on:click={openClose} type="button">
		<div>
			<Icon icon="ci:main-component" style="font-size:1.6em" />
		</div>
		<div class="flex-1 font-thin capitalize">{title}</div>
		<div>
			<button on:click|stopPropagation={openClose}>
				<Icon icon={`mdi:chevron-${open ? 'up' : 'down'}`} style="font-size:1.6em" />
			</button>
		</div>
	</button>
	{#if open}
		<div class="animate p-2 cartoucheContent"><slot /></div>
	{/if}
</div>

<style lang="postcss">
	.cartouche {
		@apply w-full rounded-md overflow-hidden mb-2;
		@apply border  border-indigo-500/30 dark:border-white/20;
	}
	.cartoucheTitle {
		@apply w-full rounded-t-md cursor-pointer flex  p-2 text-left gap-4 h-14;
		@apply bg-white dark:bg-neutral-200/10;
		@apply hover:bg-neutral-200 hover:dark:bg-gray-200/30;
	}

	.cartoucheContent {
		@apply w-full pl-8;
		@apply bg-neutral-400/20 dark:bg-gray-400/10;
	}
</style>
