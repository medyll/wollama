<script lang="ts">
    import { t } from '$lib/state/i18n.svelte';
    import { userState } from '$lib/state/user.svelte';
    import { authService } from '$lib/auth';
    
    let { isOpen = $bindable(true) } = $props();
    let isSigningIn = $state(false);

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
</script>

<aside class="bg-base-300 h-full transition-all duration-300 flex flex-col border-r border-base-content/10 {isOpen ? 'w-64' : 'w-0 overflow-hidden'}">
    <div class="p-4 border-b border-base-content/10 flex items-center justify-between">
        <span class="font-bold text-xl truncate">{t('ui.myChats')}</span>
    </div>
    
    <div class="flex-1 overflow-y-auto p-2 space-y-2">
        <!-- Mock List -->
        <a href="/chat/1" class="btn btn-ghost btn-block justify-start no-animation font-normal">
            Discussion 1
        </a>
        <a href="/chat/2" class="btn btn-ghost btn-block justify-start no-animation font-normal">
            Discussion 2
        </a>
    </div>

    <div class="p-4 border-t border-base-content/10 flex flex-col gap-2">
        {#if !userState.isAuthenticated}
            <button class="btn btn-primary btn-block btn-sm" onclick={handleSignIn} disabled={isSigningIn}>
                {#if isSigningIn}
                    <span class="loading loading-spinner loading-xs"></span>
                {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                    {t('ui.signIn')}
                {/if}
            </button>
        {:else}
            <div class="flex items-center gap-2 px-2 py-1 bg-base-200 rounded-lg">
                {#if userState.photoURL}
                    <img src={userState.photoURL} alt="Avatar" class="w-8 h-8 rounded-full" />
                {:else}
                    <div class="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold">
                        {userState.nickname ? userState.nickname[0].toUpperCase() : 'U'}
                    </div>
                {/if}
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold truncate">{userState.nickname || 'User'}</p>
                    <p class="text-[10px] opacity-70 truncate">Sync ON</p>
                </div>
            </div>
        {/if}

        <a href="/chat/new" class="btn btn-outline btn-block btn-sm">
            + {t('ui.newChat')}
        </a>
    </div>
</aside>
