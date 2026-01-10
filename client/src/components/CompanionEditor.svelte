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

<div class="companion-editor bg-base-100 mx-auto max-w-2xl rounded-lg p-6 shadow-lg">
	<h2 class="mb-6 text-2xl font-bold">
		{isNew ? 'Customize Companion' : 'Edit Companion'}
	</h2>

	{#if saveError}
		<div class="alert alert-error mb-4" role="alert">
			<p>{saveError}</p>
		</div>
	{/if}

	<!-- Form -->
	<form
		class="space-y-4"
		onsubmit={(e) => {
			e.preventDefault();
			handleSave();
		}}
	>
		<!-- Name -->
		<div class="form-control">
			<label class="label" for="name">
				<span class="label-text font-semibold">Name *</span>
			</label>
			<input
				id="name"
				type="text"
				placeholder="e.g., My Assistant"
				class="input input-bordered"
				class:input-error={validationErrors.name}
				bind:value={name}
				disabled={isSaving}
				aria-label="Companion name"
				aria-required="true"
			/>
			{#if validationErrors.name}
				<label class="label" for="name">
					<span class="label-text-alt text-error">{validationErrors.name}</span>
				</label>
			{/if}
		</div>

		<!-- Description -->
		<div class="form-control">
			<label class="label" for="description">
				<span class="label-text font-semibold">Description</span>
			</label>
			<textarea
				id="description"
				placeholder="Brief description of this companion"
				class="textarea textarea-bordered h-20"
				bind:value={description}
				disabled={isSaving}
				aria-label="Companion description"
			></textarea>
		</div>

		<!-- System Prompt -->
		<div class="form-control">
			<label class="label" for="system-prompt">
				<span class="label-text font-semibold">System Prompt *</span>
			</label>
			<textarea
				id="system-prompt"
				placeholder="Base instructions for the AI..."
				class="textarea textarea-bordered h-32"
				class:textarea-error={validationErrors.systemPrompt}
				bind:value={systemPrompt}
				disabled={isSaving}
				aria-label="System prompt"
				aria-required="true"
			></textarea>
			{#if validationErrors.systemPrompt}
				<label class="label" for="system-prompt">
					<span class="label-text-alt text-error">{validationErrors.systemPrompt}</span>
				</label>
			{/if}
		</div>

		<!-- Model Selection -->
		<div class="form-control">
			<label class="label" for="model">
				<span class="label-text font-semibold">Model *</span>
			</label>
			<select
				id="model"
				class="select select-bordered"
				class:select-error={validationErrors.model}
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
				<label class="label" for="model">
					<span class="label-text-alt text-error">{validationErrors.model}</span>
				</label>
			{/if}
		</div>

		<div class="grid grid-cols-2 gap-4">
			<!-- Voice ID -->
			<div class="form-control">
				<label class="label" for="voice-id">
					<span class="label-text font-semibold">Voice ID</span>
				</label>
				<input
					id="voice-id"
					type="text"
					placeholder="e.g., alloy"
					class="input input-bordered"
					bind:value={voiceId}
					disabled={isSaving}
					aria-label="Voice ID"
				/>
			</div>

			<!-- Voice Tone -->
			<div class="form-control">
				<label class="label" for="voice-tone">
					<span class="label-text font-semibold">Voice Tone</span>
				</label>
				<select id="voice-tone" class="select select-bordered" bind:value={voiceTone} disabled={isSaving}>
					<option value="neutral">Neutral</option>
					<option value="fast">Fast</option>
					<option value="slow">Slow</option>
					<option value="deep">Deep</option>
					<option value="high">High</option>
				</select>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<!-- Mood -->
			<div class="form-control">
				<label class="label" for="mood">
					<span class="label-text font-semibold">Mood</span>
				</label>
				<select id="mood" class="select select-bordered" bind:value={mood} disabled={isSaving}>
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
			<div class="form-control">
				<label class="label" for="specialization">
					<span class="label-text font-semibold">Specialization</span>
				</label>
				<input
					id="specialization"
					type="text"
					placeholder="e.g., coding"
					class="input input-bordered"
					bind:value={specialization}
					disabled={isSaving}
					aria-label="Specialization"
				/>
			</div>
		</div>

		<!-- Avatar (optional) -->
		<div class="form-control">
			<label class="label" for="avatar">
				<span class="label-text font-semibold">Avatar URL</span>
			</label>
			<input
				id="avatar"
				type="text"
				placeholder="https://example.com/avatar.png"
				class="input input-bordered"
				bind:value={avatar}
				disabled={isSaving}
				aria-label="Avatar URL"
			/>
		</div>

		<!-- Form Actions -->
		<div class="card-actions border-base-300 justify-end gap-3 border-t pt-6">
			<button type="button" class="btn btn-ghost" onclick={handleCancel} disabled={isSaving} aria-label="Cancel editing">
				Cancel
			</button>
			<button
				type="submit"
				class="btn btn-primary"
				disabled={isSaving}
				aria-label={isNew ? 'Create companion' : 'Save changes'}
			>
				{#if isSaving}
					<span class="loading loading-spinner loading-sm"></span>
					Saving...
				{:else}
					{isNew ? 'Create Companion' : 'Save Changes'}
				{/if}
			</button>
		</div>
	</form>
</div>

<style>
	.companion-editor {
		animation: slideUp 300ms ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
