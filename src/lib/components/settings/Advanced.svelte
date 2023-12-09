<script lang="ts">
	import { t } from '$lib/i18n';
	import { settings } from '$lib/stores/settings';
</script>

<div class="flex">
	<div>{$t('settings.request_mode')}</div>
	<div>json / plain</div>
</div>

{#each Object.keys($settings.llamaOptions) as setting}
	<div class="flex">
		<div class="flex-1">{setting}</div>
		<div>{$settings.llamaOptions[setting]}</div>
	</div>
{/each}
