<script lang="ts">
	import { activeChatId } from '../../stores/chatter.js';
	import { goto } from '$app/navigation';
	import { getTimeTitle, messageByGroupDate } from '$lib/tools/utils.js';
	import ChatButton from '../chat/ChatButton.svelte';
	import Icon from '@iconify/svelte';
	import { showSettings } from '$lib/stores/settings.js';
	import { t } from '$lib/i18n.js';
	let search: any = '';
	import { format } from 'date-fns';

	const loadChat = async (id: string) => {
		activeChatId.set(id);
		goto(`/chat/${id}`);
	};
</script>

<div class="flex-v h-full w-[260px] gap-2 border-r-4 px-2 pt-2">
	<div class="text-right">{format(new Date(), 'EEEE, dd MMMM')}</div>
	<div class="flex-align-middle gap-2 justify-end">
		<span>{$t('ui.newChat')}</span>
		<button
			on:click={async () => {
				$activeChatId = undefined;
				goto('/');
			}}
			class="appButton iconButton"
		>
			<Icon icon="mdi:chat-plus-outline" style="font-size:1.6em" />
		</button>
	</div>
	<input class="inputSearch" placeholder={$t('ui.searchChats')} bind:value={search} />
	<div class="text-right">{$t('ui.myChats')}</div>
	<div class="flex-1">
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
</div>
