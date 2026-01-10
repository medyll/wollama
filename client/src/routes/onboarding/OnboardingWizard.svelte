<script lang="ts">
	import { goto } from '$app/navigation';
	import { userState } from '$lib/state/user.svelte';
	import Icon from '@iconify/svelte';
	import { testOllamaConnection, normalizeServerUrl } from '$lib/services/ollama.service';
	import CompanionSelector from '$components/CompanionSelector.svelte';
	import type { UserCompanion } from '$types/data';
	import { DEFAULT_COMPANIONS } from '../../../../shared/configuration/data-default';
	import { DataGenericService } from '$lib/services/data-generic.service';

	let currentStep = $state(0);
	const totalSteps = 4; // Intro + Server URL config + Import companions + Companion selection

	// Step 0: Intro
	// Step 1: Server URL configuration (Ollama)
	// Step 2: Import default companions
	// Step 3: Companion selection
	let serverUrl = $state(userState.preferences.ollamaUrl || 'http://localhost:11434');
	let selectedCompanion: UserCompanion | null = $state(null);
	let isTestingConnection = $state(false);
	let connectionMessage = $state('');
	let connectionSuggestion = $state('');
	let connectionSuccess = $state(false);
	let isImporting = $state(false);
	let importProgress = $state(0);
	let importTotal = $state(0);

	const steps = [
		{
			title: 'Welcome to Wollama',
			description:
				'Wollama is a local AI chat application that lets you chat with AI models running on your machine via Ollama.',
			icon: 'mdi:chat-processing-outline'
		},
		{
			title: 'Configure Ollama Server',
			description: 'Enter the address of your Ollama server (usually http://localhost:11434 if running locally)',
			icon: 'mdi:server-network'
		},
		{
			title: 'Import Default Companions',
			description: 'We will copy the default companions to your personal collection',
			icon: 'mdi:account-multiple-plus'
		},
		{
			title: 'Choose Your Companion',
			description: 'Select a companion to start your first conversation',
			icon: 'mdi:robot-face-outline'
		}
	];

	async function handleNext() {
		// If on server config step, validate before proceeding
		if (currentStep === 1) {
			await testConnection();
			if (!connectionSuccess) {
				return; // Don't advance if validation failed
			}
		}

		// If on import step, trigger import automatically
		if (currentStep === 2 && !isImporting) {
			// Trigger import when entering this step
			setTimeout(() => importDefaultCompanions(), 100);
			return;
		}

		// If on companion selection step, ensure a companion is selected
		if (currentStep === 3) {
			if (!selectedCompanion) {
				alert('Please select a companion to continue');
				return;
			}
		}

		if (currentStep < totalSteps - 1) {
			currentStep++;
		} else {
			// Mark onboarding as completed and redirect to chat
			await completeOnboarding();
		}
	}

	async function testConnection() {
		const trimmedUrl = serverUrl.trim();
		if (!trimmedUrl) {
			connectionMessage = 'Please enter a server URL';
			connectionSuggestion = '';
			connectionSuccess = false;
			return;
		}

		isTestingConnection = true;
		connectionMessage = 'Testing connection...';
		connectionSuggestion = '';
		connectionSuccess = false;

		try {
			const normalized = normalizeServerUrl(trimmedUrl);
			if (!normalized) {
				connectionMessage = 'Invalid URL format';
				connectionSuggestion = 'Use format like http://localhost:11434 or https://your-server:port';
				connectionSuccess = false;
				isTestingConnection = false;
				return;
			}

			const result = await testOllamaConnection(normalized);

			if (result.success) {
				connectionMessage = 'Connected successfully!';
				connectionSuggestion = '';
				connectionSuccess = true;
				// Store the validated Ollama URL
				userState.preferences.ollamaUrl = normalized;
			} else {
				connectionMessage = result.error || 'Unable to connect';
				connectionSuggestion = result.suggestion || 'Make sure Ollama is running and reachable';
				connectionSuccess = false;
			}
		} catch (error) {
			connectionMessage = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
			connectionSuggestion = 'Please check your network connection and try again';
			connectionSuccess = false;
		} finally {
			isTestingConnection = false;
		}
	}

	async function completeOnboarding() {
		// Mark onboarding as complete and navigate to chat
		try {
			// Store onboarding completion in preferences
			Object.assign(userState.preferences, { onboarding_completed: true });
			userState.save();
			// Navigate to chat (server is now configured)
			goto('/chat');
		} catch (error) {
			console.error('Failed to complete onboarding:', error);
		}
	}

	function handleSkip() {
		// On companion selection step (final step), skip by using first available companion or going to chat without selection
		if (currentStep === 3) {
			completeOnboarding(); // Skip companion selection and go to companions page
		} else if (currentStep < totalSteps - 1) {
			currentStep++;
		} else {
			completeOnboarding();
		}
	}

	async function importDefaultCompanions() {
		if (isImporting) return;

		isImporting = true;
		importTotal = DEFAULT_COMPANIONS.length;
		importProgress = 0;

		try {
			const userCompanionService = new DataGenericService<UserCompanion>('user_companions');

			for (const companion of DEFAULT_COMPANIONS) {
				// Create user_companion copy
				const userCompanion: UserCompanion = {
					user_companion_id: crypto.randomUUID(),
					user_id: userState.uid || '',
					companion_id: companion.companion_id,
					name: companion.name || '',
					description: companion.description,
					system_prompt: companion.system_prompt || '',
					model: companion.model || '',
					voice_id: companion.voice_id,
					voice_tone: companion.voice_tone,
					mood: companion.mood,
					avatar: companion.avatar,
					specialization: companion.specialization,
					is_locked: false, // User can customize their copies
					created_at: Date.now(),
					updated_at: Date.now()
				};

				await userCompanionService.create(userCompanion);
				importProgress++;
			}

			// Auto-advance after successful import
			setTimeout(() => {
				isImporting = false;
				currentStep++;
			}, 500);
		} catch (error) {
			console.error('Failed to import companions:', error);
			isImporting = false;
		}
	}
