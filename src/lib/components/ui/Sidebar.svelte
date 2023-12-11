<script lang="ts">
	import { activeChatId } from '../../stores/chatter.js';
	import { goto } from '$app/navigation';
	import { getTimeTitle, messageByGroupDate } from '$lib/tools/utils.js';
	import ChatButton from '../chat/ChatButton.svelte';
	import Icon from '@iconify/svelte';
	import { showSettings } from '$lib/stores/settings.js'; 
	import { t } from '$lib/i18n.js';
	let search: any = '';

	let showDropDown: boolean = false;

	const loadChat = async (id: string) => {
		activeChatId.set(id);
		goto(`/chat/${id}`);
	};
</script>

<div class="flex-v h-full w-[260px] gap-3 border-r-4">
	<button
		on:click={async () => {
			$activeChatId = undefined;
			goto('/');
		}}
		class="flex-align-middle gap-2"
	>
		<Icon icon="mdi:chat-plus-outline" style="font-size:1.8em" /> <span>{$t('ui.newChat')}</span>
	</button>
	<div class="p-3">
		<input placeholder="{$t('ui.searchChats')}" bind:value={search} />
	</div>
	<div class="flex-1 p-2">
		{#each $messageByGroupDate as erd}
			<div>
				<div class="font-bold whitespace-nowrap text-ellipsis">
				 {$t(getTimeTitle(erd.code))}
				</div>
				<div>
					{#each erd.items as chat}
						<ChatButton
							chatId={chat.id}
							on:click={() => {
								loadChat(chat.id);
							}}
						/>
					{/each}
				</div>
			</div>
		{/each}
	</div>
	<div>
		<button
			on:click={() => {
				showSettings.set(true);
			}}>{$t('ui.settings')}</button
		>
		<button 
			on:click={() => {
				showDropDown = !showDropDown;
			}}
			on:focusout={() => {
				setTimeout(() => {
					showDropDown = false;
				}, 150);
			}}
		>
			<div>{$t('ui.userProfile')}</div>
		</button>

		<button
			on:click={() => {
				goto('/signing');
			}}
		>
			{$t('ui.signOut')}
		</button>
	</div>
</div>
