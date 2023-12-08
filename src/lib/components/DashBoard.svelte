<script lang="ts">
	import { activeChatId, chatter } from '$lib/stores/chatter';
	import Icon from '@iconify/svelte';

	$: messages = chatter.getChatMessages($activeChatId);
</script>

{#if Object.values(messages).length == 0}
	<Icon icon="fluent-emoji-high-contrast:llama" style="font-size:10em" />
{:else}
	<slot />
{/if}
