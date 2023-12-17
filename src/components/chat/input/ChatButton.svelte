<script lang="ts"> 
	import { dbQuery } from '$lib/db/dbQuery'; 
	import { ui } from '$lib/stores/ui';
	import type { ChatType } from '$types/db';
	import Icon from '@iconify/svelte';
	import { liveQuery } from 'dexie';

	export let chatId: string|undefined = undefined;


	$: chat = liveQuery(()=>{
		if(chatId) return dbQuery.getChat(chatId) 
	})  ;

	$: active = Boolean($ui.activeChatId === chatId);

	const confirmDelete: boolean = false;
	let editChat: boolean = false;


	function deleteCha1tHandler() {
		
	}

	function editChatTitleHandler() {
		editChat = true;
	}


	function liveData(arg0: Promise<ChatType | undefined>): any {
		throw new Error('Function not implemented.');
	}
</script>

<div class="flex relative w-full">
	<button on:click class="button {active ? 'active' : ''}">
		<div class="w-6 text-left">		
			<Icon icon="{active ? 'carbon:chat-operational' : 'carbon:chat'}" class="md {active ? 'active' : 'opacity-50'} "  />
		</div>
		{#if active}
		{/if}
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
		@apply block w-full text-left flex   items-center px-1 py-1 gap-2 transition whitespace-nowrap text-ellipsis hover:bg-gray-200 dark:hover:bg-gray-800;
	}
	.active { 
		@apply border-b-2 font-bold border-blue-500;
	}
</style>
