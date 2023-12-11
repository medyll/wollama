<script lang="ts">
	import { activeChatId, chatter } from '$lib/stores/chatter';
	import Icon from '@iconify/svelte';

	export let chatId: string = '';

	$: chat = chatter.getChat(chatId);
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
	<button on:click class="button {active ? 'active' : ''}">
		{#if active}
		<div class="w-6">		
			<Icon icon="mdi:chat" />
		</div>
		{/if}
		{#if editChat}
			<input type="text" bind:value={chat.title} />
			<button on:click={editChatTitleHandler}>
				<Icon icon="mdi:check" />
			</button>
		{:else}
			<span class="w-full whitespace-nowrap overflow-hidden">
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

<style lang="postcss">
	.button {
		@apply w-full text-left flex justify-between items-center rounded-md px-1 py-0.5 transition whitespace-nowrap text-ellipsis hover:bg-gray-200 dark:hover:bg-gray-800;
	}
	.active {
		@apply bg-gray-300 dark:bg-gray-900 shadow-md;
	}
</style>
