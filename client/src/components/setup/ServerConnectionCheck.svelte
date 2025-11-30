<script lang="ts">
    import { userState } from '$lib/state/user.svelte';
    import { toast } from '$lib/state/notifications.svelte';
    import { connectionState } from '$lib/state/connection.svelte';
    import { t } from '$lib/state/i18n.svelte';
    import { onMount, onDestroy } from 'svelte';

    let pollingTimer: any;
    let tempUrl = $state(userState.preferences.serverUrl);
    let currentErrorToastId: string | null = null;

    async function checkConnection(isAuto = false) {
        connectionState.setChecking(true);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const baseUrl = userState.preferences.serverUrl.replace(/\/$/, '');
            const res = await fetch(`${baseUrl}/api/health`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                if (!connectionState.isConnected) {
                    toast.success(t('status.connection_restored'));
                } else if (!isAuto) {
                    toast.success(t('status.server_connected'));
                }
                
                connectionState.setConnected(true);
                connectionState.showModal = false;
            } else {
                throw new Error('Status ' + res.status);
            }
        } catch (e) {
            console.error('Connection check failed:', e);
            
            if (connectionState.isConnected) {
                // Transition from Connected -> Disconnected
                connectionState.setConnected(false);
                
                // "en cas de fail, la bulle doit etre rouge, autoclose sur off" -> CHANGED TO: "afficher la notification en auto_close"
                toast.error(t('status.server_inaccessible'), 5000);
            } else {
                // Already disconnected
                if (!isAuto) {
                    // Manual retry failed
                    toast.error(t('status.still_inaccessible'), 3000);
                }
            }
        } finally {
            connectionState.setChecking(false);
        }
    }

    function updateUrl() {
        userState.preferences.serverUrl = tempUrl;
        userState.save();
        checkConnection();
    }

    function goOffline() {
        connectionState.showModal = false;
        toast.info(t('status.offline_mode'));
    }

    onMount(() => {
        // Initial check
        checkConnection(true);

        // Polling every 30s to detect disconnection or retry connection
        pollingTimer = setInterval(() => {
            checkConnection(true);
        }, 30000);
    });

    onDestroy(() => {
        if (pollingTimer) clearInterval(pollingTimer);
    });
</script>

{#if connectionState.showModal}
<div class="modal modal-open bg-black/50 backdrop-blur-sm z-50">
  <div class="modal-box shadow-2xl">
    <h3 class="font-bold text-lg text-error flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        {t('status.server_inaccessible')}
    </h3>
    <p class="py-4">{t('status.check_server')}</p>
    
    <div class="form-control w-full">
        <label class="label" for="server-url-input">
            <span class="label-text">{t('settings.server_url')}</span>
        </label>
        <input 
            id="server-url-input"
            type="text" 
            bind:value={tempUrl} 
            class="input input-bordered w-full font-mono" 
            placeholder="http://localhost:3000"
        />
    </div>

    <div class="modal-action">
      <button class="btn btn-ghost" onclick={goOffline}>{t('status.continue_offline')}</button>
      <button class="btn btn-primary" onclick={updateUrl} disabled={connectionState.isChecking}>
        {#if connectionState.isChecking}
            <span class="loading loading-spinner loading-xs"></span>
            {t('status.connecting')}...
        {:else}
            {t('status.retry')}
        {/if}
      </button>
    </div>
  </div>
</div>
{/if}
