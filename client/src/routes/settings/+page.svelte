<script lang="ts">
	import { userState } from '$lib/state/user.svelte';
	import { downloadState } from '$lib/state/downloads.svelte';
	import { t } from '$lib/state/i18n.svelte';
	import { toast } from '$lib/state/notifications.svelte';
	import { audioService } from '$lib/services/audio.service';
	import LanguageSelector from '$components/ui/LanguageSelector.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Icon from '@iconify/svelte';
	import { DataGenericService } from '$lib/services/data-generic.service';
	import { destroyDatabase } from '$lib/db';
	import type { Companion } from '$types/data';
	import DataGenericList from '$components/ui_data/DataGenericList.svelte';
	import DataUpdate from '$components/ui_data/DataUpdate.svelte';
	import { ragService, type RagDocument } from '$lib/services/rag.service';
	import { APP_THEMES } from '$lib/theme';

	import { onDestroy, onMount } from 'svelte';

	let dialog = $state<HTMLDialogElement>();

	function closeSettings() {
		if (page.state.settingsOverlay && page.route.id !== '/settings') {
			window.history.back();
		} else {
			void goto('/chat', { replaceState: true });
		}
	}

	onMount(() => {
		dialog?.showModal();
	});

	let localServerUrl = $state(userState.preferences.serverUrl);
	let isVerifying = $state(false);
	let installedModels = $state<any[]>([]);
	let companions = $state<Companion[]>([]);
	let isLoadingModels = $state(false);
	let newModelName = $state('');
	type SettingsGroup = 'personal' | 'assistant' | 'advanced';
	let activeGroup = $state<SettingsGroup>('personal');
	const settingsGroups: ReadonlyArray<{ id: SettingsGroup; icon: string }> = [
		{ id: 'personal', icon: 'lucide:user-round' },
		{ id: 'assistant', icon: 'lucide:sparkles' },
		{ id: 'advanced', icon: 'lucide:sliders-horizontal' }
	];
	let audioInputs = $state<MediaDeviceInfo[]>([]);
	let audioOutputs = $state<MediaDeviceInfo[]>([]);
	let micLevel = $state(0);
	let isMonitoringMic = $state(false);
	let stopMonitoring: (() => void) | null = null;
	let isCreatingPrompt = $state(false);
	let hooks = $state<any[]>([]);
	let isLoadingHooks = $state(false);

	let ragDocuments = $state<RagDocument[]>([]);
	let isLoadingRag = $state(false);
	let isUploadingRag = $state(false);
	let ragUrlInput = $state('');
	let ragFileInput = $state<HTMLInputElement | null>(null);

	async function loadRagDocuments() {
		isLoadingRag = true;
		try {
			ragDocuments = await ragService.listDocuments();
		} catch (e) {
			console.error('Failed to load RAG documents', e);
		} finally {
			isLoadingRag = false;
		}
	}

	async function uploadRagFile(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		isUploadingRag = true;
		try {
			await ragService.uploadFile(file);
			toast.success(`Ingested "${file.name}"`);
			await loadRagDocuments();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Upload failed');
		} finally {
			isUploadingRag = false;
			input.value = '';
		}
	}

	async function ingestRagUrl() {
		if (!ragUrlInput.trim()) return;
		isUploadingRag = true;
		try {
			await ragService.ingestUrl(ragUrlInput.trim());
			toast.success('Page ingested');
			ragUrlInput = '';
			await loadRagDocuments();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Ingestion failed');
		} finally {
			isUploadingRag = false;
		}
	}

	async function deleteRagDocument(documentId: string) {
		if (!confirm('Remove this document from your knowledge base?')) return;
		try {
			await ragService.deleteDocument(documentId);
			ragDocuments = ragDocuments.filter((d) => d.document_id !== documentId);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Delete failed');
		}
	}

	async function loadHooks() {
		isLoadingHooks = true;
		try {
			const serverUrl = userState.preferences.serverUrl.replace(/\/$/, '');
			const res = await fetch(`${serverUrl}/api/hooks`);
			if (res.ok) hooks = await res.json();
		} catch (e) {
			console.error('Failed to load hooks', e);
		} finally {
			isLoadingHooks = false;
		}
	}

	async function toggleHook(id: string, is_enabled: boolean) {
		const serverUrl = userState.preferences.serverUrl.replace(/\/$/, '');
		const res = await fetch(`${serverUrl}/api/hooks/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ is_enabled })
		});
		if (res.ok) {
			hooks = hooks.map((h) => (h._id === id ? { ...h, is_enabled } : h));
		}
	}
	let isEditingCompanion = $state(false);
	let editingCompanionId = $state<string | undefined>(undefined);

	// Auth settings
	let secureProfile = $state(userState.isSecured);
	let newPassword = $state('');
	let authError = $state('');

	function saveAuthSettings() {
		authError = '';
		if (secureProfile) {
			if (!newPassword.trim()) {
				authError = 'Password is required when security is enabled';
				return;
			}
			userState.setLocalProtection(newPassword.trim());
		} else {
			userState.password = null;
			userState.isSecured = false;
			userState.save();
		}
		toast.success('Authentication settings saved');
		newPassword = '';
	}

	// Auto-save preferences when they change
	$effect(() => {
		// Track all preferences changes by serializing
		JSON.stringify(userState.preferences);
		userState.save();
	});

	onDestroy(() => {
		dialog?.close();
		if (stopMonitoring) {
			stopMonitoring();
			isMonitoringMic = false;
		}
	});

	async function loadCompanions() {
		try {
			const service = new DataGenericService<Companion>('companions');
			companions = await service.getAll();
		} catch (e) {
			console.error('Failed to load companions', e);
		}
	}

	async function loadAudioDevices() {
		try {
			const devices = await audioService.getDevices();
			audioInputs = devices.inputs;
			audioOutputs = devices.outputs;
		} catch (e) {
			console.error('Failed to load audio devices', e);
		}
	}

	async function toggleMicTest() {
		if (isMonitoringMic) {
			if (stopMonitoring) stopMonitoring();
			isMonitoringMic = false;
			micLevel = 0;
		} else {
			stopMonitoring = await audioService.monitorMicrophone(userState.preferences.audioInputId, (level) => {
				micLevel = level;
			});
			isMonitoringMic = true;
		}
	}

	function playTestSound() {
		audioService.playTestSound();
	}

	async function deleteAccount() {
		if (
			!confirm(
				t('settings.delete_confirm') ||
					'Are you sure you want to delete your account and all data? This action cannot be undone.'
			)
		) {
			return;
		}

		try {
			await destroyDatabase();
			userState.reset();
			toast.success(t('settings.delete_success') || 'Account deleted successfully');
			goto('/');
		} catch (e) {
			console.error('Failed to delete account', e);
			toast.error(t('settings.delete_error') || 'Failed to delete account');
		}
	}

	async function verifyHost() {
		isVerifying = true;
		const urlToCheck = localServerUrl.replace(/\/$/, '');

		try {
			const res = await fetch(`${urlToCheck}/api/health`);
			if (res.ok) {
				userState.preferences.serverUrl = localServerUrl;
				userState.save();
				toast.success(t('settings.server_verified'));
				loadModels();
			} else {
				throw new Error('Status not OK');
			}
		} catch {
			toast.error(t('settings.server_error'));
		} finally {
			isVerifying = false;
		}
	}

	async function loadModels() {
		isLoadingModels = true;
		try {
			const serverUrl = userState.preferences.serverUrl.replace(/\/$/, '');
			const res = await fetch(`${serverUrl}/api/models`);
			if (res.ok) {
				const data = await res.json();
				installedModels = data.models || [];
			}
		} catch (e) {
			console.error('Failed to load models', e);
		} finally {
			isLoadingModels = false;
		}
	}

	async function pullModel() {
		if (!newModelName.trim()) return;
		await downloadState.pullModel(newModelName);
		newModelName = '';
		loadModels();
	}

	function selectModel(modelName: string) {
		userState.preferences.defaultModel = modelName;
		userState.save();
	}

	$effect(() => {
		// Auto-save when these properties change
		userState.nickname;
		userState.preferences.theme;
		userState.preferences.locale;
		userState.preferences.defaultModel;
		userState.preferences.defaultCompanion;
		userState.preferences.defaultTemperature;
		userState.preferences.auto_play_audio;
		userState.preferences.audioInputId;
		userState.preferences.audioOutputId;

		userState.save();
	});

	$effect(() => {
		loadModels();
		loadCompanions();
		loadAudioDevices();
		loadHooks();
		loadRagDocuments();
	});
</script>

{#snippet profileSection()}
	<section class="settings-section">
		<h3 class="settings-section-title">
			<Icon icon="lucide:user" class="h-5 w-5" />
			{t('ui.userProfile')}
		</h3>
		<div class="settings-section-body">
			<div class="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
				<div class="form-control flex-row items-center justify-between gap-4">
					<label class="label whitespace-nowrap" for="nickname">
						<span class="label-text">{t('settings.nickname')}</span>
					</label>
					<input
						type="text"
						id="nickname"
						placeholder={t('settings.nickname_placeholder')}
						class="input input-bordered w-full max-w-xs"
						bind:value={userState.nickname}
					/>
				</div>

				<div class="form-control flex-row items-center justify-between gap-4">
					<label class="label whitespace-nowrap" for="lang">
						<span class="label-text">{t('settings.lang')}</span>
					</label>
					<div class="flex h-12 w-full max-w-xs items-center">
						<LanguageSelector />
					</div>
				</div>
			</div>
		</div>
	</section>
{/snippet}

{#snippet authSection()}
	<section class="settings-section">
		<h3 class="settings-section-title">
			<Icon icon="lucide:lock" class="h-5 w-5" />
			Authentication
		</h3>
		<div class="settings-section-body">
			<div class="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
				<div class="form-control">
					<label class="label cursor-pointer justify-start gap-4">
						<input type="checkbox" class="checkbox checkbox-primary" bind:checked={secureProfile} />
						<span class="label-text">Secure with password (shared machine)</span>
					</label>
				</div>

				{#if secureProfile}
					<div class="form-control">
						<label class="label" for="new-password">
							<span class="label-text">Set/Change Password</span>
						</label>
						<input
							type="password"
							id="new-password"
							placeholder="Enter new password"
							class="input input-bordered w-full"
							bind:value={newPassword}
						/>
					</div>
				{/if}

				{#if authError}
					<div class="alert alert-error py-2 text-sm">
						<Icon icon="lucide:alert-circle" class="h-4 w-4" />
						<span>{authError}</span>
					</div>
				{/if}

				<div class="form-control">
					<button class="btn btn-primary" onclick={saveAuthSettings}>Save</button>
				</div>
			</div>
		</div>
	</section>
{/snippet}

{#snippet promptsSection()}
	<section class="settings-section">
		<h3 class="settings-section-title">
			<Icon icon="lucide:message-square-plus" class="h-5 w-5" />
			User Prompts
		</h3>
		<div class="settings-section-body">
			<div class="flex flex-col gap-4 pt-4">
				<div class="flex justify-end">
					<button class="btn btn-sm btn-primary" onclick={() => (isCreatingPrompt = true)}>
						<Icon icon="lucide:plus" class="mr-1 h-4 w-4" />
						Add Prompt
					</button>
				</div>
				<DataGenericList tableName="user_prompts" displayType="card" editable={true} deletable={true} />
			</div>
		</div>
	</section>
{/snippet}

{#snippet interfaceSection()}
	<section class="settings-section">
		<h3 class="settings-section-title">
			<Icon icon="lucide:palette" class="h-5 w-5" />
			{t('settings.interface')}
		</h3>
		<div class="settings-section-body">
			<div class="form-control pt-4">
				<label class="label" for="theme">
					<span class="label-text">{t('settings.theme')}</span>
				</label>
				<div class="theme-choices">
					{#each APP_THEMES as theme}
						<button
							class="theme-choice"
							onclick={() => (userState.preferences.theme = theme.id)}
							data-theme={theme.id}
							aria-label="Select {theme.label} theme"
							aria-pressed={userState.preferences.theme === theme.id}
						>
							<Icon icon={theme.id === 'light' ? 'lucide:sun' : 'lucide:moon'} />
							<span>{theme.label}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	</section>
{/snippet}

{#snippet audioSection()}
	<section class="settings-section">
		<h3 class="settings-section-title">
			<Icon icon="lucide:mic" class="h-5 w-5" />
			{t('settings.audio') || 'Audio'}
		</h3>
		<div class="settings-section-body">
			<div class="grid grid-cols-1 gap-6 pt-4 md:grid-cols-2">
				<!-- Microphone Section -->
				<div class="form-control w-full">
					<label class="label" for="audio-input">
						<span class="label-text flex items-center gap-2">
							<Icon icon="lucide:mic" class="h-4 w-4" />
							{t('settings.microphone') || 'Microphone'}
						</span>
					</label>
					<select
						id="audio-input"
						class="select select-bordered mb-2 w-full"
						bind:value={userState.preferences.audioInputId}
						onchange={() => {
							if (isMonitoringMic) toggleMicTest();
						}}
					>
						<option value="">Default</option>
						{#each audioInputs as device}
							<option value={device.deviceId}
								>{device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}</option
							>
						{/each}
					</select>

					<div class="mt-2 flex items-center gap-2">
						<button
							class="btn btn-sm {isMonitoringMic ? 'btn-error' : 'btn-secondary'}"
							onclick={toggleMicTest}
							aria-label={isMonitoringMic ? 'Stop Test' : 'Test Mic'}
						>
							{#if isMonitoringMic}
								<Icon icon="lucide:square" class="h-4 w-4" /> Stop Test
							{:else}
								<Icon icon="lucide:play" class="h-4 w-4" /> Test Mic
							{/if}
						</button>
						<div class="bg-base-300 relative h-4 flex-1 overflow-hidden rounded-full">
							<div class="mic-level-fill" style="width: {micLevel}%"></div>
						</div>
					</div>
				</div>

				<!-- Speaker Section -->
				<div class="form-control w-full">
					<label class="label" for="audio-output">
						<span class="label-text flex items-center gap-2">
							<Icon icon="lucide:speaker" class="h-4 w-4" />
							{t('settings.speaker') || 'Speaker'}
						</span>
					</label>
					<select
						id="audio-output"
						class="select select-bordered mb-2 w-full"
						bind:value={userState.preferences.audioOutputId}
					>
						<option value="">Default</option>
						{#each audioOutputs as device}
							<option value={device.deviceId}>{device.label || `Speaker ${device.deviceId.slice(0, 5)}...`}</option>
						{/each}
					</select>

					<div class="mt-2">
						<button class="btn btn-sm btn-secondary" onclick={playTestSound} aria-label="Test Sound">
							<Icon icon="lucide:volume-2" class="h-4 w-4" /> Test Sound
						</button>
					</div>
				</div>
			</div>
		</div>
	</section>
{/snippet}

{#snippet aiSection()}
	<section class="settings-section">
		<h3 class="settings-section-title">
			<Icon icon="lucide:brain-circuit" class="h-5 w-5" />
			{t('settings.ai')}
		</h3>
		<div class="settings-section-body">
			<div class="grid grid-cols-1 gap-4 pt-4">
				<!-- Modèle sélectionné actuel -->
				<div class="form-control">
					<div class="label">
						<span class="label-text font-medium">{t('settings.default_model')}</span>
					</div>
					<div class="badge badge-primary badge-lg p-4">
						{userState.preferences.defaultModel || 'None selected'}
					</div>
					<div class="label pb-0">
						<span class="label-text-alt">{t('settings.model_help')}</span>
					</div>
				</div>

				<!-- Liste des modèles installés -->
				<div class="form-control">
					<div class="label">
						<span class="label-text font-medium">Installed Models</span>
					</div>
					{#if isLoadingModels}
						<div class="flex justify-center py-8">
							<span class="loading loading-spinner loading-lg"></span>
						</div>
					{:else if installedModels.length === 0}
						<div class="alert alert-info">
							<Icon icon="lucide:info" class="h-5 w-5" />
							<span>No models installed. Download one below.</span>
						</div>
					{:else}
						<div class="border-base-300 overflow-x-auto rounded-lg border">
							<div class="max-h-80 overflow-y-auto">
								<table class="table-pin-rows table-xs table">
									<thead>
										<tr>
											<th class="w-12"></th>
											<th>Name</th>
											<th>Size</th>
											<th>Modified</th>
											<th class="text-right">Action</th>
										</tr>
									</thead>
									<tbody>
										{#each installedModels as model}
											{@const isSelected = model.name === userState.preferences.defaultModel}
											<tr
												class="hover cursor-pointer {isSelected ? 'bg-primary/10' : ''}"
												onclick={() => selectModel(model.name)}
											>
												<td>
													{#if isSelected}
														<Icon icon="lucide:check-circle" class="text-primary h-5 w-5" />
													{:else}
														<Icon icon="lucide:circle" class="h-5 w-5 opacity-30" />
													{/if}
												</td>
												<td class="font-mono text-sm">{model.name}</td>
												<td class="text-xs opacity-70">
													{#if model.size}
														{(model.size / 1024 / 1024 / 1024).toFixed(2)} GB
													{:else}
														-
													{/if}
												</td>
												<td class="text-xs opacity-70">
													{#if model.modified_at}
														{new Date(model.modified_at).toLocaleDateString()}
													{:else}
														-
													{/if}
												</td>
												<td class="text-right">
													<button
														class="btn btn-ghost btn-xs"
														onclick={(e) => {
															e.stopPropagation();
															selectModel(model.name);
														}}
														aria-label="Select model"
													>
														Select
													</button>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/if}
				</div>

				<!-- Companion Selection -->
				<div class="form-control">
					<label class="label" for="companion">
						<span class="label-text font-medium">{t('ui.choose_companion')}</span>
					</label>
					<select
						id="companion"
						class="select select-bordered w-full"
						bind:value={userState.preferences.defaultCompanion}
					>
						{#each companions as companion}
							<option value={companion.companion_id}>{companion.name}</option>
						{/each}
						{#if !companions.find((c) => c.companion_id === userState.preferences.defaultCompanion)}
							<option value={userState.preferences.defaultCompanion}>Default</option>
						{/if}
					</select>
				</div>

				<!-- Temperature -->
				<div class="form-control">
					<label class="label" for="temp">
						<span class="label-text font-medium"
							>{t('settings.temperature')} ({userState.preferences.defaultTemperature})</span
						>
					</label>
					<div class="w-full">
						<input
							id="temp"
							type="range"
							min="0"
							max="1"
							step="0.1"
							class="range range-primary"
							bind:value={userState.preferences.defaultTemperature}
						/>
						<div class="flex w-full justify-between px-2 text-xs">
							<span>{t('settings.precise')}</span>
							<span>{t('settings.creative')}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Model Management -->
			<div class="divider">Model Management</div>
			<div class="form-control">
				<label class="label" for="new-model">
					<span class="label-text">Download New Model (Ollama)</span>
				</label>
				<div class="join w-full">
					<input
						type="text"
						id="new-model"
						placeholder="e.g. llama3, mistral, gemma"
						class="input input-bordered join-item w-full"
						bind:value={newModelName}
						disabled={downloadState.isPulling}
					/>
					<button
						class="btn btn-primary join-item"
						onclick={pullModel}
						disabled={downloadState.isPulling || !newModelName}
						aria-label="Download Model"
					>
						{#if downloadState.isPulling}
							<span class="loading loading-spinner loading-sm"></span>
						{:else}
							<Icon icon="lucide:download" class="h-4 w-4" />
						{/if}
						Download
					</button>
				</div>
				{#if downloadState.isPulling}
					<div class="mt-4 space-y-2">
						<div class="flex justify-between text-xs">
							<span>{downloadState.status}</span>
							<span>{downloadState.progress}%</span>
						</div>
						<progress
							class="progress progress-primary w-full"
							value={downloadState.progress}
							max="100"
							aria-label="Download progress"
						></progress>
					</div>
				{/if}
			</div>
		</div>
	</section>
{/snippet}

{#snippet companionsSection()}
	<section class="settings-section">
		<h3 class="settings-section-title">
			<Icon icon="lucide:users" class="h-5 w-5" />
			{t('ui.companions') || 'Companions'}
		</h3>
		<div class="settings-section-body">
			<div class="pt-4">
				<div class="mb-4 flex justify-end">
					<button
						class="btn btn-primary btn-sm"
						onclick={() => {
							editingCompanionId = undefined;
							isEditingCompanion = true;
						}}
					>
						<Icon icon="lucide:plus" class="mr-2 h-4 w-4" />
						{t('ui.add') || 'Add'}
					</button>
				</div>
				<DataGenericList
					tableName="user_companions"
					editable={true}
					deletable={true}
					onEdit={(item: any) => {
						// Use the correct primary key for user_companions
						editingCompanionId = item.user_companion_id;
						isEditingCompanion = true;
					}}
				/>
			</div>
		</div>
	</section>
{/snippet}

{#snippet serverSection()}
	<section class="settings-section">
		<h3 class="settings-section-title">
			<Icon icon="lucide:server" class="h-5 w-5" />
			{t('settings.server_connection')}
		</h3>
		<div class="settings-section-body">
			<div class="form-control pt-4">
				<label class="label" for="server">
					<span class="label-text">{t('settings.server_host')}</span>
				</label>
				<div class="join w-full">
					<input
						type="text"
						id="server"
						placeholder="http://localhost:3000"
						class="input input-bordered join-item w-full font-mono"
						bind:value={localServerUrl}
					/>
					<button
						class="btn btn-primary join-item"
						onclick={verifyHost}
						disabled={isVerifying}
						aria-label="Verify Server"
					>
						{#if isVerifying}
							<span class="loading loading-spinner loading-sm"></span>
						{:else}
							{t('settings.verify')}
						{/if}
					</button>
				</div>
				<div class="label">
					<span class="label-text-alt">{t('settings.server_help')}</span>
				</div>
			</div>
		</div>
	</section>
{/snippet}

{#snippet ragSection()}
	<section class="settings-section">
		<h3 class="settings-section-title">
			<Icon icon="lucide:database" class="h-5 w-5" />
			Knowledge Base
		</h3>
		<div class="settings-section-body">
			<div class="flex flex-col gap-4 pt-4">
				<p class="text-sm opacity-70">
					Documents ingested here are embedded and automatically retrieved as context during chat.
				</p>

				<div class="flex flex-col gap-3 md:flex-row">
					<button
						class="btn btn-primary btn-sm"
						onclick={() => ragFileInput?.click()}
						disabled={isUploadingRag}
						aria-label="Upload document"
					>
						{#if isUploadingRag}
							<span class="loading loading-spinner loading-sm"></span>
						{:else}
							<Icon icon="lucide:upload" class="h-4 w-4" />
						{/if}
						Upload File (PDF / TXT / MD)
					</button>
					<input bind:this={ragFileInput} type="file" accept=".pdf,.txt,.md" class="hidden" onchange={uploadRagFile} />

					<div class="join flex-1">
						<input
							type="url"
							placeholder="https://example.com/article"
							class="input input-bordered join-item w-full"
							bind:value={ragUrlInput}
							disabled={isUploadingRag}
						/>
						<button
							class="btn btn-secondary join-item"
							onclick={ingestRagUrl}
							disabled={isUploadingRag || !ragUrlInput.trim()}
							aria-label="Ingest URL"
						>
							<Icon icon="lucide:link" class="h-4 w-4" />
							Ingest
						</button>
					</div>
				</div>

				{#if isLoadingRag}
					<div class="flex justify-center py-8">
						<span class="loading loading-spinner loading-lg"></span>
					</div>
				{:else if ragDocuments.length === 0}
					<div class="alert alert-info">
						<Icon icon="lucide:info" class="h-5 w-5" />
						<span>No documents ingested yet.</span>
					</div>
				{:else}
					<div class="border-base-300 overflow-x-auto rounded-lg border">
						<table class="table-xs table w-full">
							<thead>
								<tr>
									<th>Title</th>
									<th>Source</th>
									<th>Chunks</th>
									<th>Status</th>
									<th class="text-right">Action</th>
								</tr>
							</thead>
							<tbody>
								{#each ragDocuments as doc}
									<tr class="hover">
										<td class="max-w-xs truncate font-medium" title={doc.title}>{doc.title}</td>
										<td><span class="badge badge-ghost badge-sm">{doc.source}</span></td>
										<td class="text-xs opacity-70">{doc.chunk_count}</td>
										<td>
											<span
												class="badge badge-sm {doc.status === 'indexed'
													? 'badge-success'
													: doc.status === 'error'
														? 'badge-error'
														: 'badge-warning'}"
												title={doc.error}
											>
												{doc.status}
											</span>
										</td>
										<td class="text-right">
											<button
												class="btn btn-ghost btn-xs text-error"
												onclick={() => deleteRagDocument(doc.document_id)}
												aria-label="Delete document"
											>
												<Icon icon="lucide:trash-2" class="h-4 w-4" />
											</button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</div>
	</section>
{/snippet}

{#snippet hooksSection()}
	<section class="settings-section">
		<h3 class="settings-section-title">
			<Icon icon="lucide:webhook" class="h-5 w-5" />
			Hooks
		</h3>
		<div class="settings-section-body">
			<div class="pt-4">
				{#if isLoadingHooks}
					<div class="flex justify-center py-8">
						<span class="loading loading-spinner loading-lg"></span>
					</div>
				{:else if hooks.length === 0}
					<div class="alert alert-info">
						<Icon icon="lucide:info" class="h-5 w-5" />
						<span>No hooks registered.</span>
					</div>
				{:else}
					<div class="border-base-300 overflow-x-auto rounded-lg border">
						<table class="table-xs table w-full">
							<thead>
								<tr>
									<th>Name</th>
									<th>Event</th>
									<th>Type</th>
									<th>Priority</th>
									<th>Scope</th>
									<th class="text-center">Enabled</th>
								</tr>
							</thead>
							<tbody>
								{#each hooks as hook}
									<tr class="hover">
										<td class="font-medium">{hook.name}</td>
										<td><span class="badge badge-ghost badge-sm">{hook.event}</span></td>
										<td class="text-xs opacity-70">{hook.handler_type ?? '-'}</td>
										<td class="text-xs opacity-70">{hook.priority ?? '-'}</td>
										<td class="text-xs opacity-70">{hook.scope ?? '-'}</td>
										<td class="text-center">
											<input
												type="checkbox"
												class="toggle toggle-primary toggle-sm"
												checked={hook.is_enabled}
												onchange={(e) => toggleHook(hook._id, (e.target as HTMLInputElement).checked)}
											/>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</div>
	</section>
{/snippet}

{#snippet dangerSection()}
	<section class="settings-section" data-danger="true">
		<h3 class="settings-section-title">
			<Icon icon="lucide:alert-triangle" class="h-5 w-5" />
			{t('settings.danger_zone') || 'Danger Zone'}
		</h3>
		<div class="settings-section-body">
			<div class="pt-4">
				<p class="mb-4 text-sm opacity-70">
					{t('settings.delete_warning') ||
						'Deleting your account will remove all your data, including chats, companions, and settings. This action cannot be undone.'}
				</p>
				<button class="btn btn-error btn-outline w-full md:w-auto" onclick={deleteAccount} aria-label="Delete Account">
					<Icon icon="lucide:trash-2" class="mr-2 h-4 w-4" />
					{t('settings.delete_account') || 'Delete Account & Data'}
				</button>
			</div>
		</div>
	</section>
{/snippet}

<dialog
	class="settings-overlay"
	bind:this={dialog}
	aria-labelledby="settings-title"
	oncancel={(event) => {
		event.preventDefault();
		closeSettings();
	}}
>
	<settings-component>
		<header class="page-header page-header-centered">
			<div class="page-header-copy">
				<h1 id="settings-title">{t('ui.settings')}</h1>
				<p class="page-description">{t('settings.subtitle')}</p>
			</div>
			<button class="btn-icon" onclick={closeSettings} aria-label={t('ui.close')}>
				<Icon icon="lucide:x" />
			</button>
		</header>
		<settings-layout>
			<nav class="settings-navigation" aria-label={t('ui.settings')}>
				{#each settingsGroups as group}
					<button
						class="settings-navigation-item"
						aria-current={activeGroup === group.id ? 'page' : undefined}
						onclick={() => (activeGroup = group.id)}
					>
						<Icon icon={group.icon} />
						{t('settings.groups.' + group.id)}
					</button>
				{/each}
			</nav>
			<settings-content>
				<section
					class="settings-group"
					data-active={activeGroup === 'personal'}
					aria-label={t('settings.groups.personal')}
				>
					<h2 class="settings-group-title">{t('settings.groups.personal')}</h2>
					<button
						class="settings-mobile-group"
						aria-expanded={activeGroup === 'personal'}
						onclick={() => (activeGroup = 'personal')}
					>
						<Icon icon="lucide:user-round" />
						{t('settings.groups.personal')}
						<Icon icon={activeGroup === 'personal' ? 'lucide:chevron-up' : 'lucide:chevron-down'} />
					</button>
					<settings-group-body>
						{@render profileSection()}
						{@render authSection()}
						{@render interfaceSection()}
						{@render audioSection()}
					</settings-group-body>
				</section>
				<section
					class="settings-group"
					data-active={activeGroup === 'assistant'}
					aria-label={t('settings.groups.assistant')}
				>
					<h2 class="settings-group-title">{t('settings.groups.assistant')}</h2>
					<button
						class="settings-mobile-group"
						aria-expanded={activeGroup === 'assistant'}
						onclick={() => (activeGroup = 'assistant')}
					>
						<Icon icon="lucide:sparkles" />
						{t('settings.groups.assistant')}
						<Icon icon={activeGroup === 'assistant' ? 'lucide:chevron-up' : 'lucide:chevron-down'} />
					</button>
					<settings-group-body>
						{@render aiSection()}
						{@render promptsSection()}
						{@render companionsSection()}
						{@render ragSection()}
					</settings-group-body>
				</section>
				<section
					class="settings-group"
					data-active={activeGroup === 'advanced'}
					aria-label={t('settings.groups.advanced')}
				>
					<h2 class="settings-group-title">{t('settings.groups.advanced')}</h2>
					<button
						class="settings-mobile-group"
						aria-expanded={activeGroup === 'advanced'}
						onclick={() => (activeGroup = 'advanced')}
					>
						<Icon icon="lucide:sliders-horizontal" />
						{t('settings.groups.advanced')}
						<Icon icon={activeGroup === 'advanced' ? 'lucide:chevron-up' : 'lucide:chevron-down'} />
					</button>
					<settings-group-body>
						{@render serverSection()}
						{@render hooksSection()}
						{@render dangerSection()}
					</settings-group-body>
				</section>
			</settings-content>
		</settings-layout>
		<DataUpdate tableName="user_prompts" bind:isOpen={isCreatingPrompt} />
		<DataUpdate tableName="user_companions" bind:isOpen={isEditingCompanion} id={editingCompanionId} />
	</settings-component>
</dialog>

<style>
	@layer components {
		.settings-overlay {
			position: fixed;
			inset: 0;
			margin: auto;
			width: min(76rem, calc(100vw - 3rem));
			height: min(54rem, calc(100dvh - 3rem));
			max-width: none;
			max-height: none;
			padding: 0;
			border: var(--border-width) solid var(--wollama-border-subtle);
			border-radius: 1.25rem;
			background: var(--color-surface);
			color: var(--color-text);
			box-shadow: var(--shadow-lg);
			overflow: hidden;
		}

		.settings-overlay::backdrop {
			background: color-mix(in oklch, var(--color-text) 30%, transparent);
			backdrop-filter: blur(0.25rem);
		}

		settings-component {
			position: relative;
			display: block;
			height: 100%;
			padding: clamp(1rem, 3vw, 2.5rem);
			overflow-y: auto;
			background: var(--color-surface);
		}

		settings-component > .page-header {
			max-width: 72rem;
			margin-inline: auto;
		}

		settings-component .page-header h1 {
			font-size: 1.5rem;
		}

		settings-layout {
			display: grid;
			grid-template-columns: 12rem minmax(0, 1fr);
			gap: 2.5rem;
			max-width: 72rem;
			margin-inline: auto;
		}

		.settings-navigation {
			position: sticky;
			top: 0;
			display: flex;
			flex-direction: column;
			align-self: start;
			gap: 0.375rem;
		}

		.settings-navigation-item {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			padding: 0.75rem;
			border: 0;
			border-radius: 0.625rem;
			background: transparent;
			color: var(--color-text-muted);
			text-align: start;
			font-size: 0.875rem;
			cursor: pointer;
		}

		.settings-navigation-item:hover,
		.settings-navigation-item[aria-current='page'] {
			background: var(--color-surface-hover);
			color: var(--color-text);
		}

		settings-content,
		settings-group-body {
			display: block;
			min-width: 0;
		}

		.settings-group {
			display: none;
		}

		.settings-group[data-active='true'] {
			display: block;
		}

		.settings-group-title {
			margin: 0 0 2rem;
			font-size: 1.125rem;
			font-weight: var(--font-semibold);
		}

		.settings-mobile-group {
			display: none;
		}

		.theme-choices {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.75rem;
		}

		.theme-choice {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0.75rem;
			min-height: 3.5rem;
			padding: 0.75rem;
			border: 2px solid var(--color-border);
			border-radius: 0.75rem;
			background: var(--color-surface);
			color: var(--color-text);
			cursor: pointer;
		}

		.theme-choice[aria-pressed='true'] {
			border-color: var(--color-primary);
			background: var(--wollama-active-bg);
		}

		.settings-section {
			padding-block: 0 2rem;
			margin-block-end: 2rem;
			border-bottom: var(--border-width) solid var(--wollama-border-subtle);
		}

		.settings-section:last-child {
			margin-block-end: 0;
			border-bottom: 0;
		}

		.settings-section-title {
			display: flex;
			align-items: center;
			gap: 0.625rem;
			margin: 0 0 1.5rem;
			font-size: 0.9375rem;
			font-weight: var(--font-semibold);
		}

		.settings-section[data-danger='true'] .settings-section-title {
			color: var(--color-critical);
		}

		.settings-section-body {
			display: block;
			font-size: 0.875rem;
		}

		.settings-section-body > div {
			display: flex;
			flex-direction: column;
			gap: 1.5rem;
		}

		.settings-section-body > .grid {
			display: grid;
			grid-template-columns: minmax(0, 1fr);
		}

		.settings-section-body .form-control > :is(input:not([type='checkbox']), select) {
			width: 100%;
			max-width: none;
		}

		@media (min-width: 64rem) {
			.settings-section-body > .grid {
				grid-template-columns: repeat(2, minmax(0, 1fr));
			}
		}

		.form-control {
			display: flex;
			min-width: 0;
			flex-direction: column;
			gap: 0.625rem;
		}

		.label {
			display: flex;
			align-items: center;
			gap: var(--gap-sm);
			font-size: var(--text-sm);
			line-height: 1.5;
			white-space: normal;
		}

		.alert {
			display: flex;
			align-items: center;
			gap: var(--gap-sm);
			padding: var(--pad-md);
			border: var(--border-width) solid var(--color-border);
			border-radius: var(--radius-md);
		}

		.alert-error {
			border-color: var(--color-critical);
			background: color-mix(in srgb, var(--color-critical) 8%, var(--color-surface));
			color: var(--color-critical);
		}

		.alert-info {
			border-color: var(--color-info);
			background: color-mix(in srgb, var(--color-info) 8%, var(--color-surface));
		}

		.badge {
			display: inline-flex;
			align-items: center;
			padding: var(--pad-xs) var(--pad-sm);
			border: var(--border-width) solid var(--color-border);
			border-radius: var(--radius-full);
			font-size: var(--text-xs);
		}

		.badge-primary {
			border-color: var(--color-primary);
			background: var(--color-primary);
			color: var(--color-on-primary);
		}

		.loading-spinner {
			display: inline-block;
			width: 1.5rem;
			height: 1.5rem;
			border: calc(var(--border-width) * 2) solid var(--color-border);
			border-top-color: var(--color-primary);
			border-radius: var(--radius-full);
			animation: settings-spin var(--duration-spin) linear infinite;
		}

		.mic-level-fill {
			height: 100%;
			background: var(--color-success);
			transition: width var(--transition-fast);
		}

		.bg-base-300 {
			background: var(--color-surface-raised);
		}

		.border-base-300 {
			border-color: var(--color-border);
		}

		.text-error {
			color: var(--color-critical);
		}

		.btn-error {
			border-color: var(--color-critical);
			color: var(--color-critical);
		}

		@keyframes settings-spin {
			to {
				transform: rotate(1turn);
			}
		}

		@media (width < 48rem) {
			.settings-overlay {
				width: calc(100vw - 1rem);
				height: calc(100dvh - 1rem);
				border-radius: 1rem;
			}
			settings-component {
				padding: 1rem;
			}

			settings-layout {
				grid-template-columns: minmax(0, 1fr);
			}

			.settings-navigation,
			.settings-group-title {
				display: none;
			}

			.settings-group {
				display: block;
				margin-block-end: 1rem;
				border: var(--border-width) solid var(--wollama-border-subtle);
				border-radius: 1rem;
				overflow: hidden;
			}

			.settings-mobile-group {
				display: flex;
				width: 100%;
				align-items: center;
				gap: 0.75rem;
				padding: 1rem;
				border: 0;
				background: var(--color-surface-raised);
				color: var(--color-text);
				text-align: start;
				cursor: pointer;
			}

			.settings-mobile-group :global(svg:last-child) {
				margin-inline-start: auto;
			}

			settings-group-body {
				display: none;
				padding: 1.5rem 1rem;
			}

			.settings-group[data-active='true'] settings-group-body {
				display: block;
			}
		}
	}
</style>
