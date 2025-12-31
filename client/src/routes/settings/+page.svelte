<script lang="ts">
	import { userState } from '$lib/state/user.svelte';
	import { downloadState } from '$lib/state/downloads.svelte';
	import { t } from '$lib/state/i18n.svelte';
	import { toast } from '$lib/state/notifications.svelte';
	import { audioService } from '$lib/services/audio.service';
	import LanguageSelector from '$components/ui/LanguageSelector.svelte';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { DataGenericService } from '$lib/services/data-generic.service';
	import { destroyDatabase } from '$lib/db';
	import type { Companion } from '$types/data';
	import GenericList from '$components/ui_data/GenericList.svelte';
	import DataUpdate from '$components/ui_data/DataUpdate.svelte';

	import { onDestroy } from 'svelte';

	let localServerUrl = $state(userState.preferences.serverUrl);
	let isVerifying = $state(false);
	let installedModels = $state<any[]>([]);
	let companions = $state<Companion[]>([]);
	let isLoadingModels = $state(false);
	let newModelName = $state('');
	let activeSection = $state<string | null>('profile');
	let audioInputs = $state<MediaDeviceInfo[]>([]);
	let audioOutputs = $state<MediaDeviceInfo[]>([]);
	let micLevel = $state(0);
	let isMonitoringMic = $state(false);
	let stopMonitoring: (() => void) | null = null;
	let isCreatingPrompt = $state(false);
	let isEditingCompanion = $state(false);
	let editingCompanionId = $state<string | undefined>(undefined);

	// Auto-save preferences when they change
	$effect(() => {
		// Track all preferences changes by serializing
		JSON.stringify(userState.preferences);
		userState.save();
	});

	onDestroy(() => {
		if (stopMonitoring) {
			stopMonitoring();
			isMonitoringMic = false;
		}
	});

	const themes = [
		'fluent-light',
		'fluent-dark',
		'light',
		'dark',
		'cupcake',
		'bumblebee',
		'emerald',
		'corporate',
		'synthwave',
		'retro',
		'cyberpunk',
		'valentine',
		'halloween',
		'garden',
		'forest',
		'aqua',
		'lofi',
		'pastel',
		'fantasy',
		'wireframe',
		'black',
		'luxury',
		'dracula'
	];

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
	});
</script>

