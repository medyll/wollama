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
    import UserMenu from '$components/ui/UserMenu.svelte';
    import { connectionState } from '$lib/state/connection.svelte';
    import { uiState } from '$lib/state/ui.svelte';
    import { userState } from '$lib/state/user.svelte';
    import { downloadState } from '$lib/state/downloads.svelte';
    import { companionService } from '$lib/services/companion.service';
    import { t } from '$lib/state/i18n.svelte';
    import { page } from '$app/stores';
    import Icon from '@iconify/svelte';

	let { children } = $props();
    let isSidebarOpen = $state(false);

    $effect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', userState.preferences.theme);
        }
    });

    $effect(() => {
        // Close sidebar on navigation (mobile)
        const path = $page.url.pathname;
        isSidebarOpen = false;
    });

	onMount(async () => {
        // Initialize default companions if needed
        try {
            await companionService.initializeDefaults();
        } catch (e) {
            console.error('Failed to initialize companions:', e);
        }

		App.addListener('appUrlOpen', (data) => {
			// Cleanup: "myapp://chat/123" -> "/chat/123"
			// Adjust logic based on actual scheme
			const slug = data.url.split('.com').pop();
			if (slug) goto(slug);
		});
	});
</script>

<ToastContainer />
<ServerConnectionCheck />
<SplashScreen />

<div class="drawer md:drawer-open h-screen overflow-hidden bg-base-100">
    <!-- Section: Drawer Toggle -->
    <input id="main-drawer" type="checkbox" class="drawer-toggle" bind:checked={isSidebarOpen} />
    
    <div class="drawer-content flex flex-col h-full relative">
        <!-- Section: Navbar -->
        <header class="navbar bg-base-100 min-h-16 z-10">
            <div class="flex-none md:hidden">
                <label for="main-drawer" class="btn btn-square btn-ghost" aria-label="Open sidebar">
                    <Icon icon="lucide:menu" class="inline-block w-5 h-5" />
                </label>
            </div>
            <div class="flex-1 flex items-center gap-2">
                <a href="/chat" class="btn btn-ghost text-xl">Wollama</a>
                {#if uiState.pageTitle}
                    <span class="text-lg font-normal opacity-70 truncate max-w-[200px] md:max-w-md hidden sm:inline-block">
                        {uiState.pageTitle}
                    </span>
                {/if}
            </div>
            <div class="flex-none flex items-center gap-2">
                {#if downloadState.isPulling}
                    <div class="hidden md:flex flex-col w-40 mr-2 text-xs">
                        <div class="flex justify-between mb-0.5">
                            <span class="font-bold truncate max-w-20">{downloadState.currentModel}</span>
                            <span>{downloadState.progress}%</span>
                        </div>
                        <progress class="progress progress-primary w-full h-1.5" value={downloadState.progress} max="100" aria-label="Download progress"></progress>
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
                <UserMenu />
            </div>
        </header>


        <!-- Section: Main Content -->
        <main class="flex-1 overflow-hidden relative">
            {@render children()}
        </main>
    </div>
    
    <!-- Section: Sidebar -->
    <div class="drawer-side z-20">
        <label for="main-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
        <Sidebar isOpen={true} />
    </div>
</div>
