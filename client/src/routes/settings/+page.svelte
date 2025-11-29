<script lang="ts">
    import { userState } from '$lib/state/user.svelte';
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
            <h1 class="text-4xl font-bold">Paramètres</h1>
            <p class="py-2 opacity-70">Personnalisez votre expérience Wollama</p>
        </div>

        <div class="grid gap-6">
            <!-- User Profile -->
            <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                    <h2 class="card-title border-b pb-2 mb-4">Profil Utilisateur</h2>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="form-control">
                            <label class="label" for="nickname">
                                <span class="label-text">Surnom / Identité</span>
                            </label>
                            <input 
                                type="text" 
                                id="nickname"
                                placeholder="Comment dois-je vous appeler ?" 
                                class="input input-bordered w-full" 
                                bind:value={userState.nickname} 
                            />
                        </div>
                        
                        <div class="form-control">
                            <label class="label" for="lang">
                                <span class="label-text">Langue</span>
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
                    <h2 class="card-title border-b pb-2 mb-4">Interface</h2>
                    
                    <div class="form-control">
                        <label class="label" for="theme">
                            <span class="label-text">Thème</span>
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
                    <h2 class="card-title border-b pb-2 mb-4">Intelligence Artificielle</h2>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="form-control">
                            <label class="label" for="model">
                                <span class="label-text">Modèle Principal</span>
                            </label>
                            <input 
                                type="text" 
                                id="model"
                                placeholder="ex: mistral, llama3" 
                                class="input input-bordered w-full" 
                                bind:value={userState.preferences.defaultModel} 
                            />
                            <div class="label">
                                <span class="label-text-alt">Le modèle Ollama par défaut pour les nouveaux chats.</span>
                            </div>
                        </div>

                        <div class="form-control">
                            <label class="label" for="temp">
                                <span class="label-text">Température ({userState.preferences.defaultTemperature})</span>
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
                                <span>Précis</span>
                                <span>Créatif</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Server Configuration -->
            <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                    <h2 class="card-title border-b pb-2 mb-4">Serveur & Connexion</h2>
                    
                    <div class="form-control">
                        <label class="label" for="server">
                            <span class="label-text">Hôte du Serveur Wollama</span>
                        </label>
                        <input 
                            type="text" 
                            id="server"
                            placeholder="http://localhost:3000" 
                            class="input input-bordered w-full font-mono" 
                            bind:value={userState.preferences.serverUrl} 
                        />
                        <div class="label">
                            <span class="label-text-alt">L'adresse de votre serveur Node.js local ou distant.</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex justify-end mt-4 mb-12">
                <button class="btn btn-primary btn-lg" onclick={onSave}>
                    Enregistrer et Continuer
                </button>
            </div>
        </div>
    </div>
</div>
