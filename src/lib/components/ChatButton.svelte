<script lang="ts">
	import { activeChatId, chatList } from '$lib/stores/chatList';
	import Icon from '@iconify/svelte';

	export let chatId: string = '';

	const chat = chatList.getChat(chatId);
	const confirmDelete: boolean = false;

	$: active = Boolean($activeChatId == chatId);

	function deleteChat() {
		// chatList.deleteChat(chatId);
	}
</script>

<div class="flex relative p-0.5 w-full">
	<button on:click class="flex gap-1 whitespace-nowrap overflow-hidden">
		{#if active}
			<Icon icon="mdi:delete" />
		{/if}
		<span class="whitespace-nowrap overflow-hidden">
			{chat.title}
		</span>
	</button>
	<!-- <div class="absolute flex right top">
		<button class="self-center">
			<Icon icon="mdi:delete" />
		</button>
		<button class="self-center">
			<Icon icon="mdi:pencil" />
		</button>
	</div> -->
</div>
