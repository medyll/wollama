<script lang="ts">
    import { userState } from '$lib/state/user.svelte';
    import { downloadState } from '$lib/state/downloads.svelte';
    import { t } from '$lib/state/i18n.svelte';
    import { toast } from '$lib/state/notifications.svelte';
    import LanguageSelector from '$components/ui/LanguageSelector.svelte';
    import { goto } from '$app/navigation';
    import Icon from '@iconify/svelte';
    import { GenericService } from '$lib/services/generic.service';
    import { destroyDatabase } from '$lib/db';
    import type { Companion } from '$types/data';

    let localServerUrl = $state(userState.preferences.serverUrl);
    let isVerifying = $state(false);
    let installedModels = $state<any[]>([]);
    let companions = $state<Companion[]>([]);
    let isLoadingModels = $state(false);
    let newModelName = $state('');
    let activeSection = $state<string | null>('profile');

    const themes = [
        "light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave", "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua", "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula"
    ];

    async function loadCompanions() {
        try {
            const service = new GenericService<Companion>('companions');
            companions = await service.getAll();
        } catch (e) {
            console.error('Failed to load companions', e);
        }
    }

    async function deleteAccount() {
        if (!confirm(t('settings.delete_confirm') || 'Are you sure you want to delete your account and all data? This action cannot be undone.')) {
            return;
        }
        
        try {
            await destroyDatabase();
            userState.reset();
            toast.success(t('settings.delete_success') || 'Account deleted successfully');
            goto('/');
        } catch (e) {
            console.error('Failed to delete account', e);
            toast.error(t('settings.delete_error') || 'Failed to delete account');
        }
    }

    async function verifyHost() {
        isVerifying = true;
        const urlToCheck = localServerUrl.replace(/\/$/, '');
        
        try {
            const res = await fetch(`${urlToCheck}/api/health`);
            if (res.ok) {
                userState.preferences.serverUrl = localServerUrl;
                userState.save();
                toast.success(t('settings.server_verified'));
                loadModels();
            } else {
                throw new Error('Status not OK');
            }
        } catch (e) {
            toast.error(t('settings.server_error'));
        } finally {
            isVerifying = false;
        }
    }

    async function loadModels() {
        isLoadingModels = true;
        try {
            const serverUrl = userState.preferences.serverUrl.replace(/\/$/, '');
            const res = await fetch(`${serverUrl}/api/models`);
            if (res.ok) {
                const data = await res.json();
                installedModels = data.models || [];
            }
        } catch (e) {
            console.error('Failed to load models', e);
        } finally {
            isLoadingModels = false;
        }
    }

    async function pullModel() {
        if (!newModelName.trim()) return;
        await downloadState.pullModel(newModelName);
        newModelName = '';
        loadModels();
    }

    $effect(() => {
        // Auto-save when these properties change
        userState.nickname;
        userState.preferences.theme;
        userState.preferences.locale;
        userState.preferences.defaultModel;
        userState.preferences.defaultCompanion;
        userState.preferences.defaultTemperature;
        userState.preferences.auto_play_audio;
        
        userState.save();
    });

    $effect(() => {
        loadModels();
        loadCompanions();
    });
</script>

