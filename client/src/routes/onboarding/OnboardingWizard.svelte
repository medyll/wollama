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
	const totalSteps = 3; // Profile/Auth + Server URL config + Companion selection

	// Step 0: Profile & Auth setup
	// Step 1: Server URL configuration (Ollama) - auto-tests connection
	// Step 2: Companion selection
	let serverUrl = $state(userState.preferences.ollamaUrl || 'http://localhost:11434');
	// Profile/Auth state
	let nickname = $state(userState.nickname || '');
	let isSharedMachine = $state(userState.isSecured || false);
	let password = $state('');
	let email = $state(userState.email || '');
	let profileError = $state('');
	let selectedCompanion: UserCompanion | null = $state(null);
	let isTestingConnection = $state(false);
	let connectionMessage = $state('');
	let connectionSuggestion = $state('');
	let connectionSuccess = $state(false);
	let hasAttemptedConnection = $state(false);
	let isImportingCompanions = $state(false);

	const steps = [
		{
			title: 'Set Up Your Profile',
			description: 'Choose a nickname and optional password (for shared machines).',
			icon: 'mdi:account-cog-outline'
		},
		{
			title: 'Configure Ollama Server',
			description: 'Enter the address of your Ollama server (usually http://localhost:11434 if running locally)',
			icon: 'mdi:server-network'
		},
		{
			title: 'Choose Your Companion',
			description: 'Select a companion to start your first conversation',
			icon: 'mdi:robot-face-outline'
		}
	];

	// Auto-test connection when entering step 1
	$effect(() => {
		if (currentStep === 1 && !hasAttemptedConnection) {
			hasAttemptedConnection = true;
			testConnection();
		}
	});

	// Auto-import companions when entering step 2 (companion selection)
	$effect(() => {
		if (currentStep === 2 && !isImportingCompanions) {
			importDefaultCompanions();
		}
	});

	function validateProfileStep() {
		profileError = '';
		if (!nickname.trim()) {
			profileError = 'Nickname is required';
			return false;
		}
		if (isSharedMachine && !password.trim()) {
			profileError = 'Password is required for shared machines';
			return false;
		}
		return true;
	}

	async function handleNext() {
		// If on profile step, persist profile/auth state
		if (currentStep === 0) {
			if (!validateProfileStep()) return;
			userState.nickname = nickname.trim();
			if (isSharedMachine) {
				userState.setLocalProtection(password);
				userState.email = email.trim() || null;
			} else {
				// Ensure local protection is disabled
				userState.password = null;
				userState.isSecured = false;
			}
			userState.save();
		}

		// If on companion selection step, ensure a companion is selected
		if (currentStep === 2) {
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
		// On companion selection step (final step), skip by going to chat without selection
		if (currentStep === 2) {
			completeOnboarding();
		} else if (currentStep < totalSteps - 1) {
			currentStep++;
		} else {
			completeOnboarding();
		}
	}

	async function importDefaultCompanions() {
		if (isImportingCompanions) return;

		isImportingCompanions = true;

		try {
			const userCompanionService = new DataGenericService<UserCompanion>('user_companions');

			// Check if companions already exist
			const existingCompanions = await userCompanionService.find({ user_id: userState.uid || '' });
			if (existingCompanions.length > 0) {
				// Already have companions, skip import
				isImportingCompanions = false;
				return;
			}

			// Import default companions in background
			for (const companion of DEFAULT_COMPANIONS) {
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
					is_locked: false,
					created_at: Date.now(),
					updated_at: Date.now()
				};

				await userCompanionService.create(userCompanion);
			}
		} catch (error) {
			console.error('Failed to import companions:', error);
		} finally {
			isImportingCompanions = false;
		}
	}
</script>

<svelte:head>
	<title>Welcome - Wollama</title>
</svelte:head>

