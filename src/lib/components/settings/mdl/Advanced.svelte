<script lang="ts">
	import { t } from '$lib/i18n';
	import { settings } from '$lib/stores/settings';
	import InfoLine from '$lib/components/ui/InfoLine.svelte';
</script>

<InfoLine title={$t('settings.request_mode')}>json / plain</InfoLine>
<hr />

{#each Object.keys($settings.llamaOptions) as setting}
	<InfoLine title={$t('settings.' + setting)}>
		{$settings.llamaOptions[setting]}
	</InfoLine>
{/each}
