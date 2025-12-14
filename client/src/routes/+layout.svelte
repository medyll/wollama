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
	import SidebarTrigger from '$components/ui/SidebarTrigger.svelte';
	import UserMenu from '$components/ui/UserMenu.svelte';
	import { connectionState } from '$lib/state/connection.svelte';
	import { uiState } from '$lib/state/ui.svelte';
	import { userState } from '$lib/state/user.svelte';
	import { downloadState } from '$lib/state/downloads.svelte';
	import { DataInitializer } from '$lib/services/data-initializer';
	import { t } from '$lib/state/i18n.svelte';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';

	let { children } = $props();

	$effect(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-theme', userState.preferences.theme);
		}
	});

	$effect(() => {
		// Close sidebar on navigation (mobile)
		const path = $page.url.pathname;
		// Only close on mobile if needed, but uiState.sidebarOpen is shared.
		// Maybe we want to keep it open on desktop?
		// For now, let's just close it if it's mobile (we can check window width or just rely on user intent)
		// But since we share state, let's leave it for now or check media query.
		if (window.innerWidth < 768) {
			uiState.sidebarOpen = false;
		}
	});

	onMount(async () => {
		// Initialize default data
		await DataInitializer.initializeDefaults();

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

<div class="drawer md:drawer-open h-screen overflow-hidden">
	<!-- Section: Drawer Toggle -->
	<input id="main-drawer" type="checkbox" class="drawer-toggle" bind:checked={uiState.sidebarOpen} />

	<div class="drawer-content relative flex h-full flex-col">
		<!-- Section: Navbar -->
		<header class="navbar bg-base-100 z-10 min-h-16">
			<div class="flex-none md:hidden">
				<SidebarTrigger />
			</div>
			<div class="mr-2 hidden flex-none md:block">
				<SidebarTrigger visible={!uiState.sidebarOpen} />
			</div>
			<div class="flex flex-1 items-center gap-2">
				<a href="/chat" class="btn btn-ghost text-xl">Wollama</a>
				{#if uiState.pageTitle}
					<span class="hidden max-w-[200px] truncate text-lg font-normal opacity-70 sm:inline-block md:max-w-md">
						{uiState.pageTitle}
					</span>
				{/if}
			</div>
			<div class="flex flex-none items-center gap-2">
				{#if downloadState.isPulling}
					<div class="mr-2 hidden w-40 flex-col text-xs md:flex">
						<div class="mb-0.5 flex justify-between">
							<span class="max-w-20 truncate font-bold">{downloadState.currentModel}</span>
							<span>{downloadState.progress}%</span>
						</div>
						<progress
							class="progress progress-primary h-1.5 w-full"
							value={downloadState.progress}
							max="100"
							aria-label="Download progress"
						></progress>
					</div>
				{/if}
				<button
					class="btn btn-ghost btn-circle"
					onclick={() => connectionState.toggleModal()}
					aria-label="Connection Status"
					title={!connectionState.isConnected
						? t('status.error')
						: !connectionState.isOllamaConnected
							? 'Ollama Service Down'
							: t('status.connected')}
				>
					<Icon
						icon="lucide:server"
						class={`h-5 w-5 ${
							!connectionState.isConnected
								? 'text-error'
								: !connectionState.isOllamaConnected
									? 'text-warning'
									: 'text-success'
						}`}
					/>
				</button>
				<UserMenu />
			</div>
		</header>

		<!-- Section: Main Content -->
		<main class="relative flex-1 overflow-hidden">
			{@render children()}
		</main>
	</div>

	<!-- Section: Sidebar -->
	<div class="drawer-side z-20">
		<label for="main-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
		<Sidebar />
	</div>
</div>
