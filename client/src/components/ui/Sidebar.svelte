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
	class="bg-base-300 border-base-content/10 flex h-full flex-col border-r transition-all duration-300 {uiState.sidebarOpen
		? uiState.sidebarCollapsed
			? 'w-20'
			: 'w-64'
		: 'w-0 overflow-hidden'}"
	aria-label="Sidebar"
>
	<div class="flex flex-col gap-2 p-2">
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
				<button class="btn btn-ghost btn-square btn-sm" aria-label="Search" onclick={() => goto('/search')}>
					<Icon icon="lucide:search" class="h-5 w-5" />
				</button>
			{/if}
		</div>
		{#if uiState.sidebarCollapsed}
			<button class="btn btn-ghost btn-square btn-sm mx-auto" aria-label="Search" onclick={() => goto('/search')}>
				<Icon icon="lucide:search" class="h-5 w-5" />
			</button>
		{/if}

		<button
			class="btn btn-ghost btn-block {uiState.sidebarCollapsed ? 'px-0' : 'justify-start'}"
			onclick={createNewChat}
			title={t('ui.newChat')}
		>
			<Icon icon="lucide:square-pen" class="h-5 w-5 {uiState.sidebarCollapsed ? '' : 'mr-2'}" />
			{#if !uiState.sidebarCollapsed}
				{t('ui.newChat')}
			{/if}
		</button>
	</div>

	<nav id="sidebar-nav" class="flex-1 space-y-2 overflow-y-auto p-2" aria-label={t('ui.myChats')}>
		{#if !uiState.sidebarCollapsed}
			{#each chats as chat}
				<a
					href="/chat/{chat.chat_id}"
					class="btn btn-ghost btn-block no-animation justify-start font-normal {$page.url.pathname.includes(
						chat.chat_id
					)
						? 'btn-active'
						: ''}"
					title={chat.title}
				>
					<Icon icon="lucide:message-square" class="mr-2 h-5 w-5 opacity-70" />
					<span class="truncate">{chat.title}</span>
				</a>
			{/each}
		{/if}
	</nav>

	<div class="  flex flex-col gap-2 p-4">
		
		<div class="px-2 flex justify-end">
			<SidebarCollapse />
		</div>
		<button
			class="btn btn-ghost btn-block {uiState.sidebarCollapsed ? 'px-0' : 'justify-start'}"
			onclick={() => goto('/settings')}
			title={t('ui.settings')}
		>
			<Icon icon="lucide:settings" class="h-5 w-5 {uiState.sidebarCollapsed ? '' : 'mr-2'}" />
			{#if !uiState.sidebarCollapsed}
				{t('ui.settings')}
			{/if}
		</button>
	</div>
</aside>
