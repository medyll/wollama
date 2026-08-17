<script lang="ts">
	import Icon from '@iconify/svelte';
	import { uiState } from '$lib/state/ui.svelte';

	let { class: className = '', title = 'Open sidebar', visible = true } = $props();
</script>

{#if visible}
	<button class="btn-icon {className}" onclick={() => uiState.toggleSidebarVisibility()} aria-label={title} {title}>
		<Icon icon="fluent:navigation-24-regular" class="inline-block h-5 w-5" />
	</button>
{/if}
