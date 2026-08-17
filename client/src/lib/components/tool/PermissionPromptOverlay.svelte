<script lang="ts">
	import { permissionState } from '$lib/state/permissions.svelte.js';
	import PermissionPrompt from './PermissionPrompt.svelte';
</script>

{#if permissionState.pending.length > 0}
	<permission-overlay data-testid="permission-overlay">
		{#each permissionState.pending as request (request.request_id)}
			<PermissionPrompt {request} />
		{/each}
	</permission-overlay>
{/if}

<style>
	@layer components {
		permission-overlay {
			position: fixed;
			bottom: var(--pad-lg);
			right: var(--pad-lg);
			z-index: var(--z-toast, 1000);
			display: flex;
			flex-direction: column;
			gap: var(--gap-sm, var(--pad-sm));
			max-width: 24rem;
		}
	}
</style>
