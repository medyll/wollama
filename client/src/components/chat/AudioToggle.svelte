<script lang="ts">
	import { userState } from '$lib/state/user.svelte';
	import { t } from '$lib/state/i18n.svelte';
	import Icon from '@iconify/svelte';

	let { checked = $bindable() } = $props();
</script>

<label
	class="swap swap-rotate btn btn-circle btn-lg bg-base-200 hover:bg-base-300 border-base-content/10 border shadow-sm transition-all duration-200 hover:scale-110"
	aria-label={t('ui.toggle_audio')}
	title={t('ui.toggle_audio')}
>
	<!-- this hidden checkbox controls the state -->
	<input type="checkbox" bind:checked={userState.preferences.auto_play_audio} onchange={() => userState.save()} />

	<!-- volume on icon -->
	<Icon icon="lucide:volume-2" class="swap-on text-primary h-8 w-8" />

	<!-- volume off icon -->
	<Icon icon="lucide:volume-x" class="swap-off h-8 w-8 opacity-50" />
</label>
