<script lang="ts">
    import { userState } from '$lib/state/user.svelte';
    import { t } from '$lib/state/i18n.svelte';
    import { goto } from '$app/navigation';
    import Icon from '@iconify/svelte';

    let password = $state('');
    let error = $state('');

    function handleLogin() {
        if (password === userState.password) {
            userState.isAuthenticated = true; // Simple session flag
            goto('/chat');
        } else {
            error = 'Invalid password';
        }
    }
</script>

<div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
    <div class="card w-full max-w-sm bg-base-100 shadow-xl">
        <div class="card-body items-center text-center">
            <div class="avatar placeholder mb-4">
                <div class="bg-neutral text-neutral-content rounded-full w-24">
                    <span class="text-3xl">{userState.nickname.charAt(0).toUpperCase()}</span>
                </div>
            </div>
            
            <h2 class="card-title text-2xl mb-1">Welcome back, {userState.nickname}</h2>
            <p class="text-base-content/70 mb-6">Please enter your password to continue</p>

            <div class="form-control w-full">
                <input 
                    type="password" 
                    placeholder="Password" 
                    class="input input-bordered w-full text-center" 
                    bind:value={password}
                    onkeydown={(e) => e.key === 'Enter' && handleLogin()}
                />
            </div>

            {#if error}
                <div class="text-error text-sm mt-2">{error}</div>
            {/if}

            <button class="btn btn-primary w-full mt-6" onclick={handleLogin}>
                Unlock
                <Icon icon="lucide:unlock" class="w-4 h-4 ml-2" />
            </button>
            
            <div class="divider my-4"></div>
            
            <button class="btn btn-ghost btn-sm text-xs" onclick={() => {
                // Reset logic could go here
                if(confirm('Reset all data?')) {
                    localStorage.clear();
                    location.reload();
                }
            }}>
                Forgot password? (Reset App)
            </button>
        </div>
    </div>
</div>
