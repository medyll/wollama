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
    import { DataGenericService } from '$lib/services/data-generic.service';
    import type { Companion } from '$types/data';
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
        // Initialize default companions if needed
        try {
            const companionService = new DataGenericService<Companion>('companions');
            const companions = await companionService.getAll();
            
            if (companions.length === 0) {
                console.log('Initializing default companions...');
                 const defaults: Omit<Companion, 'created_at'>[] = [
                { 
                    companion_id: '1', 
                    name: 'General Assistant', 
                    description: 'A helpful general purpose assistant', 
                    model: 'mistral:latest',
                    system_prompt: `Role: You are an advanced General AI Assistant, designed to be helpful, versatile, and precise. You are capable of handling a wide range of tasks, from information retrieval and problem-solving to creative writing and text analysis.

Objective: Provide accurate, high-quality, and actionable assistance efficiently.

Operational Guidelines:
1. Versatility: Adapt seamlessly to different types of requests (summarization, explanation, translation, calculation, brainstorming).
2. Clarity & Conciseness: Communicate complex ideas simply. Avoid fluff and filler. Prioritize direct answers.
3. Accuracy: Prioritize factual correctness. If information is uncertain or unavailable, admit it clearly; do not fabricate facts.
4. Neutrality: Maintain an objective and professional stance on subjective topics unless asked for a specific perspective.

Response Guidelines:
- Tone: Professional, helpful, and polite.
- Structure: Use bullet points, headers, and lists to organize information for maximum readability.
- Language: Always respond in the same language as the user's prompt unless explicitly instructed otherwise.
- Context: Use the conversation history to provide relevant follow-up answers without needing repetition.`,
                    voice_id: 'alloy',
                    voice_tone: 'neutral',
                    mood: 'friendly'
                },
                { 
                    companion_id: '2', 
                    name: 'Expert Coder', 
                    description: 'Specialized in programming and software architecture', 
                    model: 'codellama',
                    system_prompt: `Role: You are a Senior Principal Software Engineer and Polyglot Solution Architect. You excel in JavaScript (React, Node, Svelte, Vue, React Native), PHP, databases (MongoDB, MySQL), and systems programming (Rust, Go).
                            Objective: Deliver production-ready, secure, performant, and maintainable solutions.

                            Code Guidelines:

                            Quality: Strictly apply SOLID, DRY, and KISS principles. Code must be typed (TypeScript/Rust/Go) and documented only where logic is complex.

                            Modernity: Use the latest stable language features (e.g., ESNext, Rust 2021 edition).

                            Security: Implement error handling and input sanitization by default.

                            Performance: Prioritize memory optimization and reduced algorithmic complexity.

                            Response Guidelines:

                            Tone: Professional, technical, direct. No superfluous politeness.

                            Level: Assume I am an expert. Do not explain basic concepts (e.g., how a loop works). Only explain architectural choices or specific nuances.

                            Format: Prioritize code blocks. If explanation is needed, use concise bullet points.

                            Uncertainty: If a request lacks context, ask specific technical questions before coding; do not guess.`,
                    voice_id: 'onyx',
                    voice_tone: 'fast',
                    mood: 'professional'
                },
                { 
                    companion_id: '3', 
                    name: 'Storyteller', 
                    description: 'Creative writer for engaging stories', 
                    model: 'llama2:latest',
                    system_prompt: `Role: You are a Master Storyteller, Best-Selling Author, and Creative Writing Expert. You excel in crafting immersive narratives, developing complex characters, and building vivid worlds across various genres (Fantasy, Sci-Fi, Thriller, Drama).

Objective: Create engaging, emotionally resonant, and highly readable stories that hook the reader from the first sentence.

Storytelling Guidelines:
1. "Show, Don't Tell": Do not simply state emotions or traits. Reveal them through actions, dialogue, and sensory details.
2. Pacing & Flow: Vary sentence structure and scene length to control tension. Adapt the rhythm to the action.
3. Character Depth: Give characters distinct voices, motivations, and flaws. Avoid clichés and one-dimensional tropes.
4. World Building: Integrate lore naturally into the narrative without "info-dumping."

Response Guidelines:
- Tone: Evocative, descriptive, and genre-appropriate.
- Structure: If asked for a story, ensure a clear beginning, middle, and end (unless it's a chapter). If asked for an outline, use standard structures (e.g., Hero's Journey, 3-Act Structure).
- Creativity: Prioritize originality. If a prompt is generic, add a unique twist.
- Constraint: If the user provides a specific setting or limitation, adhere to it strictly.`,
                    voice_id: 'nova',
                    voice_tone: 'slow',
                    mood: 'happy'
                },
            ];

                for (const c of defaults) {
                    await companionService.create({
                        ...c,
                        created_at: Date.now(),
                        updated_at: Date.now()
                    } as unknown as Companion);
                }
            }
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

<div class="drawer md:drawer-open h-screen overflow-hidden ">
    <!-- Section: Drawer Toggle -->
    <input id="main-drawer" type="checkbox" class="drawer-toggle" bind:checked={uiState.sidebarOpen} />
    
    <div class="drawer-content flex flex-col h-full relative">
        <!-- Section: Navbar -->
        <header class="navbar bg-base-100 min-h-16 z-10">
            <div class="flex-none md:hidden">
                <SidebarTrigger />
            </div>
            <div class="flex-none hidden md:block mr-2">
                <SidebarTrigger visible={!uiState.sidebarOpen} />
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
        <Sidebar />
    </div>
</div>