<div class="bg-base-200 absolute inset-0 overflow-y-auto p-4 md:p-8">
	<div class="mx-auto max-w-3xl">
		<!-- Section: Header -->
		<div class="mb-8 flex items-center justify-between">
			<button class="btn btn-ghost btn-circle" onclick={() => window.history.back()} aria-label="Back">
				<Icon icon="lucide:arrow-left" class="h-6 w-6" />
			</button>
			<div class="flex-1 text-center">
				<h1 class="text-4xl font-bold">{t('ui.settings')}</h1>
				<p class="py-2 opacity-70">{t('settings.subtitle')}</p>
			</div>
			<div class="w-12"></div>
			<!-- Spacer for centering -->
		</div>

		<div class="join join-vertical bg-base-100 w-full shadow-xl">
			<!-- Section: User Profile -->
			<div class="collapse-arrow join-item border-base-300 collapse border">
				<input
					type="checkbox"
					checked={activeSection === 'profile'}
					onchange={() => (activeSection = activeSection === 'profile' ? null : 'profile')}
					aria-label="Toggle User Profile"
				/>
				<div class="collapse-title text-lg font-medium">
					{t('ui.userProfile')}
				</div>
				<div class="collapse-content">
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
			</div>

			<!-- Section: User Prompts -->
			<div class="collapse-arrow join-item border-base-300 collapse border">
				<input
					type="checkbox"
					checked={activeSection === 'prompts'}
					onchange={() => (activeSection = activeSection === 'prompts' ? null : 'prompts')}
					aria-label="Toggle User Prompts"
				/>
				<div class="collapse-title flex items-center gap-2 text-lg font-medium">
					<Icon icon="lucide:message-square-plus" class="h-5 w-5" />
					User Prompts
				</div>
				<div class="collapse-content">
					<div class="flex flex-col gap-4 pt-4">
						<div class="flex justify-end">
							<button class="btn btn-sm btn-primary" onclick={() => (isCreatingPrompt = true)}>
								<Icon icon="lucide:plus" class="mr-1 h-4 w-4" />
								Add Prompt
							</button>
						</div>
						<GenericList tableName="user_prompts" displayType="card" editable={true} />
					</div>
				</div>
			</div>

			<!-- Section: Interface -->
			<div class="collapse-arrow join-item border-base-300 collapse border">
				<input
					type="checkbox"
					checked={activeSection === 'interface'}
					onchange={() => (activeSection = activeSection === 'interface' ? null : 'interface')}
					aria-label="Toggle Interface"
				/>
				<div class="collapse-title text-lg font-medium">
					{t('settings.interface')}
				</div>
				<div class="collapse-content">
					<div class="form-control pt-4">
						<label class="label" for="theme">
							<span class="label-text">{t('settings.theme')}</span>
						</label>
						<div class="grid grid-cols-3 gap-2 md:grid-cols-5">
							{#each themes as theme}
								<button
									class="btn flex h-auto flex-col gap-1 rounded-xl border-2 p-2 {userState.preferences.theme ===
									theme
										? 'border-primary'
										: 'border-base-content/10'}"
									onclick={() => (userState.preferences.theme = theme)}
									data-theme={theme}
									aria-label="Select theme {theme}"
								>
									<div class="bg-base-100 border-base-content/10 h-4 w-full rounded border"></div>
									<div class="bg-primary h-4 w-full rounded"></div>
									<div class="bg-secondary h-4 w-full rounded"></div>
									<span class="text-[10px] font-bold capitalize">{theme}</span>
								</button>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Section: Audio -->
			<div class="collapse-arrow join-item border-base-300 collapse border">
				<input
					type="checkbox"
					checked={activeSection === 'audio'}
					onchange={() => (activeSection = activeSection === 'audio' ? null : 'audio')}
					aria-label="Toggle Audio"
				/>
				<div class="collapse-title flex items-center gap-2 text-lg font-medium">
					<Icon icon="lucide:mic" class="h-5 w-5" />
					{t('settings.audio') || 'Audio'}
				</div>
				<div class="collapse-content">
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
									<div
										class="bg-success h-full transition-all duration-100 ease-out"
										style="width: {micLevel}%"
									></div>
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
									<option value={device.deviceId}
										>{device.label || `Speaker ${device.deviceId.slice(0, 5)}...`}</option
									>
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
			</div>

			<!-- Section: AI Configuration -->
			<div class="collapse-arrow join-item border-base-300 collapse border">
				<input
					type="checkbox"
					checked={activeSection === 'ai'}
					onchange={() => (activeSection = activeSection === 'ai' ? null : 'ai')}
					aria-label="Toggle AI Configuration"
				/>
				<div class="collapse-title text-lg font-medium">
					{t('settings.ai')}
				</div>
				<div class="collapse-content">
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
								id="temp" min="0" max="1" step="0.1" class="range range-primary" bind:value={userState.preferences
									.defaultTemperature}
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
			</div>

			<!-- Section: Companions -->
			<div class="collapse-arrow join-item border-base-300 collapse border">
				<input
					type="checkbox"
					checked={activeSection === 'companions'}
					onchange={() => (activeSection = activeSection === 'companions' ? null : 'companions')}
					aria-label="Toggle Companions"
				/>
				<div class="collapse-title text-lg font-medium">
					{t('ui.companions') || 'Companions'}
				</div>
				<div class="collapse-content">
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
						<GenericList
							tableName="user_companions"
							editable={true}
							deletable={true}
							onEdit={(item: any) => {
								editingCompanionId = item.companion_id;
								isEditingCompanion = true;
							}}
						/>
					</div>
				</div>
			</div>

			<!-- Section: Server Configuration -->
			<div class="collapse-arrow join-item border-base-300 collapse border">
				<input
					type="checkbox"
					checked={activeSection === 'server'}
					onchange={() => (activeSection = activeSection === 'server' ? null : 'server')}
					aria-label="Toggle Server Configuration"
				/>
				<div class="collapse-title text-lg font-medium">
					{t('settings.server_connection')}
				</div>
				<div class="collapse-content">
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
			</div>

			<!-- Section: Danger Zone -->
			<div class="collapse-arrow join-item border-base-300 border-error/20 collapse border">
				<input
					type="checkbox"
					checked={activeSection === 'danger'}
					onchange={() => (activeSection = activeSection === 'danger' ? null : 'danger')}
					aria-label="Toggle Danger Zone"
				/>
				<div class="collapse-title text-error text-lg font-medium">
					{t('settings.danger_zone') || 'Danger Zone'}
				</div>
				<div class="collapse-content">
					<div class="pt-4">
						<p class="mb-4 text-sm opacity-70">
							{t('settings.delete_warning') ||
								'Deleting your account will remove all your data, including chats, companions, and settings. This action cannot be undone.'}
						</p>
						<button
							class="btn btn-error btn-outline w-full md:w-auto"
							onclick={deleteAccount}
							aria-label="Delete Account"
						>
							<Icon icon="lucide:trash-2" class="mr-2 h-4 w-4" />
							{t('settings.delete_account') || 'Delete Account & Data'}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>

	<DataUpdate tableName="user_prompts" bind:isOpen={isCreatingPrompt} />
	<DataUpdate tableName="user_companions" bind:isOpen={isEditingCompanion} id={editingCompanionId} />
</div>
