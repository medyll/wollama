<script lang="ts">
	import Confirm from '$components/ui/Confirm.svelte';
	import { dbQuery } from '$lib/db/dbQuery';
	import { ui } from '$lib/stores/ui';
	import type { ChatType } from '$types/db';
	import Icon from '@iconify/svelte';
	import { liveQuery } from 'dexie';

	export let chatId: string;

	$: chat = liveQuery(() => {
		if (chatId) return dbQuery.getChat(chatId);
	});

	$: active = Boolean($ui.activeChatId === chatId);

	const confirmDelete: boolean = false;
	let editChat: boolean = false;

	function deleteCha1tHandler() {
		dbQuery.deleteChat(chatId);
	}

	function editChatTitleHandler() {
		editChat = true;
	}
</script>

<div class="flex relative w-full {active ? 'active' : ''}">
	<button on:click class="overflow-hidden button ">
		<div class="w-6 text-left {active ? '  font-bold' : 'opacity-50'}">
			<Icon icon={active ? 'carbon:chat-operational' : 'carbon:chat'} class="md  " />
		</div>
		{#if editChat}
			<input type="text" bind:value={$chat.title} />
			<button on:click={editChatTitleHandler}>
				<Icon icon="mdi:check" />
			</button>
		{:else}
			<span class="w-full whitespace-nowrap overflow-hidden">
				{$chat?.title}
			</span>
		{/if}
	</button>
	{#if active}
		<div class="flex-align-middle gap-2">
			<button class="borderButton" on:click={() => {editChat=true}}>
				<Icon icon="mdi:edit" />
			</button>
			<Confirm
				validate={deleteCha1tHandler}
			>
				<Icon icon="mdi:delete" />
			</Confirm>
		</div>
	{/if}
</div>

<style lang="postcss">
	.button {
		@apply block w-full text-left flex   items-center px-1 py-1 gap-2 transition whitespace-nowrap text-ellipsis hover:bg-gray-200 dark:hover:bg-gray-800;
	}
	.active {
		@apply border-b-2 font-bold border-blue-500;
	}
</style>
