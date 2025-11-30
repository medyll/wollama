<script lang="ts">
    import { userState } from '$lib/state/user.svelte';
    import { t } from '$lib/state/i18n.svelte';
    import { goto } from '$app/navigation';
    import LanguageSelector from '$components/ui/LanguageSelector.svelte';

    function onSave() {
        userState.save();
        goto('/chat');
    }
</script>

<div class="min-h-screen bg-base-200 p-4 md:p-8">
    <div class="max-w-3xl mx-auto">
        <div class="text-center mb-8">
            <h1 class="text-4xl font-bold">{t('ui.settings')}</h1>
            <p class="py-2 opacity-70">{t('settings.subtitle')}</p>
        </div>

        <div class="grid gap-6">
            <!-- User Profile -->
            <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                    <h2 class="card-title border-b pb-2 mb-4">{t('ui.userProfile')}</h2>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="form-control">
                            <label class="label" for="nickname">
                                <span class="label-text">{t('settings.nickname')}</span>
                            </label>
                            <input 
                                type="text" 
                                id="nickname"
                                placeholder={t('settings.nickname_placeholder')} 
                                class="input input-bordered w-full" 
                                bind:value={userState.nickname} 
                            />
                        </div>
                        
                        <div class="form-control">
                            <label class="label" for="lang">
                                <span class="label-text">{t('settings.lang')}</span>
                            </label>
                            <div class="flex items-center h-12">
                                <LanguageSelector />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Interface -->
            <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                    <h2 class="card-title border-b pb-2 mb-4">{t('settings.interface')}</h2>
                    
                    <div class="form-control">
                        <label class="label" for="theme">
                            <span class="label-text">{t('settings.theme')}</span>
                        </label>
                        <select id="theme" class="select select-bordered w-full" bind:value={userState.preferences.theme}>
                            <option value="light">Clair (Light)</option>
                            <option value="dark">Sombre (Dark)</option>
                            <option value="cupcake">Cupcake</option>
                            <option value="bumblebee">Bumblebee</option>
                            <option value="emerald">Emerald</option>
                            <option value="corporate">Corporate</option>
                            <option value="synthwave">Synthwave</option>
                            <option value="retro">Retro</option>
                            <option value="cyberpunk">Cyberpunk</option>
                            <option value="valentine">Valentine</option>
                            <option value="halloween">Halloween</option>
                            <option value="garden">Garden</option>
                            <option value="forest">Forest</option>
                            <option value="aqua">Aqua</option>
                            <option value="lofi">Lofi</option>
                            <option value="pastel">Pastel</option>
                            <option value="fantasy">Fantasy</option>
                            <option value="wireframe">Wireframe</option>
                            <option value="black">Black</option>
                            <option value="luxury">Luxury</option>
                            <option value="dracula">Dracula</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- AI Configuration -->
            <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                    <h2 class="card-title border-b pb-2 mb-4">{t('settings.ai')}</h2>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="form-control">
                            <label class="label" for="model">
                                <span class="label-text">{t('settings.default_model')}</span>
                            </label>
                            <input 
                                type="text" 
                                id="model"
                                placeholder={t('settings.model_placeholder')} 
                                class="input input-bordered w-full" 
                                bind:value={userState.preferences.defaultModel} 
                            />
                            <div class="label">
                                <span class="label-text-alt">{t('settings.model_help')}</span>
                            </div>
                        </div>

                        <div class="form-control">
                            <label class="label" for="temp">
                                <span class="label-text">{t('settings.temperature')} ({userState.preferences.defaultTemperature})</span>
                            </label>
                            <input 
                                type="range" 
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
            </div>

            <!-- Server Configuration -->
            <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                    <h2 class="card-title border-b pb-2 mb-4">{t('settings.server_connection')}</h2>
                    
                    <div class="form-control">
                        <label class="label" for="server">
                            <span class="label-text">{t('settings.server_host')}</span>
                        </label>
                        <input 
                            type="text" 
                            id="server"
                            placeholder="http://localhost:3000" 
                            class="input input-bordered w-full font-mono" 
                            bind:value={userState.preferences.serverUrl} 
                        />
                        <div class="label">
                            <span class="label-text-alt">{t('settings.server_help')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex justify-end mt-4 mb-12">
                <button class="btn btn-primary btn-lg" onclick={onSave}>
                    {t('settings.save_continue')}
                </button>
            </div>
        </div>
    </div>
</div>
