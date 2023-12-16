<script lang="ts">
	import { activeChatId, } from '$lib/stores/chatter';
	import Icon from '@iconify/svelte';
 
</script>

{#if !$activeChatId}
	<div class="flex place-content-center"><Icon icon="fluent-emoji-high-contrast:llama" style="font-size:10em" /></div>
{:else}
	<slot />
{/if}
