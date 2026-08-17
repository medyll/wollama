<script lang="ts">
	import { t } from '$lib/state/i18n.svelte';
	import { toast } from '$lib/state/notifications.svelte';
	import Icon from '@iconify/svelte';
	import AudioToggle from '$components/chat/AudioToggle.svelte';
	import DataButton from '$components/ui_data/DataButton.svelte';
	import SkillAutocomplete from '$components/SkillAutocomplete.svelte';
	import type { Companion, UserCompanion } from '$types/data';

	let {
		value = $bindable(''),
		files = $bindable([]),
		isRecording = false,
		isTranscribing = false,
		currentCompagnon,
		models = [],
		chatId,
		onsend,
		onrecord,
		oncompanionclick,
		onmodelchange
	} = $props<{
		value: string;
		files: string[];
		isRecording: boolean;
		isTranscribing: boolean;
		currentCompagnon: Companion | UserCompanion;
		models?: string[];
		chatId?: string;
		onsend: () => void;
		onrecord: () => void;
		oncompanionclick: () => void;
		onmodelchange: (model: string) => void;
	}>();

	let modelOptions = $derived(
		Array.from(new Set([currentCompagnon.model, ...models].filter((model): model is string => Boolean(model))))
	);

	let fileInput: HTMLInputElement;
	let textareaRef: HTMLTextAreaElement;
	let showAutocomplete = $state(false);

	function autoResize(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		target.style.height = 'auto';
		target.style.height = target.scrollHeight + 'px';
	}

	function triggerFileInput() {
		fileInput.click();
	}

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files) {
			Array.from(input.files).forEach((file) => {
				if (file.size > 2 * 1024 * 1024) {
					toast.error(t('ui.file_too_large', { name: file.name }));
					return;
				}
				const reader = new FileReader();
				reader.onload = (e) => {
					if (e.target?.result) {
						const res = e.target.result as string;
						if (!files.includes(res)) {
							files = [...files, res];
						}
					}
				};
				reader.readAsDataURL(file);
			});
		}
		// Reset input
		input.value = '';
	}

	function removeFile(index: number) {
		files = files.filter((_: any, i: number) => i !== index);
	}

	// Reset height when value is cleared (handled via effect or just rely on autoResize on input)
	$effect(() => {
		if (value === '' && textareaRef) {
			textareaRef.style.height = 'auto';
		}

		// Show autocomplete when user types a leading slash
		showAutocomplete = !!(value && value.trim().startsWith('/'));
	});
</script>

