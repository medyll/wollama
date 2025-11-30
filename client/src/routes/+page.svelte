<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { userState } from '$lib/state/user.svelte';
    import { t } from '$lib/state/i18n.svelte';

    onMount(() => {
        setTimeout(() => {
            if (userState.isConfigured) {
                goto('/chat');
            } else {
                goto('/settings');
            }
        }, 2000); // Fake loading time for effect
    });
</script>

<div class="hero min-h-screen bg-base-300" style="background-image: url('/assets/lama.png'); background-size: cover; background-position: center; background-repeat: no-repeat;">
    <div class="hero-overlay bg-opacity-60"></div>
    <div class="hero-content text-center text-neutral-content">
        <div class="max-w-md">
            <h1 class="text-5xl font-bold text-primary">Wollama</h1>
            <p class="py-6 font-bold text-xl">{t('ui.loading_assistant')}</p>
            <span class="loading loading-dots loading-lg text-primary"></span>
        </div>
    </div>
</div>

