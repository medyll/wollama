<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import CompanionEditor from '$components/CompanionEditor.svelte';
	import { companionService } from '$lib/services/companion.service';
	import type { Companion, UserCompanion } from '$types/data';
	import { onMount } from 'svelte';

	let companion: (Companion & { isSystem?: boolean }) | (UserCompanion & { isSystem?: boolean }) | null = $state(null);
	let isLoading = $state(true);
	let error: string | null = $state(null);
	let isNew = $state(false);

	onMount(async () => {
		try {
			const companionId = $page.url.searchParams.get('id');
			const newParam = $page.url.searchParams.get('new');

			if (!companionId) {
				error = 'No companion ID provided';
				return;
			}

			isNew = newParam === 'true';

			// Fetch the companion (system or user)
			const comp = await companionService.get(companionId);
			if (!comp) {
				error = 'Companion not found';
				return;
			}

			// Check if it's a system companion (for forking)
			if ('is_locked' in comp && comp.is_locked) {
				companion = { ...(comp as Companion), isSystem: true };
			} else {
				companion = { ...(comp as UserCompanion), isSystem: false };
			}
		} catch (err) {
			error = `Failed to load companion: ${err instanceof Error ? err.message : String(err)}`;
			console.error('Error loading companion:', err);
		} finally {
			isLoading = false;
		}
	});

	function handleSave() {
		// Redirect to companions list
		goto('/compagnons');
	}

	function handleCancel() {
		// Go back to companions list
		goto('/compagnons');
	}
</script>

<svelte:head>
	<title>{isNew ? 'Customize Companion' : 'Edit Companion'} - Wollama</title>
</svelte:head>

<div class="bg-base-200 min-h-screen p-4">
	<div class="mx-auto max-w-4xl">
		<!-- Header -->
		<div class="mb-8">
			<button class="btn btn-ghost btn-sm mb-4" onclick={() => goto('/compagnons')} aria-label="Back to companions">
				← Back
			</button>
			<h1 class="text-3xl font-bold">
				{isNew ? 'Customize Companion' : 'Edit Companion'}
			</h1>
			<p class="mt-2 text-gray-600">
				{isNew ? 'Create your personalized version of this companion' : 'Update your companion settings'}
			</p>
		</div>

		<!-- Content -->
		{#if isLoading}
			<div class="flex h-64 items-center justify-center">
				<div class="spinner">
					<div class="border-primary h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"></div>
				</div>
			</div>
		{:else if error}
			<div class="alert alert-error">
				<p>{error}</p>
				<button class="btn btn-sm" onclick={() => goto('/compagnons')}> Go to Companions </button>
			</div>
		{:else if companion}
			<CompanionEditor {companion} {isNew} onSave={handleSave} onCancel={handleCancel} />
		{:else}
			<div class="alert alert-warning">
				<p>No companion data available</p>
			</div>
		{/if}
	</div>
</div>
