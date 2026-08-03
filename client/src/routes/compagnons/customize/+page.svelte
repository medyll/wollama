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

<companion-customize-page>
	<companion-customize-content>
		<!-- Header -->
		<header class="page-header">
			<button class="btn-ghost btn-sm" onclick={() => goto('/compagnons')} aria-label="Back to companions"> ← Back </button>
			<div class="page-header-copy">
				<h1>{isNew ? 'Customize Companion' : 'Edit Companion'}</h1>
				<p class="page-description">
					{isNew ? 'Create your personalized version of this companion' : 'Update your companion settings'}
				</p>
			</div>
		</header>

		<!-- Content -->
		{#if isLoading}
			<customize-state aria-busy="true"><span class="loading-ellipsis">Loading companion</span></customize-state>
		{:else if error}
			<div class="status-message" data-status="critical" role="alert">
				<p>{error}</p>
				<button class="btn-outline btn-sm" onclick={() => goto('/compagnons')}>Go to Companions</button>
			</div>
		{:else if companion}
			<CompanionEditor {companion} {isNew} onSave={handleSave} onCancel={handleCancel} />
		{:else}
			<div class="status-message" data-status="warning">
				<p>No companion data available</p>
			</div>
		{/if}
	</companion-customize-content>
</companion-customize-page>

<style>
	@layer components {
		companion-customize-page,
		companion-customize-content,
		customize-state {
			display: flex;
		}

		companion-customize-page {
			min-height: 100%;
			padding: var(--pad-lg);
			background: var(--color-surface-raised);
		}

		companion-customize-content {
			width: min(100%, 64rem);
			margin-inline: auto;
			flex-direction: column;
		}

		companion-customize-content > div:first-child {
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			gap: var(--gap-sm);
			margin-block-end: var(--pad-xl);
		}

		customize-state {
			min-height: 16rem;
			align-items: center;
			justify-content: center;
		}
	}
</style>
