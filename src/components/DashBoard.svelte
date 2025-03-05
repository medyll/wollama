<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		showList = $bindable(false),
		children,
		home
	}: { showList: boolean; children: Snippet; home?: Snippet } = $props();
</script>

<div class="application-dashboard">
	{#if !showList}
		<div class="flex h-full w-full flex-col">
			<div class="flex-1"></div>
			<!-- <div class="flex self-center text-center opacity-70">
                <Icon icon="fluent-emoji-high-contrast:llama" style="font-size:10em" />
            </div> -->
			<div class="flex-col self-center p-4 text-center"></div>
			{@render home?.()}
			<div class="flex-1"></div>
		</div>
	{:else}
		{@render children?.()}
	{/if}
</div>
