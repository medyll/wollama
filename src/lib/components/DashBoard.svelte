<script lang="ts">
	import { activeChatId, chatter } from '$lib/stores/chatter';
	import Icon from '@iconify/svelte';

	$: messages = chatter.getChatMessages($activeChatId); // get messages for active chat
</script>

{#if Object.values(messages).length == 0}
	<div class="flex place-content-center"><Icon icon="fluent-emoji-high-contrast:llama" style="font-size:10em" /></div>
{:else}
	<slot />
{/if}
