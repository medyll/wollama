<script lang="ts">
    import { userState } from '$lib/state/user.svelte';
    import { t } from '$lib/state/i18n.svelte';
    import Icon from '@iconify/svelte';

    let { checked = $bindable() } = $props();
</script>

<label 
    class="swap swap-rotate btn btn-circle btn-lg bg-base-200 hover:bg-base-300 hover:scale-110 transition-all duration-200 shadow-sm border border-base-content/10" 
    aria-label={t('ui.toggle_audio')}
>
    <!-- this hidden checkbox controls the state -->
    <input 
        type="checkbox" 
        bind:checked={userState.preferences.auto_play_audio} 
        onchange={() => userState.save()}
    />
    
    <!-- volume on icon -->
    <Icon icon="lucide:volume-2" class="swap-on w-8 h-8 text-primary" />
    
    <!-- volume off icon -->
    <Icon icon="lucide:volume-x" class="swap-off w-8 h-8 opacity-50" />
</label>