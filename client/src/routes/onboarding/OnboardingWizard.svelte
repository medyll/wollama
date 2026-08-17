<script lang="ts">
	import { goto } from '$app/navigation';
	import { userState } from '$lib/state/user.svelte';
	import Icon from '@iconify/svelte';
	import { testOllamaConnection, normalizeServerUrl } from '$lib/services/ollama.service';
	import CompanionSelector from '$components/CompanionSelector.svelte';
	import type { UserCompanion } from '$types/data';
	import { DEFAULT_COMPANIONS } from '../../../../shared/configuration/data-default';
	import { DataGenericService } from '$lib/services/data-generic.service';
	import { uiState } from '$lib/state/ui.svelte';

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
	let hasAttemptedCompanionImport = $state(false);

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

	// Auto-test connection when entering step 1; auto-advance if the default
	// Ollama URL is already reachable so dev/local users aren't forced to
	// manually click through a step that already just works.
	$effect(() => {
		if (currentStep === 1 && !hasAttemptedConnection) {
			hasAttemptedConnection = true;
			testConnection().then(() => {
				if (connectionSuccess) {
					setTimeout(() => {
						if (currentStep === 1) currentStep++;
					}, 600);
				}
			});
		}
	});

	// Auto-import companions when entering step 2 (companion selection)
	$effect(() => {
		if (currentStep === 2 && !hasAttemptedCompanionImport) {
			hasAttemptedCompanionImport = true;
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
			uiState.setActiveCompanionId(selectedCompanion?.user_companion_id);
			goto('/chat/new');
		} catch (error) {
			console.error('Failed to complete onboarding:', error);
		}
	}

	function handleSkip() {
		// Skip means skip the whole wizard — straight to chat with defaults.
		if (currentStep === 0 && nickname.trim()) {
			userState.nickname = nickname.trim();
			userState.save();
		}
		completeOnboarding();
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

<onboarding-component>
	<onboarding-panel data-step={currentStep === 2 ? 'companions' : 'form'} data-testid="onboarding-wizard">
		<onboarding-header>
			<Icon icon={steps[currentStep].icon} width="48" height="48" class="text-primary" />
			<h1 data-testid="wizard-title">{steps[currentStep].title}</h1>
			<p>{steps[currentStep].description}</p>
		</onboarding-header>

		<onboarding-body>
				{#if currentStep === 0}
					<form class="form-stack" onsubmit={(event) => { event.preventDefault(); handleNext(); }}>
						<div class="field-stack">
							<label for="nickname">Nickname</label>
							<input
								type="text"
								id="nickname"
								placeholder="How should we call you?"
								bind:value={nickname}
							/>
						</div>

						<div>
							<label class="checkbox-row">
								<input type="checkbox" bind:checked={isSharedMachine} />
								<span>This is a shared machine (Secure my profile)</span>
							</label>
						</div>

						{#if isSharedMachine}
							<div class="field-stack">
								<label for="password">Password / PIN</label>
								<input
									type="password"
									id="password"
									placeholder="Enter a secure password"
									bind:value={password}
								/>
							</div>
							<div class="field-stack">
								<label for="email">Email (Optional)</label>
								<input
									type="email"
									id="email"
									placeholder="For recovery"
									bind:value={email}
								/>
							</div>
						{/if}

						{#if profileError}
							<div class="status-message" data-status="critical" role="alert">
								<Icon icon="lucide:alert-circle" class="h-4 w-4" />
								<span>{profileError}</span>
							</div>
						{/if}
					</form>
				{/if}

				{#if currentStep === 1}
					<div class="field-stack">
						<label for="server-url">Ollama Server URL</label>
						<input
							id="server-url"
							type="text"
							placeholder="http://localhost:11434"
							bind:value={serverUrl}
							disabled={isTestingConnection}
							aria-label="Server URL input"
							data-testid="server-url-input"
						/>
						<small>Example: http://localhost:11434</small>

						{#if isTestingConnection}
							<div class="status-message" role="status" aria-live="polite">
								<p>
									Testing connection...
								</p>
							</div>
						{:else if connectionMessage}
							<div
								class="status-message"
								data-status={connectionSuccess ? 'success' : 'critical'}
								role="alert"
								aria-live="polite"
								data-testid={connectionSuccess ? 'connection-success' : 'connection-error'}
							>
								<p>
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

				{#if currentStep === 2}
					<CompanionSelector
						onSelect={(companion) => {
							selectedCompanion = companion;
						}}
					/>
				{/if}
		</onboarding-body>

		<onboarding-footer>
			<div
				class="onboarding-progress"
				role="progressbar"
				aria-label={`Step ${currentStep + 1} of ${totalSteps}`}
				aria-valuenow={currentStep + 1}
				aria-valuemin={1}
				aria-valuemax={totalSteps}
			>
				{#each Array(totalSteps) as _, i}
					<span aria-current={i === currentStep ? 'step' : undefined}></span>
				{/each}
				<small>Step {currentStep + 1} of {totalSteps}</small>
			</div>
			<div class="toolbar">
					<button class="btn-ghost btn-sm" onclick={handleSkip} aria-label="Skip onboarding" data-testid="wizard-skip-button">Skip</button>
					<button
						class="btn-primary btn-sm"
						onclick={handleNext}
						disabled={isTestingConnection ||
							(currentStep === 0 && (!nickname.trim() || (isSharedMachine && !password.trim()))) ||
							(currentStep === 2 && !selectedCompanion)}
						aria-label={currentStep === totalSteps - 1 ? 'Complete onboarding' : 'Next step'}
						data-testid="wizard-next-button"
					>
						{#if isTestingConnection}
							Testing...
						{:else if currentStep === totalSteps - 1}
							Complete Setup
						{:else}
							Next
						{/if}
					</button>
			</div>
		</onboarding-footer>
	</onboarding-panel>
</onboarding-component>
