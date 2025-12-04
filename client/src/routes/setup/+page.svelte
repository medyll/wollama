<script lang="ts">
    import { userState } from '$lib/state/user.svelte';
    import { t } from '$lib/state/i18n.svelte';
    import { goto } from '$app/navigation';
    import Icon from '@iconify/svelte';

    let activeTab = $state<'manual' | 'oauth'>('manual');
    let nickname = $state('');
    let isSharedMachine = $state(false);
    let password = $state('');
    let email = $state('');
    let error = $state('');

    function handleManualSetup() {
        if (!nickname.trim()) {
            error = t('setup.error_nickname_required') || 'Nickname is required';
            return;
        }

        if (isSharedMachine && !password.trim()) {
            error = t('setup.error_password_required') || 'Password is required for shared machines';
            return;
        }

        userState.nickname = nickname;
        if (isSharedMachine) {
            userState.setLocalProtection(password);
            userState.email = email;
        }
        
        userState.save();
        goto('/chat');
    }

    function handleOAuth(provider: string) {
        // Mock implementation for now
        // In a real app, this would trigger a redirect or popup
        const mockProfile = {
            uid: 'mock-uid-123',
            email: `user@${provider}.com`,
            photoURL: null,
            token: 'mock-token'
        };
        
        userState.nickname = `User from ${provider}`;
        userState.setAuth(mockProfile);
        goto('/chat');
    }
</script>

<div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
    <!-- Section: Setup Card -->
    <div class="card w-full max-w-md bg-base-100 shadow-xl">
        <div class="card-body">
            <div class="flex justify-between items-center mb-4">
                <h2 class="card-title text-2xl font-bold">Welcome to Wollama</h2>
            </div>
            
            <p class="text-base-content/70 mb-6">
                {t('setup.welcome_message') || 'Please set up your profile to get started.'}
            </p>

            <!-- Section: Tabs -->
            <div role="tablist" class="tabs tabs-boxed mb-6">
                <button 
                    role="tab" 
                    class="tab {activeTab === 'manual' ? 'tab-active' : ''}"
                    onclick={() => activeTab = 'manual'}
                    aria-selected={activeTab === 'manual'}
                >
                    Manual Setup
                </button>
                <button 
                    role="tab" 
                    class="tab {activeTab === 'oauth' ? 'tab-active' : ''}"
                    onclick={() => activeTab = 'oauth'}
                    aria-selected={activeTab === 'oauth'}
                >
                    Connect Account
                </button>
            </div>

            {#if activeTab === 'manual'}
                <!-- Section: Manual Form -->
                <div class="space-y-4">
                    <div class="form-control">
                        <label class="label" for="nickname">
                            <span class="label-text">Nickname</span>
                        </label>
                        <input 
                            type="text" 
                            id="nickname"
                            placeholder="How should we call you?" 
                            class="input input-bordered w-full" 
                            bind:value={nickname}
                        />
                    </div>

                    <div class="form-control">
                        <label class="label cursor-pointer justify-start gap-4">
                            <input type="checkbox" class="checkbox checkbox-primary" bind:checked={isSharedMachine} />
                            <span class="label-text">This is a shared machine (Secure my profile)</span>
                        </label>
                    </div>

                    {#if isSharedMachine}
                        <div class="form-control">
                            <label class="label" for="password">
                                <span class="label-text">Password / PIN</span>
                            </label>
                            <input 
                                type="password" 
                                id="password"
                                placeholder="Enter a secure password" 
                                class="input input-bordered w-full" 
                                bind:value={password}
                            />
                        </div>
                        <div class="form-control">
                            <label class="label" for="email">
                                <span class="label-text">Email (Optional)</span>
                            </label>
                            <input 
                                type="email" 
                                id="email"
                                placeholder="For recovery" 
                                class="input input-bordered w-full" 
                                bind:value={email}
                            />
                        </div>
                    {/if}

                    {#if error}
                        <div class="alert alert-error text-sm py-2">
                            <Icon icon="lucide:alert-circle" class="w-4 h-4" />
                            <span>{error}</span>
                        </div>
                    {/if}

                    <button class="btn btn-primary w-full mt-4" onclick={handleManualSetup}>
                        Get Started
                        <Icon icon="lucide:arrow-right" class="w-4 h-4 ml-2" />
                    </button>
                </div>
            {:else}
                <div class="space-y-4 py-4">
                    <button class="btn btn-outline w-full gap-2" onclick={() => handleOAuth('Google')}>
                        <Icon icon="logos:google-icon" class="w-5 h-5" />
                        Continue with Google
                    </button>
                    <button class="btn btn-outline w-full gap-2" onclick={() => handleOAuth('GitHub')}>
                        <Icon icon="logos:github-icon" class="w-5 h-5" />
                        Continue with GitHub
                    </button>
                    <div class="divider">OR</div>
                    <button class="btn btn-outline w-full gap-2" onclick={() => handleOAuth('Microsoft')}>
                        <Icon icon="logos:microsoft-icon" class="w-5 h-5" />
                        Continue with Microsoft
                    </button>
                </div>
            {/if}
        </div>
    </div>
</div>
