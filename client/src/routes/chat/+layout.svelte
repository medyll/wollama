<script lang="ts">
    import Sidebar from '$components/ui/Sidebar.svelte';
    import { page } from '$app/stores';
    
    let { children } = $props();
    let isSidebarOpen = $state(true);

    function toggleSidebar() {
        isSidebarOpen = !isSidebarOpen;
    }
</script>

<div class="flex h-screen overflow-hidden bg-base-100">
    <!-- Sidebar (Desktop & Mobile handled via CSS/Drawer if needed, simple flex for now) -->
    <div class="hidden md:block h-full">
        <Sidebar bind:isOpen={isSidebarOpen} />
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col h-full relative">
        <!-- Top Navigation Bar -->
        <header class="navbar bg-base-100 border-b border-base-content/10 min-h-16 z-10">
            <div class="flex-none">
                <button class="btn btn-square btn-ghost" onclick={toggleSidebar}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-5 h-5 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </button>
            </div>
            <div class="flex-1">
                <a href="/chat" class="btn btn-ghost text-xl">Wollama</a>
            </div>
            <div class="flex-none">
                <a href="/setup" class="btn btn-ghost btn-circle">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
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
