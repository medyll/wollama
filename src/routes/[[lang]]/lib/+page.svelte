<script lang="ts">
	import { t } from '$lib/stores/i18n.js';
	import { page } from '$app/stores';
	import { getDatePeriod, getTimeTitle } from '$lib/tools/chatMenuList.svelte.js';
	import { format } from 'date-fns';
	import { ui } from '$lib/stores/ui.js';
	import { engine } from '$lib/tools/engine';
	import { groupMessages } from '$lib/tools/chatMenuList.svelte';
	import { idbqlState } from '$lib/db/dbSchema';
	import { Confirm, Looper, TitleBar } from '@medyll/idae-slotui-svelte';
	import { idbQuery } from '$lib/db/dbQuery';
	import { Button, Icon, Menu, Popper, MenuItem } from '@medyll/idae-slotui-svelte';
	import { chatMetadata } from '$lib/tools/promptSystem';

	let loadingStae = $state<Record<string, any>>({});
	let chatList = $derived(idbqlState.chat.getAll());
	let chatMenuList = $derived(groupMessages(chatList));

	const openCloseConfig = async () => {
		if ($page.route.id?.includes('/configuration')) {
			ui.setActiveChatId();
			engine.goto('/');
		} else {
			engine.goto('/configuration');
		}
	};

	const createChat = async () => {
		ui.setActiveChatId();
		engine.goto('/');
		engine.goto('/');
	};

	const openSettings = async () => {
		engine.goto('/settings');
	};
	const openLibgs = async () => {
		engine.goto('/lib');
	};

	const loadChat = async (id: string) => {
		ui.setActiveChatId(id);
		ui.showHideMenu(false);
		engine.goto(`/chat/${id}`);
	};

	function deleteCha1tHandler(chatId: number) {
		return idbQuery.deleteChat(chatId);
	}
	async function guess(chatId: any) {
		return chatMetadata.checkTitle(chatId);
	}

	async function categorize(chatId: any) {
		return chatMetadata.checkCategorie(chatId);
	}
	async function describe(chatId: any) {
		return chatMetadata.checkDescription(chatId);
	}
</script>

<div class="flex-align-middle flex justify-between gap-4 p-4">
	<div class=" "><Icon icon="mdi:settings" class="md" /></div>
	<div class="flex-1 self-center text-2xl font-medium capitalize">{$t('ui.myLib')}</div>
	<input type="search" placeholder={$t('ui.searchChats')} bind:value={$ui.searchString} />
</div>
<div class="flex flex-col gap-4 p-4">
	<div class="flex-align-middle flex gap-4 border-b py-4">
		<div class="flex-1">
			{$t('ui.threads')}
		</div>
		<div class=" flex-1 gap-4">
			<Button
				variant="naked"
				width="auto"
				icon="mdi:chat-plus-outline"
				title={$t('ui.newChat')}
				onclick={createChat}
			>
				{$t('ui.newChat')}
			</Button>
		</div>
	</div>
	<div class="flex flex-col gap-4">
		<Looper
			groupBy={(item) => {
				return getDatePeriod(new Date(item?.createdAt));
			}}
			data={chatList}
			class="flex flex-col gap-5  "
		>
			{#snippet loopGroupTitle(item)}
				<div class="text-lg">{item?.data?.title}</div>
			{/snippet}
			{#snippet children({ item })}
				<!-- {item.tags} -->
				<div class="flex-v flex gap-4" style="content-visibility:auto">
					<div class="flex gap-4">
						<div class="line-clamp-1 flex-1 py-2 font-bold break-all transition duration-300">
							<a class="uppercase" title={item?.title} href={`/chat/${item.chatPassKey}`}
								>- {item?.title}</a
							>
						</div>
						<div class="flex flex-1 gap-2">
							<Confirm
								title={$t('chat.guess_chat_title')}
								primaryConfirm={$t('chat.guess_chat_title')}
								buttonInitial={{ icon: { icon: 'material-symbols-light:title' } }}
								data={item.id as string}
								action={guess}
								tall="mini"
								variant="naked"
							/>
							<Confirm
								title={$t('chat.categorize')}
								primaryConfirm={$t('chat.categorize')}
								buttonInitial={{ icon: { icon: 'icon-park-outline:folder-one' } }}
								tall="mini"
								variant="naked"
								data={item.id as string}
								action={categorize}
							/>
							<Confirm
								title={$t('chat.describe')}
								primaryConfirm={$t('chat.describe')}
								buttonInitial={{ icon: { icon: 'fluent-mdl2:edit-note' } }}
								tall="mini"
								variant="naked"
								data={item.id as string}
								action={describe}
							/>
							<Confirm
								title={$t('chat.tags')}
								primaryConfirm={$t('chat.tags')}
								buttonInitial={{ icon: { icon: 'mdi:tags' } }}
								tall="mini"
								variant="naked"
								data={item.id as string}
								action={describe}
							/>
							<Confirm
								title={$t('chat.delete_chat')}
								primaryConfirm={$t('chat.delete_chat')}
								buttonInitial={{
									icon: { icon: 'material-symbols:delete-outline-sharp', color: 'red' }
								}}
								tall="mini"
								variant="naked"
								data={item.id as string}
								action={deleteCha1tHandler}
							/>
						</div>
					</div>
					<div class="flex gap-4">
						<div class="flex gap-2">
							<Icon icon="fluent:clock-16-regular" />
							{item?.createdAt ? format(new Date(item?.createdAt), 'dd MMMM y hh:mm') : ''}
						</div>
						<div class="flex gap-2">
							<Icon icon="icon-park-outline:folder-one" />{item?.category}
						</div>
						<div class="flex gap-2">
							<Icon icon="hugeicons:tags" />
							{item.tags}
						</div>
					</div>
					<div class="overflow-hidden text-ellipsis" style="user-select:text">
						{@html item?.description ?? ''}
					</div>
				</div>
			{/snippet}
		</Looper>
	</div>
</div>
