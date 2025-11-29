<script lang="ts">
    import { userState } from '$lib/state/user.svelte';
    import { goto } from '$app/navigation';

    let advancedMode = $state(false);

    function onSave() {
        if (!userState.nickname) return;
        userState.save();
        goto('/chat');
    }
</script>

<div class="hero min-h-screen bg-base-200">
    <div class="hero-content flex-col lg:flex-row-reverse">
        <div class="text-center lg:text-left">
            <h1 class="text-5xl font-bold">Bienvenue !</h1>
            <p class="py-6">Configurons votre profil pour commencer à discuter.</p>
        </div>
        <div class="card shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
            <div class="card-body">
                <div class="form-control">
                    <label class="label" for="nickname">
                        <span class="label-text">Votre Surnom</span>
                    </label>
                    <input 
                        type="text" 
                        id="nickname"
                        placeholder="Ex: Neo" 
                        class="input input-bordered" 
                        bind:value={userState.nickname} 
                        required 
                    />
                </div>
                
                <div class="form-control mt-4">
                    <label class="label cursor-pointer justify-start gap-2">
                        <input type="checkbox" class="toggle toggle-sm" bind:checked={advancedMode} />
                        <span class="label-text">Mode Avancé</span>
                    </label>
                </div>

                {#if advancedMode}
                    <div class="form-control">
                        <label class="label" for="server">
                            <span class="label-text">URL du Serveur</span>
                        </label>
                        <input 
                            type="text" 
                            id="server"
                            placeholder="http://localhost:3000" 
                            class="input input-bordered" 
                            bind:value={userState.serverUrl} 
                        />
                    </div>
                {/if}

                <div class="form-control mt-6">
                    <button class="btn btn-primary" onclick={onSave} disabled={!userState.nickname}>
                        Commencer
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
