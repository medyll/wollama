<script lang="ts">
	import { activeChatId, chatter } from '$lib/stores/chatter';
	import Icon from '@iconify/svelte';

	export let chatId: string = '';

	const chat = chatter.getChat(chatId);
	const confirmDelete: boolean = false;
	let editChat: boolean = false;

	$: active = Boolean($activeChatId == chatId);

	function deleteCha1tHandler() {
		// chatter.deleteChat(chatId);
	}

	function editChatTitleHandler() {
		editChat = true;
	}
</script>

<div class="flex relative p-0.5 w-full">
	<button on:click class="flex gap-1 whitespace-nowrap overflow-hidden">
		{#if active}
			<Icon icon="mdi:delete" />
		{/if}
		{#if editChat}
			<input type="text" bind:value={chat.title} />
			<button on:click={editChatTitleHandler}>
				<Icon icon="mdi:check" />
			</button>
		{:else}
			<span class="whitespace-nowrap overflow-hidden">
				{chat.title}
			</span>
		{/if}
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
