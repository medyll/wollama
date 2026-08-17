<script lang="ts">
	import '../app.css';
	import 'highlight.js/styles/atom-one-dark.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { App } from '@capacitor/app';
	import ToastContainer from '$components/ui/ToastContainer.svelte';
	import PermissionPromptOverlay from '$lib/components/tool/PermissionPromptOverlay.svelte';
	import ServerConnectionCheck from '$components/setup/ServerConnectionCheck.svelte';
	import SplashScreen from '$components/ui/SplashScreen.svelte';
	import Sidebar from '$components/ui/Sidebar.svelte';
	import SidebarTrigger from '$components/ui/SidebarTrigger.svelte';
	import UserMenu from '$components/ui/UserMenu.svelte';
	import SyncStatus from '$components/ui/SyncStatus.svelte';
	import OfflineIndicator from '$components/ui/OfflineIndicator.svelte';
	import { connectionState } from '$lib/state/connection.svelte';
	import { uiState } from '$lib/state/ui.svelte';
	import { userState } from '$lib/state/user.svelte';
	import { downloadState } from '$lib/state/downloads.svelte';
	import { DataInitializer } from '$lib/services/data-initializer';
	import { page } from '$app/stores';
	import { enableReplication, disableReplication } from '$lib/db';
	import { t } from '$lib/state/i18n.svelte';
	let { children } = $props();

	$effect(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-theme', userState.preferences.theme);
		}
	});

	$effect(() => {
		// Close sidebar on navigation (mobile)
		void $page.url.pathname;
		// Only close on mobile if needed, but uiState.sidebarOpen is shared.
		// Maybe we want to keep it open on desktop?
		// For now, let's just close it if it's mobile (we can check window width or just rely on user intent)
		// But since we share state, let's leave it for now or check media query.
		if (window.innerWidth < 768) {
			uiState.sidebarOpen = false;
		}
	});

	onMount(() => {
		// Wrap async work to avoid returning a Promise from onMount
		(async () => {
			// Initialize default data
			await DataInitializer.initializeDefaults();

			// Check onboarding status - redirect if not completed
			if (!userState.preferences.onboarding_completed) {
				goto('/onboarding');
				return;
			}

			// Start sync if user is authenticated
			if (userState.uid) {
				try {
					await enableReplication(userState.uid, userState.token || '');
					console.log('Replication started for user:', userState.uid);
					connectionState.setConnected(true);
				} catch (err) {
					console.error('Failed to start replication:', err);
					connectionState.setConnected(false);
				}
			}

			App.addListener('appUrlOpen', (data) => {
				// Cleanup: "myapp://chat/123" -> "/chat/123"
				// Adjust logic based on actual scheme
				const slug = data.url.split('.com').pop();
				if (slug) goto(slug);
			});
		})();

		// Cleanup on unmount
		return () => {
			disableReplication().catch((err) => console.error('Failed to disable replication:', err));
		};
	});
</script>

<ToastContainer />
<PermissionPromptOverlay />
<ServerConnectionCheck />
<SplashScreen />

{#if userState.preferences.onboarding_completed}
	<a class="skip-link" href="#main-content">Aller au contenu principal</a>
	<SyncStatus />
	<OfflineIndicator />
	<app-shell-component>
		<Sidebar />
		<button
			type="button"
			class="mobile-sidebar-backdrop"
			data-open={uiState.sidebarOpen}
			onclick={() => (uiState.sidebarOpen = false)}
			aria-label={t('ui.close')}
		></button>

		<app-shell-content>
			<app-shell-header>
				<div class="flex-none md:hidden">
					<SidebarTrigger />
				</div>
				<div class="mr-2 hidden flex-none md:block">
					<SidebarTrigger visible={!uiState.sidebarOpen} />
				</div>
				<a href="/chat" class="app-brand" aria-label="Wollama — chat">
					<span class="app-brand-mark" aria-hidden="true">W</span>
					<span>Wollama</span>
				</a>
				{#if uiState.pageTitle}
					<span class="app-page-title">
						{uiState.pageTitle}
					</span>
				{/if}
				<span class="app-header-spacer"></span>
				<div class="flex flex-none items-center gap-2">
					{#if downloadState.isPulling}
						<div class="mr-2 hidden w-40 flex-col text-xs md:flex">
							<div class="mb-0.5 flex justify-between">
								<span class="max-w-20 truncate font-bold">{downloadState.currentModel}</span>
								<span>{downloadState.progress}%</span>
							</div>
							<progress
								class="app-progress w-full"
								value={downloadState.progress}
								max="100"
								aria-label="Download progress"
							></progress>
						</div>
					{/if}
					<UserMenu />
				</div>
			</app-shell-header>

			<app-shell-main id="main-content" tabindex="-1">
				{@render children()}
			</app-shell-main>
		</app-shell-content>
	</app-shell-component>
{:else}
	<main class="h-screen w-screen overflow-hidden">
		{@render children()}
	</main>
{/if}
