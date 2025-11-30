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

<div class="hero min-h-screen bg-base-200">
    <div class="hero-content text-center">
        <div class="max-w-md">
            <h1 class="text-5xl font-bold text-primary">Wollama</h1>
            <p class="py-6">{t('ui.loading_assistant')}</p>
            <span class="loading loading-dots loading-lg text-primary"></span>
        </div>
    </div>
</div>

