<script lang="ts">
	import { onMount } from 'svelte';
	import type { Companion, UserCompanion } from '$types/data';
	import { companionService } from '$lib/services/companion.service';
	import { userState } from '$lib/state/user.svelte';

	interface Props {
		companion: (Companion & { isSystem?: boolean }) | UserCompanion | null;
		isNew?: boolean;
		onSave: (companion: UserCompanion) => void;
		onCancel: () => void;
	}

	let { companion, isNew = false, onSave, onCancel }: Props = $props();

	let name = $state('');
	let description = $state('');
	let systemPrompt = $state('');
	let model = $state('');
	let voiceId = $state('');
	let voiceTone = $state<'neutral' | 'fast' | 'slow' | 'deep' | 'high'>('neutral');
	let mood = $state<'neutral' | 'happy' | 'sad' | 'angry' | 'sarcastic' | 'professional' | 'friendly' | 'sexy'>('friendly');
	let avatar = $state('');
	let specialization = $state('');

	let isSaving = $state(false);
	let saveError: string | null = $state(null);
	let validationErrors: Record<string, string> = $state({});
	let availableModels: string[] = $state(['mistral:latest', 'codellama:latest', 'llama2:latest']);

	onMount(async () => {
		// Load companion data if editing existing
		if (companion && !isNew) {
			name = companion.name;
			description = companion.description || '';
			systemPrompt = companion.system_prompt;
			model = companion.model;
			voiceId = companion.voice_id || '';
			voiceTone = companion.voice_tone || 'neutral';
			mood = companion.mood || 'friendly';
			avatar = companion.avatar || '';
			specialization = companion.specialization || '';
		}

		// Try to fetch available models from Ollama server
		try {
			const ollamaUrl = userState.preferences.ollamaUrl || 'http://localhost:11434';
			const response = await fetch(`${ollamaUrl}/api/tags`);
			if (response.ok) {
				const data = await response.json();
				availableModels = data.models.map((m: any) => m.name);
			}
		} catch (err) {
			console.warn('Failed to fetch models from Ollama:', err);
			// Keep default hardcoded list
		}
	});

	function validateForm(): boolean {
		validationErrors = {};

		if (!name.trim()) {
			validationErrors.name = 'Name is required';
		} else if (name.length < 3) {
			validationErrors.name = 'Name must be at least 3 characters';
		} else if (name.length > 50) {
			validationErrors.name = 'Name must be at most 50 characters';
		}

		if (!systemPrompt.trim()) {
			validationErrors.systemPrompt = 'System prompt is required';
		} else if (systemPrompt.length < 10) {
			validationErrors.systemPrompt = 'System prompt must be at least 10 characters';
		}

		if (!model.trim()) {
			validationErrors.model = 'Model is required';
		}

		return Object.keys(validationErrors).length === 0;
	}

	async function handleSave() {
		if (!validateForm()) {
			saveError = 'Please fix validation errors before saving';
			return;
		}

		isSaving = true;
		saveError = null;

		try {
			const userId = userState.uid;
			if (!userId) {
				saveError = 'User not authenticated';
				return;
			}

			let newCompanion: UserCompanion;

			if (isNew && companion && 'companion_id' in companion && companion.companion_id) {
				// Fork from system companion
				newCompanion = await companionService.fork(companion.companion_id, userId);

				// Update with edited values
				newCompanion = await companionService.update({
					...newCompanion,
					name,
					description,
					system_prompt: systemPrompt,
					model,
					voice_id: voiceId,
					voice_tone: voiceTone,
					mood,
					avatar,
					specialization: (specialization as any) || undefined,
					updated_at: Date.now()
				});
			} else if (!isNew && companion && 'user_companion_id' in companion) {
				// Update existing user companion
				newCompanion = await companionService.update({
					...(companion as UserCompanion),
					name,
					description,
					system_prompt: systemPrompt,
					model,
					voice_id: voiceId,
					voice_tone: voiceTone,
					mood,
					avatar,
					specialization: (specialization as any) || undefined,
					updated_at: Date.now()
				});
			} else {
				saveError = 'Invalid companion data';
				return;
			}

			onSave(newCompanion);
		} catch (error) {
			saveError = `Failed to save companion: ${error instanceof Error ? error.message : String(error)}`;
			console.error('Save error:', error);
		} finally {
			isSaving = false;
		}
	}

	function handleCancel() {
		onCancel();
	}
</script>

