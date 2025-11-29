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
	@reference "../../styles/references.css";
	.modal {
		@apply fixed top-0 right-0 bottom-0 left-0 z-50 flex h-screen min-h-screen w-full justify-center overflow-hidden overscroll-contain bg-gray-900/50;
	}
	.inModal {
		@apply m-auto mx-2 max-w-full rounded-xl bg-linear-to-b;
		@apply from-neutral-100 to-neutral-200;
		@apply dark:from-gray-800 dark:to-gray-900;
	}
</style>
