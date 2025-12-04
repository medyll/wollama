<script lang="ts">
    import { t } from '$lib/state/i18n.svelte';
    import { goto } from '$app/navigation';

    function createNewChat() {
        goto('/chat/new');
    }
</script>

<div class="hero h-full bg-base-200">
    <!-- Section: Hero Content -->
    <div class="hero-content text-center">
        <div class="max-w-md flex flex-col items-center">
            <img src="/assets/lama.png" alt="Wollama" class="w-32 h-32 object-contain mb-6 opacity-90" />
            <h1 class="text-3xl font-bold">{t('ui.ready_to_chat')}</h1>
            <p class="py-6">{t('ui.select_chat_help')}</p>
            <button class="btn btn-primary" onclick={createNewChat}>{t('ui.newChat')}</button>
        </div>
    </div>
</div>
