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
        try {
            const chatId = await chatService.createChat();
            console.log('Chat created, navigating to:', chatId);
            goto(`/chat/${chatId}`);
        } catch (e) {
            console.error('Failed to create chat:', e);
        }
    }
</script>

<aside class="bg-base-300 h-full transition-all duration-300 flex flex-col border-r border-base-content/10 {isOpen ? (isCollapsed ? 'w-20' : 'w-64') : 'w-0 overflow-hidden'}">
    <div class="p-2 border-b border-base-content/10">
        <button class="btn btn-ghost btn-block {isCollapsed ? 'px-0' : 'justify-start'}" onclick={createNewChat} title={t('ui.newChat')}>
            <Icon icon="lucide:square-pen" class="w-5 h-5 {isCollapsed ? '' : 'mr-2'}" />
            {#if !isCollapsed}
                {t('ui.newChat')}
            {/if}
        </button>
    </div>
    
    <div class="flex-1 overflow-y-auto p-2 space-y-2">
        {#if !isCollapsed}
            {#each chats as chat}
                <a 
                    href="/chat/{chat.chat_id}" 
                    class="btn btn-ghost btn-block justify-start no-animation font-normal {$page.url.pathname.includes(chat.chat_id) ? 'btn-active' : ''}"
                    title={chat.title}
                >
                    <Icon icon="lucide:message-square" class="w-5 h-5 mr-2 opacity-70" />
                    <span class="truncate">{chat.title}</span>
                </a>
            {/each}
        {/if}
    </div>

    <div class="p-4 border-t border-base-content/10 flex flex-col gap-2">
        {#if !userState.isAuthenticated}
            <button class="btn btn-primary btn-block btn-sm {isCollapsed ? 'px-0' : ''}" onclick={handleSignIn} disabled={isSigningIn} title={t('ui.signIn')}>
                {#if isSigningIn}
                    <span class="loading loading-spinner loading-xs"></span>
                {:else}
                    <Icon icon="lucide:log-in" class="w-4 h-4 {isCollapsed ? '' : 'mr-2'}" />
                    {#if !isCollapsed}
                        {t('ui.signIn')}
                    {/if}
                {/if}
            </button>
        {:else}
            <div class="flex items-center gap-2 {isCollapsed ? 'justify-center' : 'px-2 py-1 bg-base-200 rounded-lg'}">
                {#if userState.photoURL}
                    <img src={userState.photoURL} alt="Avatar" class="w-8 h-8 rounded-full" />
                {:else}
                    <div class="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold shrink-0">
                        {userState.nickname ? userState.nickname[0].toUpperCase() : 'U'}
                    </div>
                {/if}
                {#if !isCollapsed}
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-bold truncate">{userState.nickname || 'User'}</p>
                        <p class="text-[10px] opacity-70 truncate">Sync ON</p>
                    </div>
                {/if}
            </div>
        {/if}

        <button class="btn btn-ghost btn-xs w-full mt-2" onclick={() => isCollapsed = !isCollapsed} aria-label="Toggle Sidebar">
            <Icon icon={isCollapsed ? "lucide:chevrons-right" : "lucide:chevrons-left"} class="w-4 h-4" />
        </button>
    </div>
</aside>