<div class="h-full overflow-y-auto bg-base-200 p-4 md:p-8">
    <div class="max-w-3xl mx-auto">
        <div class="flex items-center justify-between mb-8">
            <button class="btn btn-ghost btn-circle" onclick={() => goto('/')} aria-label="Back">
                <Icon icon="lucide:arrow-left" class="w-6 h-6" />
            </button>
            <div class="text-center flex-1">
                <h1 class="text-4xl font-bold">{t('ui.settings')}</h1>
                <p class="py-2 opacity-70">{t('settings.subtitle')}</p>
            </div>
            <div class="w-12"></div> <!-- Spacer for centering -->
        </div>

        <div class="join join-vertical w-full bg-base-100 shadow-xl">
            <!-- User Profile -->
            <div class="collapse collapse-arrow join-item border-base-300 border">
                <input type="checkbox" checked={activeSection === 'profile'} onchange={() => activeSection = activeSection === 'profile' ? null : 'profile'} />
                <div class="collapse-title text-lg font-medium">
                    {t('ui.userProfile')}
                </div>
                <div class="collapse-content">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <div class="form-control flex-row items-center justify-between gap-4">
                            <label class="label whitespace-nowrap" for="nickname">
                                <span class="label-text">{t('settings.nickname')}</span>
                            </label>
                            <input 
                                type="text" 
                                id="nickname"
                                placeholder={t('settings.nickname_placeholder')} 
                                class="input input-bordered w-full max-w-xs" 
                                bind:value={userState.nickname} 
                            />
                        </div>
                        
                        <div class="form-control flex-row items-center justify-between gap-4">
                            <label class="label whitespace-nowrap" for="lang">
                                <span class="label-text">{t('settings.lang')}</span>
                            </label>
                            <div class="flex items-center h-12 w-full max-w-xs">
                                <LanguageSelector />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Interface -->
            <div class="collapse collapse-arrow join-item border-base-300 border">
                <input type="checkbox" checked={activeSection === 'interface'} onchange={() => activeSection = activeSection === 'interface' ? null : 'interface'} />
                <div class="collapse-title text-lg font-medium">
                    {t('settings.interface')}
                </div>
                <div class="collapse-content">
                    <div class="form-control pt-4">
                        <label class="label" for="theme">
                            <span class="label-text">{t('settings.theme')}</span>
                        </label>
                        <div class="grid grid-cols-3 md:grid-cols-5 gap-2">
                            {#each themes as theme}
                                <button 
                                    class="btn h-auto flex flex-col gap-1 p-2 border-2 rounded-xl {userState.preferences.theme === theme ? 'border-primary' : 'border-base-content/10'}"
                                    onclick={() => userState.preferences.theme = theme}
                                    data-theme={theme}
                                >
                                    <div class="w-full h-4 rounded bg-base-100 border border-base-content/10"></div>
                                    <div class="w-full h-4 rounded bg-primary"></div>
                                    <div class="w-full h-4 rounded bg-secondary"></div>
                                    <span class="text-[10px] font-bold capitalize">{theme}</span>
                                </button>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>

            <!-- AI Configuration -->
            <div class="collapse collapse-arrow join-item border-base-300 border">
                <input type="checkbox" checked={activeSection === 'ai'} onchange={() => activeSection = activeSection === 'ai' ? null : 'ai'} />
                <div class="collapse-title text-lg font-medium">
                    {t('settings.ai')}
                </div>
                <div class="collapse-content">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <div class="form-control flex-row items-center justify-between gap-4">
                            <label class="label whitespace-nowrap" for="model">
                                <span class="label-text">{t('settings.default_model')}</span>
                            </label>
                            <div class="flex flex-col w-full max-w-xs">
                                <select id="model" class="select select-bordered w-full" bind:value={userState.preferences.defaultModel}>
                                    {#if isLoadingModels}
                                        <option disabled>Loading...</option>
                                    {:else}
                                        {#each installedModels as model}
                                            <option value={model.name}>{model.name}</option>
                                        {/each}
                                        <!-- Fallback if list is empty or current model not in list -->
                                        {#if !installedModels.find(m => m.name === userState.preferences.defaultModel)}
                                            <option value={userState.preferences.defaultModel}>{userState.preferences.defaultModel}</option>
                                        {/if}
                                    {/if}
                                </select>
                                <div class="label pb-0">
                                    <span class="label-text-alt">{t('settings.model_help')}</span>
                                </div>
                            </div>
                        </div>

                        <div class="form-control flex-row items-center justify-between gap-4">
                            <label class="label whitespace-nowrap" for="companion">
                                <span class="label-text">{t('ui.choose_companion')}</span>
                            </label>
                            <select id="companion" class="select select-bordered w-full max-w-xs" bind:value={userState.preferences.defaultCompanion}>
                                {#each companions as companion}
                                    <option value={companion.companion_id}>{companion.name}</option>
                                {/each}
                                {#if !companions.find(c => c.companion_id === userState.preferences.defaultCompanion)}
                                    <option value={userState.preferences.defaultCompanion}>Default</option>
                                {/if}
                            </select>
                        </div>

                        <div class="form-control flex-row items-center justify-between gap-4 md:col-span-2">
                            <label class="label whitespace-nowrap" for="temp">
                                <span class="label-text">{t('settings.temperature')} ({userState.preferences.defaultTemperature})</span>
                            </label>
                            <div class="w-full max-w-xs">
                                <input 
                                    type="range" 
                                    id="temp"
                                    min="0" 
                                    max="1" 
                                    step="0.1" 
                                    class="range range-primary" 
                                    bind:value={userState.preferences.defaultTemperature} 
                                />
                                <div class="w-full flex justify-between text-xs px-2">
                                    <span>{t('settings.precise')}</span>
                                    <span>{t('settings.creative')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Model Management -->
                    <div class="divider">Model Management</div>
                    <div class="form-control">
                        <label class="label" for="new-model">
                            <span class="label-text">Download New Model (Ollama)</span>
                        </label>
                        <div class="join w-full">
                            <input 
                                type="text" 
                                id="new-model"
                                placeholder="e.g. llama3, mistral, gemma" 
                                class="input input-bordered join-item w-full" 
                                bind:value={newModelName} 
                                disabled={downloadState.isPulling}
                            />
                            <button 
                                class="btn btn-primary join-item" 
                                onclick={pullModel}
                                disabled={downloadState.isPulling || !newModelName}
                            >
                                {#if downloadState.isPulling}
                                    <span class="loading loading-spinner loading-sm"></span>
                                {:else}
                                    <Icon icon="lucide:download" class="w-4 h-4" />
                                {/if}
                                Download
                            </button>
                        </div>
                        {#if downloadState.isPulling}
                            <div class="mt-4 space-y-2">
                                <div class="flex justify-between text-xs">
                                    <span>{downloadState.status}</span>
                                    <span>{downloadState.progress}%</span>
                                </div>
                                <progress class="progress progress-primary w-full" value={downloadState.progress} max="100"></progress>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Server Configuration -->
            <div class="collapse collapse-arrow join-item border-base-300 border">
                <input type="checkbox" checked={activeSection === 'server'} onchange={() => activeSection = activeSection === 'server' ? null : 'server'} />
                <div class="collapse-title text-lg font-medium">
                    {t('settings.server_connection')}
                </div>
                <div class="collapse-content">
                    <div class="form-control pt-4">
                        <label class="label" for="server">
                            <span class="label-text">{t('settings.server_host')}</span>
                        </label>
                        <div class="join w-full">
                            <input 
                                type="text" 
                                id="server"
                                placeholder="http://localhost:3000" 
                                class="input input-bordered join-item w-full font-mono" 
                                bind:value={localServerUrl} 
                            />
                            <button 
                                class="btn btn-primary join-item" 
                                onclick={verifyHost}
                                disabled={isVerifying}
                            >
                                {#if isVerifying}
                                    <span class="loading loading-spinner loading-sm"></span>
                                {:else}
                                    {t('settings.verify')}
                                {/if}
                            </button>
                        </div>
                        <div class="label">
                            <span class="label-text-alt">{t('settings.server_help')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Danger Zone -->
            <div class="collapse collapse-arrow join-item border-base-300 border border-error/20">
                <input type="checkbox" checked={activeSection === 'danger'} onchange={() => activeSection = activeSection === 'danger' ? null : 'danger'} />
                <div class="collapse-title text-lg font-medium text-error">
                    {t('settings.danger_zone') || 'Danger Zone'}
                </div>
                <div class="collapse-content">
                    <div class="pt-4">
                        <p class="text-sm mb-4 opacity-70">
                            {t('settings.delete_warning') || 'Deleting your account will remove all your data, including chats, companions, and settings. This action cannot be undone.'}
                        </p>
                        <button class="btn btn-error btn-outline w-full md:w-auto" onclick={deleteAccount}>
                            <Icon icon="lucide:trash-2" class="w-4 h-4 mr-2" />
                            {t('settings.delete_account') || 'Delete Account & Data'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