</script>

<svelte:head>
	<title>Welcome - Wollama</title>
</svelte:head>

<div class="from-base-100 to-base-200 flex min-h-screen items-center justify-center bg-linear-to-br p-4">
	<div class="w-full" class:max-w-md={currentStep !== 3} class:max-w-4xl={currentStep === 3}>
		<!-- Main Card -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<!-- Icon/Logo -->
				<div class="mb-6 flex justify-center">
					<Icon icon={steps[currentStep].icon} width="64" height="64" class="text-primary" />
				</div>

				<!-- Title -->
				<h1 class="card-title mb-4 justify-center text-center text-2xl">
					{steps[currentStep].title}
				</h1>

				<!-- Description -->
				<p class="text-base-content/70 mb-8 text-center">
					{steps[currentStep].description}
				</p>

				<!-- Step 1: Server URL Configuration Form -->
				{#if currentStep === 1}
					<div class="form-control mb-6">
						<label class="label" for="server-url">
							<span class="label-text">Ollama Server URL</span>
						</label>
						<input
							id="server-url"
							type="text"
							placeholder="http://localhost:11434"
							class="input input-bordered"
							bind:value={serverUrl}
							disabled={isTestingConnection}
							aria-label="Server URL input"
						/>
						<label class="label" for="server-url">
							<span class="label-text-alt text-xs opacity-70">Example: http://localhost:11434</span>
						</label>

						{#if connectionMessage}
							<div
								class={`mt-3 rounded-lg p-3 transition-all ${connectionSuccess ? 'bg-success/20' : connectionMessage ? 'bg-error/20' : ''}`.trim()}
								role="alert"
								aria-live="polite"
							>
								<p
									class="text-sm font-medium"
									class:text-success={connectionSuccess}
									class:text-error={!connectionSuccess && connectionMessage}
								>
									{connectionMessage}
								</p>
								{#if connectionSuggestion && !connectionSuccess}
									<p class="mt-2 text-xs opacity-80">
										{connectionSuggestion}
									</p>
								{/if}
							</div>
						{/if}
					</div>

					<button
						class="btn btn-primary btn-sm w-full"
						onclick={testConnection}
						disabled={isTestingConnection || !serverUrl.trim()}
						aria-label="Test connection"
					>
						{#if isTestingConnection}
							<span class="loading loading-spinner loading-sm"></span>
							Testing...
						{:else}
							Test Connection
						{/if}
					</button>
				{/if}

				<!-- Step 2: Import Default Companions -->
				{#if currentStep === 2}
					<div class="flex flex-col items-center justify-center space-y-4 py-8">
						<div class="w-full max-w-md space-y-3">
							<progress class="progress progress-primary w-full" value={importProgress} max={importTotal || 1}
							></progress>
							<p class="text-center text-sm opacity-70">
								{#if isImporting}
									Importing companions... {importProgress}/{importTotal}
								{:else}
									Preparing to import companions...
								{/if}
							</p>
						</div>
					</div>
				{/if}

				<!-- Step 3: Companion Selection -->
				{#if currentStep === 3}
					<CompanionSelector
						onSelect={(companion) => {
							selectedCompanion = companion;
						}}
					/>
				{/if}

				<!-- Step Indicator -->
				<div class="mb-8 flex justify-center gap-2 pt-6">
					{#each Array(totalSteps) as _, i}
						<div
							class="h-2 w-2 rounded-full transition-all"
							class:bg-primary={i === currentStep}
							class:bg-base-300={i !== currentStep}
							role="progressbar"
							aria-valuenow={currentStep + 1}
							aria-valuemin={1}
							aria-valuemax={totalSteps}
						></div>
					{/each}
				</div>

				<!-- Actions -->
				<div class="card-actions mt-6 justify-center gap-3">
					<button class="btn btn-ghost btn-sm" onclick={handleSkip} aria-label="Skip onboarding"> Skip </button>
					<button
						class="btn btn-primary btn-sm"
						onclick={handleNext}
						disabled={isTestingConnection ||
							(currentStep === 1 && !connectionSuccess) ||
							(currentStep === 3 && !selectedCompanion)}
						aria-label={currentStep === totalSteps - 1 ? 'Complete onboarding' : 'Next step'}
					>
						{#if currentStep === totalSteps - 1}
							Complete Setup
						{:else}
							Next
						{/if}
					</button>
				</div>
			</div>
		</div>

		<!-- Footer text -->
		<p class="text-base-content/50 mt-8 text-center text-xs">
			Step {currentStep + 1} of {totalSteps}
		</p>
	</div>
</div>
