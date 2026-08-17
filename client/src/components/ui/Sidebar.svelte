<script lang="ts">
	import { t } from '$lib/state/i18n.svelte';
	import { uiState } from '$lib/state/ui.svelte';
	import { chatService } from '$lib/services/chat.service';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import SidebarCollapse from '$components/ui/SidebarCollapse.svelte';
	import SidebarTrigger from '$components/ui/SidebarTrigger.svelte';

	let chats = $state<any[]>([]);

	$effect(() => {
		let subscription: any;

		const init = async () => {
			try {
				const obs = await chatService.getChats();
				subscription = obs.subscribe((data: any[]) => {
					chats = data;
				});
			} catch (e) {
				console.error('Error loading chats:', e);
			}
		};

		init();

		return () => {
			if (subscription) subscription.unsubscribe();
		};
	});

	async function createNewChat() {
		goto('/chat/new');
	}
</script>

<aside
	class="app-sidebar"
	data-open={uiState.sidebarOpen}
	data-collapsed={uiState.sidebarCollapsed}
	aria-label="Sidebar"
>
	<div class="sidebar-header">
		<!-- Section: Desktop Navicon (Collapse Toggle) & Search -->
		<div
			class="hidden md:flex {uiState.sidebarCollapsed
				? 'flex-col items-center gap-2'
				: 'flex-row items-center justify-between'} p-2"
		>
			<div class="flex items-center gap-1">
				<SidebarTrigger class="btn-sm" title={t('ui.close')} visible={!uiState.sidebarCollapsed} />
			</div>

			{#if !uiState.sidebarCollapsed}
				<button class="btn-icon btn-sm" aria-label="Search" onclick={() => goto('/search')}>
					<Icon icon="fluent:search-24-regular" class="h-5 w-5" />
				</button>
			{/if}
		</div>
		{#if uiState.sidebarCollapsed}
			<button class="btn-icon btn-sm mx-auto" aria-label="Search" onclick={() => goto('/search')}>
				<Icon icon="fluent:search-24-regular" class="h-5 w-5" />
			</button>
		{/if}

		<button
			class="sidebar-action"
			onclick={createNewChat}
			title={t('ui.newChat')}
		>
			<Icon icon="fluent:compose-24-regular" class="h-5 w-5 {uiState.sidebarCollapsed ? '' : 'mr-2'}" />
			{#if !uiState.sidebarCollapsed}
				{t('ui.newChat')}
			{/if}
		</button>
	</div>

	<nav id="sidebar-nav" class="sidebar-nav" aria-label={t('ui.myChats')} data-testid="chat-list">
		{#if !uiState.sidebarCollapsed}
			{#each chats as chat}
				<a
					href="/chat/{chat.chat_id}"
					class="sidebar-chat-link"
					aria-current={$page.url.pathname.includes(chat.chat_id) ? 'page' : undefined}
					title={chat.title}
					data-testid="chat-list-item"
				>
					<Icon icon="fluent:chat-24-regular" class="mr-2 h-5 w-5 opacity-70" />
					<span class="truncate">{chat.title}</span>
				</a>
			{/each}
		{/if}
	</nav>

	<div class="sidebar-footer">
		<div class="flex justify-end px-2">
			<SidebarCollapse />
		</div>
		<button
			class="sidebar-action"
			onclick={() => goto('/settings')}
			title={t('ui.settings')}
		>
			<Icon icon="fluent:settings-24-regular" class="h-5 w-5 {uiState.sidebarCollapsed ? '' : 'mr-2'}" />
			{#if !uiState.sidebarCollapsed}
				{t('ui.settings')}
			{/if}
		</button>
	</div>
</aside>

<style>
	.app-sidebar {
		display: flex;
		width: var(--app-sidebar-width);
		min-width: var(--app-sidebar-width);
		height: calc(100dvh - (2 * var(--pad-sm)));
		margin: var(--marg-sm);
		flex-direction: column;
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface-alt);
		box-shadow: var(--shadow-sm);
		overflow: hidden;
		transition: width var(--transition-normal), min-width var(--transition-normal), transform var(--transition-normal);
		z-index: var(--z-modal);
	}

	.app-sidebar[data-collapsed='true'] {
		width: var(--app-sidebar-collapsed-width);
		min-width: var(--app-sidebar-collapsed-width);
	}

	.sidebar-header,
	.sidebar-footer {
		display: flex;
		flex-direction: column;
		gap: var(--gap-sm);
		padding: var(--pad-sm);
	}

	.sidebar-footer {
		border-top: var(--border-width) solid var(--color-border);
	}

	.sidebar-nav {
		min-height: 0;
		flex: 1;
		padding: var(--pad-sm);
		overflow-y: auto;
	}

	.sidebar-action,
	.sidebar-chat-link {
		display: flex;
		width: 100%;
		min-width: 0;
		align-items: center;
		gap: var(--gap-sm);
		padding: var(--pad-sm);
		border: 0;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-text);
		text-align: left;
		text-decoration: none;
		cursor: pointer;
	}

	.sidebar-action:hover,
	.sidebar-chat-link:hover,
	.sidebar-chat-link[aria-current='page'] {
		background: var(--color-surface-hover);
	}

	@media (width < 48rem) {
		.app-sidebar {
			position: fixed;
			top: 0;
			left: 0;
			height: calc(100dvh - (2 * var(--pad-sm)));
			transform: translateX(calc(-100% - var(--marg-sm)));
		}

		.app-sidebar[data-open='true'] {
			transform: translateX(0);
		}
	}
</style>
