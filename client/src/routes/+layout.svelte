<script lang="ts">
	import '../app.css';
    import 'highlight.js/styles/atom-one-dark.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { App } from '@capacitor/app';
    import ToastContainer from '$components/ui/ToastContainer.svelte';
    import ServerConnectionCheck from '$components/setup/ServerConnectionCheck.svelte';
    import SplashScreen from '$components/ui/SplashScreen.svelte';
    import Sidebar from '$components/ui/Sidebar.svelte';
    import LanguageSelector from '$components/ui/LanguageSelector.svelte';
    import { connectionState } from '$lib/state/connection.svelte';
    import { userState } from '$lib/state/user.svelte';
    import { downloadState } from '$lib/state/downloads.svelte';
    import { companionService } from '$lib/services/companion.service';
    import { t } from '$lib/state/i18n.svelte';
    import { page } from '$app/stores';
    import Icon from '@iconify/svelte';

	let { children } = $props();
    let isSidebarOpen = $state(true);

    function toggleSidebar() {
        isSidebarOpen = !isSidebarOpen;
    }

    $effect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', userState.preferences.theme);
        }
    });

	onMount(async () => {
        // Initialize default companions if needed
        try {
            await companionService.initializeDefaults();
        } catch (e) {
            console.error('Failed to initialize companions:', e);
        }

		App.addListener('appUrlOpen', (data) => {
			// Nettoyage: "myapp://chat/123" -> "/chat/123"
			// Adjust logic based on actual scheme
			const slug = data.url.split('.com').pop();
			if (slug) goto(slug);
		});
	});
</script>

<ToastContainer />
<ServerConnectionCheck />
<SplashScreen />

<div class="flex h-screen overflow-hidden bg-base-100">
    <!-- Sidebar (Desktop & Mobile handled via CSS/Drawer if needed, simple flex for now) -->
    <div class="hidden md:block h-full">
        <Sidebar bind:isOpen={isSidebarOpen} />
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col h-full relative">
        <!-- Top Navigation Bar -->
        <header class="navbar bg-base-100   min-h-16 z-10">
            <div class="flex-none">
                <button class="btn btn-square btn-ghost" onclick={toggleSidebar} aria-label="Toggle sidebar">
                    <Icon icon="lucide:menu" class="inline-block w-5 h-5" />
                </button>
            </div>
            <div class="flex-1">
                <a href="/chat" class="btn btn-ghost text-xl">Wollama</a>
            </div>
            <div class="flex-none flex items-center gap-2">
                {#if downloadState.isPulling}
                    <div class="hidden md:flex flex-col w-40 mr-2 text-xs">
                        <div class="flex justify-between mb-0.5">
                            <span class="font-bold truncate max-w-[80px]">{downloadState.currentModel}</span>
                            <span>{downloadState.progress}%</span>
                        </div>
                        <progress class="progress progress-primary w-full h-1.5" value={downloadState.progress} max="100"></progress>
                    </div>
                {/if}
                <button 
                    class="btn btn-ghost btn-circle" 
                    onclick={() => connectionState.toggleModal()}
                    aria-label="Connection Status"
                    title={connectionState.isConnected ? t('status.connected') : t('status.error')}
                >
                    <Icon icon="lucide:server" class={`h-5 w-5 ${connectionState.isConnected ? 'text-success' : 'text-error'}`} />
                </button>
                <LanguageSelector />
                <a href="/settings" class="btn btn-ghost btn-circle" aria-label="Settings">
                    <Icon icon="lucide:settings" class="h-5 w-5" />
                </a>
            </div>
        </header>


        <!-- Page Content -->
        <main class="flex-1 overflow-hidden relative">
            {@render children()}
        </main>
    </div>
    
    <!-- Mobile Drawer Overlay (Optional implementation for mobile) -->
</div>
