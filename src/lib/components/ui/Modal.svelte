<script lang="ts">
	import { fade } from 'svelte/transition';

	export let show = true;
</script>

{#if show}
	<div
		class="modal"
		on:click={() => {
			show = false;
		}}
	>
		<div
			class="m-auto rounded-xl max-w-full w-[40rem] mx-2 bg-gray-50 dark:bg-gray-900 shadow-3xl"
			transition:fade={{ delay: 100, duration: 200 }}
			on:click={(e) => {
				e.stopPropagation();
			}}
		>
			<slot />
		</div>
	</div>
{/if}

<style lang="postcss">
	.modal {
		@apply fixed top-0 right-0 left-0 bottom-0 bg-stone-900/50 w-full min-h-screen h-screen flex justify-center z-50 overflow-hidden overscroll-contain;
	}
</style>
