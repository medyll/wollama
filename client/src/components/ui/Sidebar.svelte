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
	aria-label="Primary navigation"
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

		<button type="button" class="sidebar-action sidebar-new-chat" onclick={createNewChat} title={t('ui.newChat')}>
			<Icon icon="fluent:compose-24-regular" class="h-5 w-5" aria-hidden="true" />
			{#if !uiState.sidebarCollapsed}
				{t('ui.newChat')}
			{/if}
		</button>
	</div>

	<nav id="sidebar-nav" class="sidebar-nav" aria-label={t('ui.myChats')} data-testid="chat-list">
		{#if !uiState.sidebarCollapsed}
			<p class="sidebar-section-label">{t('ui.myChats')}</p>
			{#if chats.length === 0}
				<p class="sidebar-empty">{t('ui.noChats')}</p>
			{:else}
				{#each chats as chat}
					<a
						href="/chat/{chat.chat_id}"
						class="sidebar-chat-link"
						aria-current={$page.url.pathname.includes(chat.chat_id) ? 'page' : undefined}
						title={chat.title}
						data-testid="chat-list-item"
					>
						<Icon icon="fluent:chat-24-regular" class="h-5 w-5" aria-hidden="true" />
						<span class="truncate">{chat.title}</span>
					</a>
				{/each}
			{/if}
		{/if}
	</nav>

	<div class="sidebar-footer">
		<div class="flex justify-end px-2">
			<SidebarCollapse />
		</div>
		<button type="button" class="sidebar-action" onclick={() => goto('/settings')} title={t('ui.settings')}>
			<Icon icon="fluent:settings-24-regular" class="h-5 w-5" aria-hidden="true" />
			{#if !uiState.sidebarCollapsed}
				{t('ui.settings')}
			{/if}
		</button>
	</div>
</aside>

<style>
	@layer components {
		.app-sidebar {
			display: flex;
			width: var(--app-sidebar-width);
			min-width: var(--app-sidebar-width);
			height: 100dvh;
			flex-direction: column;
			border-right: var(--border-width) solid var(--wollama-border-subtle);
			background: var(--wollama-sidebar-bg);
			overflow: hidden;
			transition:
				width var(--transition-normal),
				min-width var(--transition-normal),
				transform var(--transition-normal);
			z-index: var(--z-dropdown);
		}

		.app-sidebar[data-collapsed='true'] {
			width: var(--app-sidebar-collapsed-width);
			min-width: var(--app-sidebar-collapsed-width);
		}

		.sidebar-header,
		.sidebar-footer {
			display: flex;
			flex-direction: column;
			gap: var(--gap-xs);
			padding: var(--pad-sm);
		}

		.sidebar-footer {
			border-top: var(--border-width) solid var(--wollama-border-subtle);
		}

		.sidebar-nav {
			min-height: 0;
			flex: 1;
			padding: var(--pad-md) var(--pad-sm);
			overflow-y: auto;
			scrollbar-gutter: stable;
		}

		.sidebar-section-label {
			margin: 0 0 var(--gap-sm);
			padding-inline: var(--pad-sm);
			color: var(--color-text-muted);
			font-size: var(--text-xs);
			font-weight: var(--font-semibold);
			letter-spacing: var(--tracking-wide);
			text-transform: uppercase;
		}

		.sidebar-empty {
			margin: 0;
			padding: var(--pad-md) var(--pad-sm);
			color: var(--color-text-muted);
			font-size: var(--text-sm);
			line-height: var(--leading-relaxed);
		}

		.sidebar-action,
		.sidebar-chat-link {
			display: flex;
			width: 100%;
			min-width: 0;
			align-items: center;
			gap: var(--gap-sm);
			min-height: var(--icon-size-lg);
			padding: var(--pad-sm);
			border: 0;
			border-radius: var(--radius-md);
			background: transparent;
			color: var(--color-text);
			font-size: var(--text-sm);
			font-weight: var(--font-normal);
			text-align: left;
			text-decoration: none;
			cursor: pointer;
			transition:
				background var(--transition-fast),
				color var(--transition-fast);
		}

		.sidebar-action :global(svg),
		.sidebar-chat-link :global(svg) {
			flex: none;
			color: var(--color-text-muted);
		}

		.sidebar-new-chat {
			background: var(--color-primary);
			color: var(--color-on-primary);
			font-weight: var(--font-semibold);
			box-shadow: var(--shadow-sm);
		}

		.sidebar-new-chat :global(svg) {
			color: currentColor;
		}

		.sidebar-action:hover,
		.sidebar-chat-link:hover {
			background: var(--color-surface-hover);
		}

		.sidebar-new-chat:hover {
			background: var(--color-primary-hover);
		}

		.sidebar-chat-link[aria-current='page'] {
			background: var(--wollama-active-bg);
			color: var(--color-primary);
			font-weight: var(--font-medium);
		}

		.sidebar-action:focus-visible,
		.sidebar-chat-link:focus-visible {
			outline: var(--focus-ring-width) solid var(--wollama-focus-ring);
			outline-offset: calc(var(--focus-ring-gap) * -1);
		}

		@media (width < 48rem) {
			.app-sidebar {
				position: fixed;
				top: 0;
				left: 0;
				height: 100dvh;
				border-right: var(--border-width) solid var(--wollama-border-subtle);
				box-shadow: var(--shadow-lg);
				transform: translateX(-100%);
				z-index: var(--z-modal);
			}

			.app-sidebar[data-open='true'] {
				transform: translateX(0);
			}
		}
	}
</style>
