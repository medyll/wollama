<script lang="ts">
	import { t } from '$lib/stores/i18n';
	import InfoLine from '$components/fragments/InfoLine.svelte';
	import { settings } from '$lib/stores/settings.svelte';
</script>

<div style="padding: 1rem">
<InfoLine title={$t('settings.title_auto')}>
	<button
		on:click={() => {
			$settings.title_auto = !$settings.title_auto;
		}}>{$settings.title_auto}</button
	>
</InfoLine>
<InfoLine title={$t('settings.voice_auto_stop')}>
	<button
		on:click={() => {
			$settings.voice_auto_stop = !$settings.voice_auto_stop;
		}}>{$settings.voice_auto_stop}</button
	>
</InfoLine>
<InfoLine title={$t('settings.avatar')} vertical>
	<input type="text" class="w-full" bind:value={$settings.avatar_email} placeholder={$t('settings.avatar_email')} />
</InfoLine>
</div>