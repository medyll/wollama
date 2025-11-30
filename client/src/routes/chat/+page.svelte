<script lang="ts">
    import { t } from '$lib/state/i18n.svelte';
</script>

<div class="hero h-full bg-base-200">
    <div class="hero-content text-center">
        <div class="max-w-md">
            <h1 class="text-3xl font-bold">{t('ui.ready_to_chat')}</h1>
            <p class="py-6">{t('ui.select_chat_help')}</p>
            <a href="/chat/new" class="btn btn-primary">{t('ui.newChat')}</a>
        </div>
    </div>
</div>
