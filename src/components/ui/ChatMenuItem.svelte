<script lang="ts">
	import Confirm from '$components/fragments/Confirm.svelte';
	import { idbQuery } from '$lib/db/dbQuery';
	import { t } from '$lib/stores/i18n';
	import { ui } from '$lib/stores/ui';
	import { Icon } from '@medyll/idae-slotui-svelte';
	import { Button, Menu, Popper, MenuItem } from '@medyll/idae-slotui-svelte';

	import { chatUtils } from '$lib/tools/chatUtils';

	import { idbqlState } from '$lib/db/dbSchema';
	import { chatMetadata } from '$lib/tools/promptSystem';

	const { id = '', selected = false } = $props();

	let chat = $derived(idbQuery.getChat(id));

	let editChat: boolean = $state(false);
	let isOpen: boolean = $state(false);
	let title = chat?.title;
	// $: title = chat?.title;

	function deleteCha1tHandler() {
		idbQuery.deleteChat(id);
		if ($ui.activeChatId === id) {
			ui.setActiveChatId(undefined);
		}
	}

	function editChatTitleHandler() {
		editChat = true;
	}

	function toggleEdit(visible?: boolean) {
		editChat = visible === undefined ? !editChat : visible;
	}

	function togglePopper() {
		isOpen = !isOpen;
	}

	function guess() {
		chatMetadata.checkTitle(chat.chatId);
	}

	function onSubmit(event: Event) {
		const { title } = event.currentTarget as HTMLFormElement;
		isOpen = false;
		toggleEdit(false);
		idbQuery.updateChat(id, { title: title.value });
	}
</script>

<div class="line-gap-2 relative w-full overflow-hidden">
	<button title={chat?.title} on:click class="block w-full truncate text-left">
		{chat?.title}
	</button>
	{#if selected && !editChat}
		<Popper bind:isOpen position="BC" autoClose class="w-48">
			<Button
				link
				slot="popperHolder"
				icon="mdi:ellipsis-vertical"
				height="auto"
				onclick={() => {
					togglePopper();
				}}
			/>
			<Menu class="w-full">
				<MenuItem
					icon="mdi:edit"
					text={$t('chat.edit_chat_title')}
					on:click={() => {
						toggleEdit(true);
					}}
				/>
				<MenuItem icon="fluent-mdl2:status-circle-question-mark">
					<Confirm validate={guess}>{$t('chat.guess_chat_title')}</Confirm>
				</MenuItem>
				<MenuItem icon="mdi:delete">
					<Confirm validate={deleteCha1tHandler}>{$t('chat.delete_chat')}</Confirm>
				</MenuItem>
			</Menu>
		</Popper>
	{/if}
</div>

<style lang="postcss">
	@reference "../../styles/references.css";
	button {
		@apply block flex w-full items-center gap-2 px-1 py-1 text-left text-ellipsis whitespace-nowrap transition dark:hover:bg-gray-800;
	}
</style>
