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
	<label class="form-control">
		<div class="label">
			<span class="label-text capitalize">{fieldName.replace(/_/g, ' ')}</span>
		</div>
		{#if fieldDef.type === 'boolean' || (fieldDef.ui && fieldDef.ui.type === 'toggle')}
			<input type="checkbox" class="toggle" bind:checked={formData[fieldName]} />
		{:else if fieldDef.type === 'text-long' || (fieldDef.ui && fieldDef.ui.type === 'textarea')}
			<div class="relative">
				<textarea class="textarea textarea-bordered h-24 w-full" bind:value={formData[fieldName]}></textarea>
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
			<input type="number" class="input input-bordered" bind:value={formData[fieldName]} />
		{:else if fieldDef.enum}
			<select class="select select-bordered" bind:value={formData[fieldName]}>
				{#each fieldDef.enum as option}
					<option value={option}>{option}</option>
				{/each}
			</select>
		{:else}
			<input type="text" class="input input-bordered" bind:value={formData[fieldName]} />
		{/if}
	</label>
{/snippet}

<dialog class="modal" class:modal-open={isOpen}>
	<div class="modal-box w-11/12 max-w-5xl">
		<h3 class="mb-4 text-lg font-bold">Edit {tableName}</h3>

		{#if loading}
			<div class="flex justify-center p-4">
				<span class="loading loading-spinner"></span>
			</div>
		{:else}
			{#if error}
				<div class="alert alert-error mb-4">
					<span>{error}</span>
				</div>
			{/if}
			<div class="flex max-h-[70vh] flex-col gap-4 overflow-y-auto p-1">
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<!-- Left Column: Regular Fields -->
					<div class="flex flex-col gap-4">
						<h4 class="font-semibold opacity-50">General</h4>
						{#each regularFields as [fieldName, fieldDef]}
							{@render fieldInput(fieldName, fieldDef)}
						{/each}
					</div>

					<!-- Right Column: FK Fields -->
					{#if fkFields.length > 0}
						<div class="flex flex-col gap-4 border-l pl-0 md:pl-6">
							<h4 class="font-semibold opacity-50">Relations</h4>
							{#each fkFields as [fieldName, fieldDef]}
								{@render fieldInput(fieldName, fieldDef)}
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<div class="modal-action">
			<button class="btn" onclick={() => (isOpen = false)}>Cancel</button>
			<button class="btn btn-primary" onclick={handleSave} disabled={loading}>Save</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={() => (isOpen = false)}>close</button>
	</form>
</dialog>
