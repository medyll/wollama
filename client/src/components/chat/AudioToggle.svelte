<script lang="ts">
	import { userState } from '$lib/state/user.svelte';
	import { t } from '$lib/state/i18n.svelte';
	import Icon from '@iconify/svelte';

	let { checked = $bindable() } = $props();
</script>

<label class="audio-toggle" aria-label={t('ui.toggle_audio')} title={t('ui.toggle_audio')}>
	<input type="checkbox" bind:checked={userState.preferences.auto_play_audio} onchange={() => userState.save()} />
	<Icon icon={userState.preferences.auto_play_audio ? 'lucide:volume-2' : 'lucide:volume-x'} />
</label>

<style>
	.audio-toggle {
		display: inline-flex;
		width: var(--icon-size-md);
		height: var(--icon-size-md);
		align-items: center;
		justify-content: center;
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-full);
		background: var(--color-surface-raised);
		color: var(--color-text-muted);
		cursor: pointer;
	}

	.audio-toggle:hover,
	.audio-toggle:has(input:focus-visible) {
		background: var(--color-surface-hover);
		color: var(--color-primary);
	}

	.audio-toggle input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
	}
</style>