<companion-editor>
	<h2 class="mb-6 text-2xl font-bold">
		{isNew ? 'Customize Companion' : 'Edit Companion'}
	</h2>

	{#if saveError}
		<div class="status-message" data-status="critical" role="alert">
			<p>{saveError}</p>
		</div>
	{/if}

	<!-- Form -->
	<form
		class="editor-form"
		onsubmit={(e) => {
			e.preventDefault();
			handleSave();
		}}
	>
		<!-- Name -->
		<div class="field-stack">
			<label for="name">
				<span class="field-label">Name *</span>
			</label>
			<input
				id="name"
				type="text"
				placeholder="e.g., My Assistant"
				aria-invalid={validationErrors.name ? 'true' : undefined}
				bind:value={name}
				disabled={isSaving}
				aria-label="Companion name"
				aria-required="true"
			/>
			{#if validationErrors.name}
				<label class="field-error" for="name">
					{validationErrors.name}
				</label>
			{/if}
		</div>

		<!-- Description -->
		<div class="field-stack">
			<label for="description"><span class="field-label">Description</span>
			</label>
			<textarea
				id="description"
				placeholder="Brief description of this companion"
				class="textarea-short"
				bind:value={description}
				disabled={isSaving}
				aria-label="Companion description"
			></textarea>
		</div>

		<!-- System Prompt -->
		<div class="field-stack">
			<label for="system-prompt"><span class="field-label">System Prompt *</span>
			</label>
			<textarea
				id="system-prompt"
				placeholder="Base instructions for the AI..."
				class="textarea-long"
				aria-invalid={validationErrors.systemPrompt ? 'true' : undefined}
				bind:value={systemPrompt}
				disabled={isSaving}
				aria-label="System prompt"
				aria-required="true"
			></textarea>
			{#if validationErrors.systemPrompt}
				<label class="field-error" for="system-prompt">
					{validationErrors.systemPrompt}
				</label>
			{/if}
		</div>

		<!-- Model Selection -->
		<div class="field-stack">
			<label for="model"><span class="field-label">Model *</span>
			</label>
			<select
				id="model"
				aria-invalid={validationErrors.model ? 'true' : undefined}
				bind:value={model}
				disabled={isSaving}
				aria-label="AI model"
				aria-required="true"
			>
				<option value="">Select a model...</option>
				{#each availableModels as m (m)}
					<option value={m}>{m}</option>
				{/each}
			</select>
			{#if validationErrors.model}
				<label class="field-error" for="model">
					{validationErrors.model}
				</label>
			{/if}
		</div>

		<div class="form-grid">
			<!-- Voice ID -->
			<div class="field-stack">
				<label for="voice-id"><span class="field-label">Voice ID</span>
				</label>
				<input
					id="voice-id"
					type="text"
					placeholder="e.g., alloy"
					bind:value={voiceId}
					disabled={isSaving}
					aria-label="Voice ID"
				/>
			</div>

			<!-- Voice Tone -->
			<div class="field-stack">
				<label for="voice-tone"><span class="field-label">Voice Tone</span>
				</label>
				<select id="voice-tone" bind:value={voiceTone} disabled={isSaving}>
					<option value="neutral">Neutral</option>
					<option value="fast">Fast</option>
					<option value="slow">Slow</option>
					<option value="deep">Deep</option>
					<option value="high">High</option>
				</select>
			</div>
		</div>

		<div class="form-grid">
			<!-- Mood -->
			<div class="field-stack">
				<label for="mood"><span class="field-label">Mood</span>
				</label>
				<select id="mood" bind:value={mood} disabled={isSaving}>
					<option value="neutral">Neutral</option>
					<option value="happy">Happy</option>
					<option value="sad">Sad</option>
					<option value="angry">Angry</option>
					<option value="sarcastic">Sarcastic</option>
					<option value="professional">Professional</option>
					<option value="friendly">Friendly</option>
					<option value="sexy">Sexy</option>
				</select>
			</div>

			<!-- Specialization -->
			<div class="field-stack">
				<label for="specialization"><span class="field-label">Specialization</span>
				</label>
				<input
					id="specialization"
					type="text"
					placeholder="e.g., coding"
					bind:value={specialization}
					disabled={isSaving}
					aria-label="Specialization"
				/>
			</div>
		</div>

		<!-- Avatar (optional) -->
		<div class="field-stack">
			<label for="avatar"><span class="field-label">Avatar URL</span>
			</label>
			<input
				id="avatar"
				type="text"
				placeholder="https://example.com/avatar.png"
				bind:value={avatar}
				disabled={isSaving}
				aria-label="Avatar URL"
			/>
		</div>

		<!-- Form Actions -->
		<editor-actions>
			<button type="button" class="btn-ghost" onclick={handleCancel} disabled={isSaving} aria-label="Cancel editing">
				Cancel
			</button>
			<button
				type="submit"
				class="btn-primary"
				disabled={isSaving}
				aria-label={isNew ? 'Create companion' : 'Save changes'}
			>
				{#if isSaving}
					<span class="loading-ellipsis" aria-label="Saving">Loading</span>
					Saving...
				{:else}
					{isNew ? 'Create Companion' : 'Save Changes'}
				{/if}
			</button>
		</editor-actions>
	</form>
</companion-editor>

<style>
	@layer components {
		companion-editor,
		editor-actions {
			display: flex;
		}

		companion-editor {
			width: min(100%, 48rem);
			margin-inline: auto;
			padding: var(--pad-xl);
			flex-direction: column;
			background: var(--color-surface);
			border: var(--border-width) solid var(--color-border);
			border-radius: var(--radius-lg);
			box-shadow: var(--shadow-md);
			animation: slide-up var(--duration-slower) var(--ease-out);
		}

		.editor-form,
		.field-stack {
			display: flex;
			flex-direction: column;
		}

		.editor-form {
			gap: var(--gap-lg);
		}

		.field-stack {
			gap: var(--gap-xs);
		}

		.field-label {
			font-weight: var(--font-semibold);
		}

		.field-error {
			color: var(--color-critical);
			font-size: var(--text-sm);
		}

		textarea[aria-invalid='true'],
		input[aria-invalid='true'],
		select[aria-invalid='true'] {
			border-color: var(--color-critical);
		}

		.textarea-short {
			min-height: 5rem;
		}

		.textarea-long {
			min-height: 9rem;
		}

		.form-grid {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: var(--gap-lg);
		}

		editor-actions {
			justify-content: flex-end;
			gap: var(--gap-md);
			padding-block-start: var(--pad-xl);
			border-top: var(--border-width) solid var(--color-border);
		}

		@media (max-width: 40rem) {
			companion-editor {
				padding: var(--pad-lg);
			}

			.form-grid {
				grid-template-columns: 1fr;
			}

			editor-actions {
				flex-direction: column-reverse;
			}

			editor-actions button {
				width: 100%;
			}
		}

		@keyframes slide-up {
			from {
				opacity: 0;
				transform: translateY(var(--pad-lg));
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
	}
</style>
