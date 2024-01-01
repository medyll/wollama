<script lang="ts">
	import { ui } from '$lib/stores/ui';
	import { fade } from 'svelte/transition';

	export let show = true;
</script>

{#if $ui.showSettings}
	<div
		aria-modal="true"
		class="modal"
		on:click={() => {
			ui.showHideSettings();
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
		@apply m-auto rounded-xl max-w-full mx-2 bg-gradient-to-b;
		@apply from-neutral-100 to-neutral-200;
		@apply dark:from-gray-800 dark:to-gray-900;
	}
</style>
