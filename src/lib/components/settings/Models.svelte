<script lang="ts">
	import { t } from '$lib/i18n';
	import { chatter } from '$lib/stores/chatter';
	import { settings } from '$lib/stores/settings';
	import Icon from '@iconify/svelte';
	import InfoLine from '../ui/InfoLine.svelte';
</script>


<InfoLine title={$t('settings.pull_model')}>
	<input slot="input" placeholder={$t('settings.enter_model')} type="text" class="w-full" />
	<button>
		<Icon icon="mdi:content-save" />
	</button>
</InfoLine>
<hr />
<InfoLine title={$t('settings.model_delete')}>
	<select slot="input" placeholder={$t('settings.enter_model')} class="w-full">
		{#each $settings?.models ?? [] as model}
			{@const partial = model.name.split(':')[0]}
			<option value={model.name}>{model.name}</option>
		{/each}
	</select>
	<button>
		<Icon icon="mdi:delete" />
	</button>
</InfoLine>
