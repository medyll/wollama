<script lang="ts">
	import { appSchema } from '../../../../shared/db/database-scheme';
	import { DataGenericService } from '$lib/services/data-generic.service';
	import { userState } from '$lib/state/user.svelte';
	import { toast } from '$lib/state/notifications.svelte';
	import Icon from '@iconify/svelte';

	let { tableName, id = undefined, isOpen = $bindable(false), onSave = undefined, data = {} } = $props();

	let formData = $state<any>({ ...data });
	let loading = $state(false);
	let error = $state<string | null>(null);
	let isOptimizing = $state(false);

	let tableDef = $derived(appSchema[tableName]);
	let dataService = $derived(new DataGenericService(tableName));

	$effect(() => {
		if (isOpen) {
			if (id) {
				loadData();
			} else {
				formData = { ...data };
			}
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
	<div class="form-control w-full">
		<label class="label pb-1" for={`field-${fieldName}`}>
			<span class="label-text w-32 shrink-0 text-sm font-medium capitalize">{fieldName.replace(/_/g, ' ')}</span>
		</label>
		<div class="flex-1">
			{#if fieldDef.type === 'boolean' || (fieldDef.ui && fieldDef.ui.type === 'toggle')}
				<input
					type="checkbox"
					id={`field-${fieldName}`}
					class="toggle toggle-primary"
					bind:checked={formData[fieldName]}
				/>
			{:else if fieldDef.type === 'text-long' || (fieldDef.ui && fieldDef.ui.type === 'textarea')}
				<div class="relative">
					<textarea
						id={`field-${fieldName}`}
						class="textarea textarea-bordered h-24 w-full resize-none text-sm"
						bind:value={formData[fieldName]}
						placeholder={`Enter ${fieldName.replace(/_/g, ' ')}...`}
					></textarea>
					{#if fieldDef.ai && fieldDef.ai.trigger === 'manual'}
						<button
							class="btn btn-circle btn-ghost btn-sm absolute right-2 bottom-2"
							onclick={() => handleAiAction(fieldName, fieldDef.ai)}
							disabled={isOptimizing}
							title="Optimize with AI"
						>
							{#if isOptimizing}
								<span class="loading loading-spinner loading-xs"></span>
							{:else}
								<Icon icon="lucide:sparkles" class="text-primary" />
							{/if}
						</button>
					{/if}
				</div>
			{:else if fieldDef.type === 'number' || (fieldDef.ui && fieldDef.ui.type === 'slider')}
				<input
					type="number"
					id={`field-${fieldName}`}
					class="input input-bordered input-sm w-full text-sm"
					bind:value={formData[fieldName]}
					placeholder="0"
				/>
			{:else if fieldDef.enum}
				<select
					id={`field-${fieldName}`}
					class="select select-bordered select-sm w-full text-sm"
					bind:value={formData[fieldName]}
				>
					<option disabled selected value="">Select...</option>
					{#each fieldDef.enum as option}
						<option value={option}>{option}</option>
					{/each}
				</select>
			{:else}
				<input
					type="text"
					id={`field-${fieldName}`}
					class="input input-bordered input-sm w-full text-sm"
					bind:value={formData[fieldName]}
					placeholder={`Enter ${fieldName.replace(/_/g, ' ')}...`}
				/>
			{/if}
		</div>
	</div>
{/snippet}

<dialog class="modal" class:modal-open={isOpen}>
	<div class="modal-box w-11/12 max-w-4xl">
		<button class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2" onclick={() => (isOpen = false)} aria-label="Close"
			>✕</button
		>

		<h3 class="mb-6 text-xl font-bold capitalize">
			{id ? 'Edit' : 'Create'}
			{tableName.replace(/_/g, ' ')}
		</h3>

		{#if loading}
			<div class="flex justify-center p-8">
				<span class="loading loading-spinner loading-lg"></span>
			</div>
		{:else}
			{#if error}
				<div class="alert alert-error mb-4 shadow-lg">
					<Icon icon="mdi:alert-circle" />
					<span>{error}</span>
				</div>
			{/if}

			<div class="max-h-[65vh] space-y-3 overflow-y-auto pr-2">
				<!-- Regular Fields Section -->
				{#if regularFields.length > 0}
					<div class="bg-base-200/30 space-y-3 rounded-lg p-4">
						<h4 class="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase opacity-70">
							<Icon icon="mdi:format-list-bulleted" class="h-4 w-4" />
							General Information
						</h4>
						{#each regularFields as [fieldName, fieldDef]}
							{@render fieldInput(fieldName, fieldDef)}
						{/each}
					</div>
				{/if}

				<!-- FK Fields Section -->
				{#if fkFields.length > 0}
					<div class="bg-base-200/30 space-y-3 rounded-lg p-4">
						<h4 class="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase opacity-70">
							<Icon icon="mdi:link-variant" class="h-4 w-4" />
							Relations
						</h4>
						{#each fkFields as [fieldName, fieldDef]}
							{@render fieldInput(fieldName, fieldDef)}
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<div class="modal-action mt-6">
			<button class="btn btn-ghost" onclick={() => (isOpen = false)}>Cancel</button>
			<button class="btn btn-primary" onclick={handleSave} disabled={loading}>
				{#if loading}
					<span class="loading loading-spinner loading-sm"></span>
				{/if}
				Save Changes
			</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={() => (isOpen = false)}>close</button>
	</form>
</dialog>
