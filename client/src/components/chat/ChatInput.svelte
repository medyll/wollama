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
		chatId,
		onsend,
		onrecord,
		oncompanionclick
	} = $props<{
		value: string;
		files: string[];
		isRecording: boolean;
		isTranscribing: boolean;
		currentCompagnon: Companion | UserCompanion;
		chatId?: string;
		onsend: () => void;
		onrecord: () => void;
		oncompanionclick: () => void;
	}>();

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

<section class="chat-composer">
	<!-- Top Bar: Companion, Audio, Delete -->
	<header class="chat-composer-toolbar">
		<!-- Left: Companion -->
		<button
			type="button"
			class="companion-control"
			onclick={oncompanionclick}
			title={t('ui.choose_companion') || 'Choose companion'}
			aria-label={t('ui.choose_companion') || 'Choose companion'}
		>
			<strong>{currentCompagnon.name}</strong>
			<span class="badge">{currentCompagnon.model}</span>
		</button>

		<!-- Center: Audio Toggle -->
		<div class="audio-control">
			<AudioToggle />
		</div>

		<!-- Right: Delete Chat -->
		<div>
			{#if chatId}
				<DataButton table="chats" table_id={chatId} mode="delete" confirm={true} />
			{/if}
		</div>
	</header>

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
		<textarea
			bind:this={textareaRef}
			placeholder={t('ui.type_message')}
			aria-label={t('ui.type_message')}
			class="composer-input"
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
			<div>
				<input type="file" class="hidden" multiple bind:this={fileInput} onchange={handleFileSelect} />
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
</section>

<style>
	.chat-composer {
		display: flex;
		width: min(100%, 72rem);
		margin-inline: auto;
		flex-direction: column;
		gap: var(--gap-sm);
	}

	.chat-composer-toolbar {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
		align-items: center;
		gap: var(--gap-sm);
	}

	.companion-control {
		display: flex;
		min-width: 0;
		align-items: center;
		justify-self: start;
		gap: var(--gap-xs);
		padding: var(--pad-xs) var(--pad-sm);
		border: 0;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-text);
		cursor: pointer;
	}

	.companion-control:hover {
		background: var(--color-surface-hover);
	}

	.audio-control {
		grid-column: 2;
	}

	.chat-composer-toolbar > :last-child {
		justify-self: end;
	}

	.composer-surface {
		position: relative;
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-sunken);
		overflow: visible;
		transition: border-color var(--transition-fast);
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
	}

	.composer-input {
		box-sizing: border-box;
		width: 100%;
		min-height: 3rem;
		max-height: 11rem;
		padding: var(--pad-sm) var(--pad-md);
		border: 0;
		background: transparent;
		resize: none;
		overflow-y: auto;
	}

	.composer-input:focus {
		outline: none;
	}

	.composer-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--pad-xs) var(--pad-sm);
		border-top: var(--border-width) solid var(--color-border);
	}

	@media (width < 48rem) {
		.chat-composer-toolbar {
			grid-template-columns: minmax(0, 1fr) auto auto;
		}

		.companion-control .badge {
			display: none;
		}
	}
</style>
