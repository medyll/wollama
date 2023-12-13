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

<div class="flex-v h-full w-[360px] gap-3 px-8 pt-2">
	<div class="flex-align-middle gap-2 ">
	    <div class="flex-1 font-semibold text-xl">wOollama !</div>
		<span>{$t('ui.newChat')}</span>
		<button
			on:click={async () => {
				$activeChatId = undefined;
				goto('/');
			}}
			class="borderButton iconButton"
		>
			<Icon icon="mdi:chat-plus-outline" style="font-size:1.6em" />
		</button>
	</div>
	<input type="search" placeholder={$t('ui.searchChats')} bind:value={search} />
	<hr class="ml-auto w-24   " />
	<div class="text-right soft-title">{$t('ui.myChats')}</div>
	<div class="chatZone">
		<div class="flex-1">
			{#each $messageByGroupDate as erd}
				<div>
					<div class="font-bold whitespace-nowrap text-ellipsis py-2">
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
</div>

<style lang="postcss">
	.chatZone {
		@apply flex flex-col gap-4;
		@apply border rounded-lg p-2 py-4;
		@apply border-neutral-600/30;
		@apply bg-zinc-200/50 dark:bg-slate-400/30;
	}
</style>
