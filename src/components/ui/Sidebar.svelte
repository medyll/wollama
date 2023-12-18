<script lang="ts">
	import { goto } from '$app/navigation';
	import { getTimeTitle, messageByGroupDate } from '$lib/tools/chatMenuList.js';
	import ChatButton from '$components/chat/input/ChatButton.svelte';
	import Icon from '@iconify/svelte'; 
	import { t } from '$lib/stores/i18n.js';
	let search: any = ''; 
	import { ui } from '$lib/stores/ui.js';

	const loadChat = async (id: string) => {
		ui.setActiveChatId(id)
		goto(`/chat/${id}`);
	};
</script>

<div class="flex-v h-full w-[280px] gap-3 p-3">
	<div class="flex-align-middle gap-2 ">
	    <div class="flex-1 font-semibold text-xl">wOollama !</div>
		<span class="underline">{$t('ui.newChat')}</span>
		<button
			on:click={async () => {
				ui.setActiveChatId();
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
			{#each $messageByGroupDate ?? [] as erd}
				<div>
					<div class="font-bold whitespace-nowrap text-ellipsis py-2 soft-title">
						{$t(getTimeTitle(erd.code))}
					</div>
					<div>
						{#each erd.items as chat}
							<ChatButton
								chatId={chat.chatId}
								on:click={() => {
									loadChat(chat.chatId);
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
		@apply border-neutral-600/10;
		@apply bg-zinc-200 dark:bg-slate-600/30;
		@apply shadow shadow-gray-400/70 dark:shadow-black/80;
	}
</style>