<div class="from-base-100 to-base-200 flex min-h-screen items-center justify-center bg-linear-to-br p-4 overflow-auto">
	<div class="w-full flex flex-col items-center" class:max-w-md={currentStep !== 3} class:max-w-4xl={currentStep === 3}>
		<!-- Main Card -->
		<div class="card bg-base-100 shadow-xl w-full max-h-[90vh] overflow-y-auto" data-testid="onboarding-wizard">
			<div class="card-body py-6">
				<!-- Icon/Logo -->
				<div class="mb-4 flex justify-center flex-shrink-0">
					<Icon icon={steps[currentStep].icon} width="48" height="48" class="text-primary" />
				</div>

				<!-- Title -->
				<h1 class="card-title mb-2 justify-center text-center text-xl flex-shrink-0" data-testid="wizard-title">
					{steps[currentStep].title}
				</h1>

				<!-- Description -->
				<p class="text-base-content/70 mb-4 text-center text-sm flex-shrink-0">
					{steps[currentStep].description}
				</p>

				<!-- Step 0: Profile & Auth -->
				{#if currentStep === 0}
					<div class="space-y-4">
						<div class="form-control">
							<label class="label" for="nickname">
								<span class="label-text">Nickname</span>
							</label>
							<input
								type="text"
								id="nickname"
								placeholder="How should we call you?"
								class="input input-bordered w-full"
								bind:value={nickname}
							/>
						</div>

						<div class="form-control">
							<label class="label cursor-pointer justify-start gap-4">
								<input type="checkbox" class="checkbox checkbox-primary" bind:checked={isSharedMachine} />
								<span class="label-text">This is a shared machine (Secure my profile)</span>
							</label>
						</div>

						{#if isSharedMachine}
							<div class="form-control">
								<label class="label" for="password">
									<span class="label-text">Password / PIN</span>
								</label>
								<input
									type="password"
									id="password"
									placeholder="Enter a secure password"
									class="input input-bordered w-full"
									bind:value={password}
								/>
							</div>
							<div class="form-control">
								<label class="label" for="email">
									<span class="label-text">Email (Optional)</span>
								</label>
								<input
									type="email"
									id="email"
									placeholder="For recovery"
									class="input input-bordered w-full"
									bind:value={email}
								/>
							</div>
						{/if}

						{#if profileError}
							<div class="alert alert-error py-2 text-sm">
								<Icon icon="lucide:alert-circle" class="h-4 w-4" />
								<span>{profileError}</span>
							</div>
						{/if}
					</div>
				{/if}

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
							data-testid="server-url-input"
						/>
						<label class="label" for="server-url">
							<span class="label-text-alt text-xs opacity-70">Example: http://localhost:11434</span>
						</label>

						{#if isTestingConnection}
							<div class="mt-3 rounded-lg p-3 bg-info/20" role="alert" aria-live="polite">
								<p class="text-sm font-medium text-info flex items-center gap-2">
									<span class="loading loading-spinner loading-sm"></span>
									Testing connection...
								</p>
							</div>
						{:else if connectionMessage}
							<div
								class={`mt-3 rounded-lg p-3 transition-all ${connectionSuccess ? 'bg-success/20' : 'bg-warning/20'}`.trim()}
								role="alert"
								aria-live="polite"
								data-testid={connectionSuccess ? 'connection-success' : 'connection-error'}
							>
								<p
									class="text-sm font-medium"
									class:text-success={connectionSuccess}
									class:text-warning={!connectionSuccess && connectionMessage}
								>
									{connectionSuccess ? '✓ ' : '⚠ '}{connectionMessage}
								</p>
								{#if connectionSuggestion && !connectionSuccess}
									<p class="mt-2 text-xs opacity-80">
										{connectionSuggestion}
									</p>
								{/if}
								{#if !connectionSuccess}
									<p class="mt-2 text-xs opacity-70">
										You can continue anyway, but you'll need to configure Ollama later.
									</p>
								{/if}
							</div>
						{/if}
					</div>
				{/if}

				<!-- Step 2: Companion Selection -->
				{#if currentStep === 2}
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
					<button class="btn btn-ghost btn-sm" onclick={handleSkip} aria-label="Skip onboarding" data-testid="wizard-skip-button"> Skip </button>
					<button
						class="btn btn-primary btn-sm"
						onclick={handleNext}
						disabled={isTestingConnection ||
							(currentStep === 0 && (!nickname.trim() || (isSharedMachine && !password.trim()))) ||
							(currentStep === 2 && !selectedCompanion)}
						aria-label={currentStep === totalSteps - 1 ? 'Complete onboarding' : 'Next step'}
						data-testid="wizard-next-button"
					>
						{#if isTestingConnection}
							<span class="loading loading-spinner loading-sm"></span>
							Testing...
						{:else if currentStep === totalSteps - 1}
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
