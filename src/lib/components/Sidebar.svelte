<script lang="ts">
	import { activeChatId, chatList } from './../stores/chatList.js';
	import { goto } from '$app/navigation';
	import { settings } from '$lib/stores/settings';
	import { userProfile } from '../stores/users';
	import { messageByGroupDate } from '$lib/tools/utils.js';
	import ChatButton from './ChatButton.svelte';
	import Icon from '@iconify/svelte';
	let search: any = '';

	let showDropDown: boolean = false;

	const loadChat = async (id: string) => {
		activeChatId.set(id);
		goto(`/chat/${id}`);
	};
 
</script>

<div class="flex flex-col h-full w-[260px] gap-3">
	<button
		on:click={async () => {
			$activeChatId = undefined;
			goto('/');
		}}
		class="flex"
	>
		<Icon icon="mdi:chat-plus" /> Nouveau chat
	</button>
	<div class="p-3">
		<input placeholder="Search" bind:value={search} />
	</div>
	<div class="flex-1 p-2">
		{#each $messageByGroupDate as erd}
			<div>
				<div class="font-bold whitespace-nowrap text-ellipsis">
					{erd.name}
				</div>
				<div>
					{#each erd.items as chat}
						<div>
							<ChatButton
								chatId={chat.id}
								on:click={() => {
									loadChat(chat.id);
								}}
							/>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
	<div>
		<button
			on:click={() => {
				goto('/admin');
			}}>admin</button
		>
		<button
			class=" flex rounded-md p-3.5 w-full"
			on:click={() => {
				showDropDown = !showDropDown;
			}}
			on:focusout={() => {
				setTimeout(() => {
					showDropDown = false;
				}, 150);
			}}
		>
			<div>User profile</div>
		</button>

		<button
			on:click={() => {
				goto('/signing');
			}}
		>
			Sign Out
		</button>
	</div>
</div>
