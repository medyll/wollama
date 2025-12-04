<script lang="ts">
	import { t } from '$lib/state/i18n.svelte';
    import { uiState } from '$lib/state/ui.svelte';
	import { chatService } from '$lib/services/chat.service';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';

	let { isOpen = $bindable(true) } = $props();
	let chats = $state<any[]>([]);

	$effect(() => {
		let subscription: any;

		const init = async () => {
			try {
				console.log('Sidebar: Loading chats...');
				const obs = await chatService.getChats();
				subscription = obs.subscribe((data: any[]) => {
					console.log('Sidebar: Chats received:', data);
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
		console.log('Button clicked: createNewChat');
		goto('/chat/new');
	}
</script>

<aside
	class="bg-base-300 border-base-content/10 flex h-full flex-col border-r transition-all duration-300 {isOpen
		? uiState.sidebarCollapsed
			? 'w-20'
			: 'w-64'
		: 'w-0 overflow-hidden'}"
    aria-label="Sidebar"
>
	<div class="flex flex-col gap-2 p-2">
        <!-- Section: Desktop Navicon (Collapse Toggle) & Search -->
        <div class="hidden md:flex items-center space-y-2 p-2 {uiState.sidebarCollapsed ? 'justify-center' : 'justify-end'}">
            <button class="btn btn-ghost btn-square" aria-label="Search" onclick={() => goto('/search')}>
                <Icon icon="lucide:search" class="h-5 w-5" />
            </button>
        </div>

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

	<nav 
        id="sidebar-nav"
        class="flex-1 space-y-2 overflow-y-auto p-2" 
        aria-label={t('ui.myChats')}
    >
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
