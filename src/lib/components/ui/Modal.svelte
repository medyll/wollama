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
			class="inModal w-[40rem]"
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
		@apply fixed top-0 right-0 left-0 bottom-0 bg-gray-900/50 w-full min-h-screen 
		h-screen flex justify-center z-50 overflow-hidden overscroll-contain;
	}
	.inModal {
		@apply m-auto rounded-xl max-w-full mx-2 bg-gradient-to-b ;
		@apply  from-neutral-200 to-neutral-300;
		@apply   dark:from-gray-800 dark:to-gray-900
	}
</style>
