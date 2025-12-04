<script lang="ts">
	import { t } from '$lib/state/i18n.svelte';
	import { userState } from '$lib/state/user.svelte';
	import { authService } from '$lib/auth';
	import { chatService } from '$lib/services/chat.service';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';

	let { isOpen = $bindable(true) } = $props();
	let isSigningIn = $state(false);
	let isCollapsed = $state(false);
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

	async function handleSignIn() {
		isSigningIn = true;
		try {
			await authService.signInWithGoogle();
		} catch (e) {
			console.error(e);
		} finally {
			isSigningIn = false;
		}
	}

	async function createNewChat() {
		console.log('Button clicked: createNewChat');
		goto('/chat/new');
	}
</script>

<aside
	class="bg-base-300 border-base-content/10 flex h-full flex-col border-r transition-all duration-300 {isOpen
		? isCollapsed
			? 'w-20'
			: 'w-64'
		: 'w-0 overflow-hidden'}"
>
	<div class="p-2">
		<button
			class="btn btn-ghost btn-block {isCollapsed ? 'px-0' : 'justify-start'}"
			onclick={createNewChat}
			title={t('ui.newChat')}
		>
			<Icon icon="lucide:square-pen" class="h-5 w-5 {isCollapsed ? '' : 'mr-2'}" />
			{#if !isCollapsed}
				{t('ui.newChat')}
			{/if}
		</button>
	</div>

	<div class="flex-1 space-y-2 overflow-y-auto p-2">
		{#if !isCollapsed}
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
	</div>

	<div class="  flex flex-col gap-2 p-4">
		{#if !userState.isAuthenticated}
			<button
				class="btn btn-primary btn-block btn-sm {isCollapsed ? 'px-0' : ''}"
				onclick={handleSignIn}
				disabled={isSigningIn}
				title={t('ui.signIn')}
			>
				{#if isSigningIn}
					<span class="loading loading-spinner loading-xs"></span>
				{:else}
					<Icon icon="lucide:log-in" class="h-4 w-4 {isCollapsed ? '' : 'mr-2'}" />
					{#if !isCollapsed}
						{t('ui.signIn')}
					{/if}
				{/if}
			</button>
		{:else}
			<div class="flex items-center gap-2 {isCollapsed ? 'justify-center' : 'bg-base-200 rounded-lg px-2 py-1'}">
				{#if userState.photoURL}
					<img src={userState.photoURL} alt="Avatar" class="h-8 w-8 rounded-full" />
				{:else}
					<div
						class="bg-primary text-primary-content flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold"
					>
						{userState.nickname ? userState.nickname[0].toUpperCase() : 'U'}
					</div>
				{/if}
				{#if !isCollapsed}
					<div class="min-w-0 flex-1">
						<p class="truncate text-xs font-bold">{userState.nickname || 'User'}</p>
						<p class="truncate text-[10px] opacity-70">Sync ON</p>
					</div>
				{/if}
			</div>
		{/if}

		<button class="btn btn-ghost btn-block {isCollapsed ? 'px-0' : 'justify-start'}" onclick={() => (isCollapsed = !isCollapsed)} aria-label="Toggle Sidebar">
			<Icon icon={isCollapsed ? 'lucide:chevrons-right' : 'lucide:chevrons-left'}  class="h-5 w-5 {isCollapsed ? '' : 'mr-2'}"  />
            {#if !isCollapsed}
				{t('ui.expand')}
			{/if}
		</button>

		<button
			class="btn btn-ghost btn-block {isCollapsed ? 'px-0' : 'justify-start'}"
			onclick={() => goto('/settings')}
			title={t('ui.settings')}
		>
			<Icon icon="lucide:settings" class="h-5 w-5 {isCollapsed ? '' : 'mr-2'}" />
			{#if !isCollapsed}
				{t('ui.settings')}
			{/if}
		</button>
	</div>
</aside>
