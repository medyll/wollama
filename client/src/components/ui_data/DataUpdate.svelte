<script lang="ts">
	import { appSchema } from '../../../../shared/db/database-scheme';
	import { DataGenericService } from '$lib/services/data-generic.service';
	import { userState } from '$lib/state/user.svelte';
	import { toast } from '$lib/state/notifications.svelte';
	import Icon from '@iconify/svelte';

	let { tableName, id = undefined, isOpen = $bindable(false), onSave = undefined, data = {} } = $props();

	let formData = $state<any>({});
	let loading = $state(false);
	let error = $state<string | null>(null);
	let isOptimizing = $state(false);
	let dialogRef: HTMLDialogElement | undefined = $state();

	let tableDef = $derived(appSchema[tableName]);
	let dataService = $derived(new DataGenericService(tableName));

	$effect(() => {
		if (isOpen) {
			if (id) {
				loadData();
			} else {
				formData = { ...data };
			}
			// Show modal
			dialogRef?.showModal?.();
		} else {
			// Close modal
			dialogRef?.close?.();
			// Reset state when modal closes
			formData = {};
			error = null;
		}
	});

	async function loadData() {
		loading = true;
		try {
			const dbData = await dataService.get(id);
			if (dbData) {
				// Filter out internal fields and resolved fields
				const cleanData = { ...(dbData as any) };
				delete cleanData._resolved;
				delete cleanData._rev;
				formData = { ...cleanData, ...data };
			}
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Unknown error';
			error = msg.split('\n')[0];
		} finally {
			loading = false;
		}
	}

	async function processAiField(content: string, aiDef: any) {
		if (!content) return null;

		try {
			const serverUrl = userState.preferences.serverUrl.replace(/\/$/, '');
			const locale = userState.preferences.locale;

			// Replace placeholders in system prompt
			let systemPrompt = aiDef.systemPrompt.replace('{{locale}}', locale);

			const response = await fetch(`${serverUrl}/api/chat/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					model: aiDef.model || userState.preferences.defaultModel,
					stream: false,
					messages: [
						{
							role: 'system',
							content: systemPrompt
						},
						{ role: 'user', content: `Rewrite this instruction: "${content}"` }
					]
				})
			});

			const data = await response.json();
			if (data.message?.content) {
				return data.message.content.trim();
			}
		} catch (e) {
			console.error(e);
			throw e;
		}
		return null;
	}

	async function handleSave() {
		loading = true;
		try {
			let dataToSave = { ...formData };

			// Auto Pre-processing
			for (const [fieldName, fieldDef] of Object.entries(tableDef.fields)) {
				if (fieldDef.ai && fieldDef.ai.trigger === 'auto_pre') {
					toast.info(`Processing ${fieldName} with AI...`);
					const content = dataToSave[fieldName];
					const result = await processAiField(content, fieldDef.ai);

					if (result) {
						if (fieldDef.ai.outputMode === 'append') {
							dataToSave[fieldName] = (dataToSave[fieldName] + '\n' + result).trim();
						} else {
							dataToSave[fieldName] = result;
						}
					}
				}
			}

			let savedData;
			if (id) {
				dataToSave[tableDef.primaryKey] = id;
				savedData = await dataService.update(dataToSave);
			} else {
				// Create
				if (tableDef.fields[tableDef.primaryKey].type === 'uuid') {
					dataToSave[tableDef.primaryKey] = crypto.randomUUID();
				}
				savedData = await dataService.create(dataToSave);
			}

			// Auto Post-processing
			let hasPostUpdates = false;
			let postUpdatePayload = { ...(savedData as any) };

			for (const [fieldName, fieldDef] of Object.entries(tableDef.fields)) {
				if (fieldDef.ai && fieldDef.ai.trigger === 'auto_post') {
					toast.info(`Post-processing ${fieldName} with AI...`);
					const content = postUpdatePayload[fieldName];
					const result = await processAiField(content, fieldDef.ai);

					if (result) {
						if (fieldDef.ai.outputMode === 'append') {
							postUpdatePayload[fieldName] = (postUpdatePayload[fieldName] + '\n' + result).trim();
						} else {
							postUpdatePayload[fieldName] = result;
						}
						hasPostUpdates = true;
					}
				}
			}

			if (hasPostUpdates && savedData) {
				await dataService.update(postUpdatePayload);
			}

			if (onSave) onSave(formData);
			isOpen = false;
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Unknown error';
			// Ignore conflict errors (409) if we just saved successfully
			if (msg.includes('409') || msg.includes('conflict')) {
				if (onSave) onSave(formData);
				isOpen = false;
				return;
			}
			error = msg.split('\n')[0];
			toast.error('Save failed: ' + error);
		} finally {
			loading = false;
		}
	}

	async function handleAiAction(fieldName: string, aiDef: any) {
		const content = formData[fieldName];
		if (!content) return;

		isOptimizing = true;
		try {
			const result = await processAiField(content, aiDef);
			if (result) {
				if (aiDef.outputMode === 'append') {
					formData[fieldName] = (formData[fieldName] + '\n' + result).trim();
				} else {
					formData[fieldName] = result;
				}
				toast.success('AI Action completed!');
			}
		} catch (e) {
			toast.error('AI Action failed');
		} finally {
			isOptimizing = false;
		}
	}

	function isFieldEditable(fieldName: string, fieldDef: any) {
		if (fieldDef.auto) return false;
		if (fieldName === tableDef.primaryKey) return false;
		return true;
	}

	let regularFields = $derived(
		Object.entries(tableDef.fields).filter(([fieldName, fieldDef]) => {
			if (!isFieldEditable(fieldName, fieldDef)) return false;
			return !(tableDef.fk && tableDef.fk[fieldName]);
		})
	);

	let fkFields = $derived(
		Object.entries(tableDef.fields).filter(([fieldName, fieldDef]) => {
			if (!isFieldEditable(fieldName, fieldDef)) return false;
			return !!(tableDef.fk && tableDef.fk[fieldName]);
		})
	);
</script>

{#snippet fieldInput(fieldName: string, fieldDef: any)}
	<div class="field-stack">
		<label for={`field-${fieldName}`}>
			<span class="field-label">{fieldName.replace(/_/g, ' ')}</span>
		</label>
		<div class="field-control">
			{#if fieldDef.type === 'boolean' || (fieldDef.ui && fieldDef.ui.type === 'toggle')}
				<input type="checkbox" id={`field-${fieldName}`} bind:checked={formData[fieldName]} />
			{:else if fieldDef.type === 'text-long' || (fieldDef.ui && fieldDef.ui.type === 'textarea')}
				<div class="field-with-action">
					<textarea
						id={`field-${fieldName}`}
						class="field-textarea"
						bind:value={formData[fieldName]}
						placeholder={`Enter ${fieldName.replace(/_/g, ' ')}...`}
					></textarea>
					{#if fieldDef.ai && fieldDef.ai.trigger === 'manual'}
						<button
							class="btn-icon btn-sm field-action"
							onclick={() => handleAiAction(fieldName, fieldDef.ai)}
							disabled={isOptimizing}
							title="Optimize with AI"
						>
							{#if isOptimizing}
								<span class="loading-ellipsis" aria-label="Optimizing">Loading</span>
							{:else}
								<Icon icon="lucide:sparkles" class="text-primary" />
							{/if}
						</button>
					{/if}
				</div>
			{:else if fieldDef.type === 'number' || (fieldDef.ui && fieldDef.ui.type === 'slider')}
				<input type="number" id={`field-${fieldName}`} class="w-full" bind:value={formData[fieldName]} placeholder="0" />
			{:else if fieldDef.enum}
				<select id={`field-${fieldName}`} class="w-full" bind:value={formData[fieldName]}>
					<option disabled selected value="">Select...</option>
					{#each fieldDef.enum as option}
						<option value={option}>{option}</option>
					{/each}
				</select>
			{:else}
				<input
					type="text"
					id={`field-${fieldName}`}
					class="w-full"
					bind:value={formData[fieldName]}
					placeholder={`Enter ${fieldName.replace(/_/g, ' ')}...`}
				/>
			{/if}
		</div>
	</div>
{/snippet}

<dialog
	bind:this={dialogRef}
	class="data-dialog"
	oncancel={(e) => {
		e.preventDefault();
		isOpen = false;
	}}
>
	<data-dialog-panel>
		<button
			class="btn-icon btn-sm dialog-close"
			onclick={() => {
				isOpen = false;
			}}
			aria-label="Close"
			tabindex="0">✕</button
		>

		<h3 class="mb-6 text-xl font-bold capitalize">
			{id ? 'Edit' : 'Create'}
			{tableName.replace(/_/g, ' ')}
		</h3>

		{#if loading}
			<data-dialog-state aria-busy="true"><span class="loading-ellipsis">Loading</span></data-dialog-state>
		{:else}
			{#if error}
				<div class="status-message" data-status="critical" role="alert">
					<Icon icon="mdi:alert-circle" />
					<span>{error}</span>
				</div>
			{/if}

			<data-form-sections>
				<!-- Regular Fields Section -->
				{#if regularFields.length > 0}
					<section class="data-form-section">
						<h4 class="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase opacity-70">
							<Icon icon="mdi:format-list-bulleted" class="h-4 w-4" />
							General Information
						</h4>
						{#each regularFields as [fieldName, fieldDef]}
							{@render fieldInput(fieldName, fieldDef)}
						{/each}
					</section>
				{/if}

				<!-- FK Fields Section -->
				{#if fkFields.length > 0}
					<section class="data-form-section">
						<h4 class="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase opacity-70">
							<Icon icon="mdi:link-variant" class="h-4 w-4" />
							Relations
						</h4>
						{#each fkFields as [fieldName, fieldDef]}
							{@render fieldInput(fieldName, fieldDef)}
						{/each}
					</section>
				{/if}
			</data-form-sections>
		{/if}

		<data-dialog-actions>
			<button
				class="btn-ghost"
				onclick={() => {
					isOpen = false;
				}}
				tabindex="0"
			>
				Cancel
			</button>
			<button class="btn-primary" onclick={handleSave} disabled={loading}>
				{#if loading}
					<span class="loading-ellipsis" aria-label="Saving">Loading</span>
				{/if}
				Save Changes
			</button>
		</data-dialog-actions>
	</data-dialog-panel>
	<!-- Backdrop: Clicking outside closes the modal -->
	<!-- svelte-ignore a11y_consider_explicit_label -->
	<form method="dialog" class="dialog-dismiss">
		<button
			type="submit"
			onclick={(e) => {
				e.preventDefault();
				isOpen = false;
			}}
			tabindex="-1"
			class="dialog-dismiss-button"
		></button>
	</form>
</dialog>

<style>
	@layer components {
		.data-dialog {
			width: min(94vw, 64rem);
			max-height: 90dvh;
			margin: auto;
			padding: 0;
			border: 0;
			background: transparent;
			color: var(--color-text);
			overflow: visible;
		}

		.data-dialog::backdrop {
			background: color-mix(in srgb, var(--color-text) 45%, transparent);
			backdrop-filter: blur(2px);
		}

		data-dialog-panel,
		data-dialog-state,
		data-form-sections,
		data-dialog-actions {
			display: flex;
		}

		data-dialog-panel {
			position: relative;
			z-index: var(--z-dropdown);
			flex-direction: column;
			max-height: 90dvh;
			padding: var(--pad-xl);
			background: var(--color-surface);
			border: var(--border-width) solid var(--color-border);
			border-radius: var(--radius-lg);
			box-shadow: var(--shadow-xl);
		}

		.dialog-close {
			position: absolute;
			top: var(--pad-md);
			right: var(--pad-md);
		}

		data-dialog-state {
			min-block-size: 10rem;
			align-items: center;
			justify-content: center;
		}

		data-form-sections {
			flex-direction: column;
			gap: var(--gap-md);
			max-height: 65dvh;
			overflow-y: auto;
			padding-inline-end: var(--pad-xs);
		}

		.data-form-section {
			display: flex;
			flex-direction: column;
			gap: var(--gap-md);
			padding: var(--pad-lg);
			background: var(--color-surface-raised);
			border-radius: var(--radius-md);
		}

		.field-stack,
		.field-control {
			display: flex;
			width: 100%;
			flex-direction: column;
			gap: var(--gap-xs);
		}

		.field-label {
			font-size: var(--text-sm);
			font-weight: var(--font-medium);
			text-transform: capitalize;
		}

		.field-with-action {
			position: relative;
		}

		.field-textarea {
			width: 100%;
			min-height: 7rem;
			padding-inline-end: calc(var(--pad-xl) + var(--pad-lg));
			resize: vertical;
		}

		.field-action {
			position: absolute;
			right: var(--pad-sm);
			bottom: var(--pad-sm);
		}

		data-dialog-actions {
			justify-content: flex-end;
			gap: var(--gap-md);
			padding-block-start: var(--pad-lg);
		}

		.dialog-dismiss {
			position: fixed;
			inset: 0;
		}

		.dialog-dismiss-button {
			width: 100%;
			height: 100%;
			padding: 0;
			border: 0;
			background: transparent;
			cursor: default;
		}

		@media (max-width: 40rem) {
			data-dialog-panel {
				padding: var(--pad-lg);
			}

			data-dialog-actions {
				flex-direction: column-reverse;
			}

			data-dialog-actions button {
				width: 100%;
			}
		}
	}
</style>