<chat-composer-component>
	<!-- File Previews -->
	{#if files.length > 0}
		<div class="mb-2 flex gap-2 overflow-x-auto p-2">
			{#each files as file, i}
				<div class="group relative shrink-0">
					{#if file.startsWith('data:image')}
						<img src={file} alt="preview" class="file-preview" />
					{:else}
						<div class="file-preview file-placeholder">
							<Icon icon="lucide:file" class="h-8 w-8 opacity-50" />
							<span class="text-[10px] opacity-50">File</span>
						</div>
					{/if}
					<button
						class="file-remove"
						onclick={() => removeFile(i)}
						title={t('ui.remove_file') || 'Remove file'}
						aria-label={t('ui.remove_file') || 'Remove file'}>✕</button
					>
				</div>
			{/each}
		</div>
	{/if}

	<div class="composer-surface">
		<header class="chat-composer-toolbar">
			<div class="chat-runtime-controls">
				<button
					type="button"
					class="companion-control"
					onclick={oncompanionclick}
					title={t('ui.choose_companion') || 'Choose companion'}
					aria-label={t('ui.choose_companion') || 'Choose companion'}
				>
					<span class="companion-dot" aria-hidden="true"></span>
					<strong>{currentCompagnon.name}</strong>
				</button>
				<label class="model-control">
					<span class="sr-only">Model</span>
					<select
						name="model"
						value={currentCompagnon.model}
						onchange={(event) => onmodelchange(event.currentTarget.value)}
						aria-label="Model"
						title="Model"
					>
						{#each modelOptions as model}
							<option value={model}>{model}</option>
						{/each}
					</select>
				</label>
			</div>

			<div class="composer-toolbar-actions">
				<AudioToggle />
				{#if chatId}
					<DataButton table="chats" table_id={chatId} mode="delete" confirm={true} />
				{/if}
			</div>
		</header>

		<textarea
			bind:this={textareaRef}
			placeholder={t('ui.type_message')}
			aria-label={t('ui.type_message')}
			aria-describedby="composer-hint"
			class="composer-input"
			name="message"
			autocomplete="off"
			rows="1"
			bind:value
			oninput={autoResize}
			onkeydown={(e) => {
				if (e.key === 'Enter' && !e.shiftKey) {
					e.preventDefault();
					onsend();
				}
			}}
			data-testid="message-input"
		></textarea>

		{#if showAutocomplete}
			<div class="absolute top-16 right-4 left-4 z-20">
				<SkillAutocomplete
					query={value}
					onSelect={async (skill) => {
						showAutocomplete = false;
						// Auto-invoke the selected builtin skill and populate the input with the result
						try {
							const slug = skill.slug || skill.name || skill.skill_id;
							if (!slug) {
								toast.error('Skill invocation failed');
								return;
							}
							const res = await fetch(`/api/skills/${encodeURIComponent(slug)}/invoke`, {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ args: [] })
							});
							const body = await res.json().catch(() => ({}));
							if (!res.ok) {
								toast.error(body?.error?.message || body?.error || 'Skill invocation failed');
							} else {
								value = body.output || body.result || '';
								setTimeout(() => textareaRef?.focus(), 0);
							}
						} catch (e) {
							toast.error('Skill invocation failed');
						}
					}}
				/>
			</div>
		{/if}

		<footer class="composer-actions">
			<!-- Left: Attachments -->
			<p id="composer-hint" class="composer-hint">Enter to send · Shift + Enter for a new line</p>

			<div class="composer-submit-actions">
				<input type="file" name="attachments" class="hidden" multiple bind:this={fileInput} onchange={handleFileSelect} />
				<button
					class="btn-icon btn-sm"
					aria-label={t('ui.add_attachment') || 'Add attachment'}
					title={t('ui.add_attachment') || 'Add attachment'}
					onclick={triggerFileInput}
				>
					<Icon icon="lucide:paperclip" class="h-5 w-5 opacity-70" />
				</button>
			</div>

			<!-- Right: Send / Mic -->
			<div>
				{#if !value.trim()}
					<button
						class={isRecording ? 'btn-danger btn-sm' : 'btn-icon btn-sm'}
						onclick={onrecord}
						aria-label={isRecording
							? t('ui.stop_recording') || 'Stop recording'
							: t('ui.start_recording') || 'Start recording'}
						title={isRecording
							? t('ui.stop_recording') || 'Stop recording'
							: t('ui.start_recording') || 'Start recording'}
						disabled={isTranscribing}
					>
						{#if isTranscribing}
							<span>…</span>
						{:else if isRecording}
							<Icon icon="lucide:square" class="h-5 w-5" />
						{:else}
							<Icon icon="lucide:mic" class="h-5 w-5 opacity-70" />
						{/if}
					</button>
				{:else}
					<button
						class="btn-primary btn-sm"
						onclick={onsend}
						aria-label={t('ui.send_message') || 'Send message'}
						title={t('ui.send_message') || 'Send message'}
						data-testid="send-button"
					>
						<Icon icon="lucide:send-horizontal" class="h-5 w-5" />
					</button>
				{/if}
			</div>
		</footer>
	</div>
</chat-composer-component>

<style>
	@layer components {
		chat-composer-component {
			display: flex;
			width: min(100%, var(--app-reading-width));
			margin-inline: auto;
			flex-direction: column;
			gap: var(--gap-xs);
		}

		.chat-composer-toolbar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: var(--gap-sm);
			padding: var(--pad-sm) var(--pad-sm) var(--pad-xs);
			border-bottom: var(--border-width) solid var(--wollama-border-subtle);
		}

		.companion-control {
			display: flex;
			min-width: 0;
			align-items: center;
			justify-self: start;
			gap: var(--gap-xs);
			padding: var(--pad-xs);
			border: 0;
			border-radius: var(--radius-sm);
			background: transparent;
			color: var(--color-text);
			font-size: var(--text-xs);
			cursor: pointer;
		}

		.companion-dot {
			width: var(--icon-size-xs);
			height: var(--icon-size-xs);
			flex: none;
			border-radius: var(--radius-full);
			background: var(--color-primary);
		}

		.companion-control:hover {
			background: var(--color-surface-hover);
		}

		.chat-runtime-controls {
			display: flex;
			min-width: 0;
			align-items: center;
			gap: var(--gap-xs);
		}

		.model-control {
			display: flex;
			min-width: 0;
		}

		.model-control select {
			max-width: 14rem;
			padding: var(--pad-xs);
			border: 0;
			border-radius: var(--radius-sm);
			background: transparent;
			color: var(--color-text-muted);
			font-size: var(--text-xs);
			cursor: pointer;
		}

		.model-control select:focus-visible {
			outline: var(--focus-ring-width) solid var(--wollama-focus-ring);
			outline-offset: var(--focus-ring-gap);
		}

		.composer-toolbar-actions,
		.composer-submit-actions {
			display: flex;
			align-items: center;
			gap: var(--gap-xs);
		}

		.composer-surface {
			position: relative;
			border: var(--border-width) solid var(--wollama-border-subtle);
			border-radius: var(--radius-xl);
			background: var(--wollama-panel-bg);
			box-shadow: var(--shadow-sm);
			overflow: visible;
			transition:
				border-color var(--transition-fast),
				box-shadow var(--transition-fast);
		}

		.file-preview {
			display: flex;
			width: 5rem;
			height: 5rem;
			align-items: center;
			justify-content: center;
			flex-direction: column;
			border: var(--border-width) solid var(--color-border);
			border-radius: var(--radius-md);
			background: var(--color-surface-raised);
			object-fit: cover;
		}

		.file-remove {
			position: absolute;
			top: calc(var(--pad-sm) * -1);
			right: calc(var(--pad-sm) * -1);
			display: grid;
			width: 1.5rem;
			height: 1.5rem;
			place-items: center;
			padding: 0;
			border: 0;
			border-radius: var(--radius-full);
			background: var(--color-critical);
			color: var(--color-on-primary);
			box-shadow: var(--shadow-sm);
			opacity: 0;
			transition: opacity var(--transition-fast);
		}

		.group:hover .file-remove,
		.file-remove:focus-visible {
			opacity: 1;
		}

		.composer-surface:focus-within {
			border-color: var(--color-primary);
			box-shadow:
				0 0 0 var(--focus-ring-width) var(--wollama-focus-ring),
				var(--shadow-md);
		}

		.composer-input {
			box-sizing: border-box;
			width: 100%;
			min-height: 3rem;
			max-height: 11rem;
			padding: var(--pad-md);
			border: 0;
			background: transparent;
			color: var(--color-text);
			font: inherit;
			line-height: var(--leading-relaxed);
			resize: none;
			overflow-y: auto;
		}

		.composer-input:focus {
			outline: var(--border-width) solid transparent;
		}

		.composer-actions {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: var(--gap-sm);
			padding: var(--pad-xs) var(--pad-sm) var(--pad-sm);
		}

		.composer-hint {
			margin: 0 auto 0 0;
			color: var(--color-text-muted);
			font-size: var(--text-xs);
		}

		@media (width < 48rem) {
			.model-control select {
				max-width: 8rem;
			}

			.composer-surface {
				border-radius: var(--radius-lg);
			}

			.composer-hint {
				display: none;
			}
		}
	}
</style>
