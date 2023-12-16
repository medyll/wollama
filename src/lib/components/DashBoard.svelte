<script lang="ts"> 
	import { ui } from '$lib/stores/ui';
	import Icon from '@iconify/svelte';
 
</script>

{#if !$ui.activeChatId}
	<div class="flex place-content-center"><Icon icon="fluent-emoji-high-contrast:llama" style="font-size:10em" /></div>
{:else}
	<slot />
{/if}
