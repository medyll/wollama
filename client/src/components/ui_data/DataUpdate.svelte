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

	async function handleSave() {
		loading = true;
		try {
			if (id) {
				const dataToSave = { ...formData, [tableDef.primaryKey]: id };
				await dataService.update(dataToSave);
			} else {
				// Create
				const dataToSave = { ...formData };
				if (tableDef.fields[tableDef.primaryKey].type === 'uuid') {
					dataToSave[tableDef.primaryKey] = crypto.randomUUID();
				}
				await dataService.create(dataToSave);
			}

			if (onSave) onSave(formData);
			isOpen = false;
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Unknown error';
			error = msg.split('\n')[0];
		} finally {
			loading = false;
		}
	}

	async function optimizePrompt(fieldName: string) {
		const currentContent = formData[fieldName];
		if (!currentContent) return;

		isOptimizing = true;
		try {
			const serverUrl = userState.preferences.serverUrl.replace(/\/$/, '');
			const locale = userState.preferences.locale;
			const response = await fetch(`${serverUrl}/api/chat/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					model: userState.preferences.defaultModel,
					stream: false,
					messages: [
						{
							role: 'system',
							content: `You are an expert prompt engineer. Your task is to rewrite the user's instruction to be a clear, concise, and effective system prompt for an LLM. It should define a user preference or behavior.
IMPORTANT:
1. Output ONLY the raw rewritten prompt.
2. Do NOT include any prefixes, labels, titles, or explanations.
3. Do not use quotation marks or any other enclosing characters.
4. Write in the THIRD PERSON, referring to "the user" (or "l'utilisateur", "el usuario", etc. depending on the language).
5. The rewritten prompt MUST be in the language corresponding to the locale '${locale}'.`
						},
						{ role: 'user', content: `Rewrite this instruction: "${currentContent}"` }
					]
				})
			});

			const data = await response.json();
			if (data.message?.content) {
				formData[fieldName] = data.message.content.trim();
				toast.success('Prompt optimized!');
			}
		} catch (e) {
			console.error(e);
			toast.error('Optimization failed');
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
				{#if tableName === 'user_prompts' && fieldName === 'content'}
					<button
						class="btn btn-circle btn-ghost btn-sm absolute right-2 bottom-2"
						onclick={() => optimizePrompt(fieldName)}
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
