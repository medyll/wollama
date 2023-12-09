<script lang="ts">
	import { t } from '$lib/i18n';
	import { chatter } from '$lib/stores/chatter';
	import { settings } from '$lib/stores/settings';
	import Icon from '@iconify/svelte';
 
</script>

<div>
	{$t('settings.pull_model')}
</div>
<div class="flex">
	<div class="flex-1">
		<input placeholder={$t('settings.enter_model')} type="text" class="w-full" />
	</div>
	<div>
		<button>
			<Icon icon="mdi:content-save" />
		</button>
	</div>
</div>
<hr />
<div>
	{$t('settings.model_delete')}
</div>
<div class="flex">
	<div class="flex-1">
		<select placeholder={$t('settings.enter_model')} class="w-full">
			{#each $settings?.models ?? [] as model}
				{@const partial = model.name.split(':')[0]}
				<option  value={model.name}>{model.name}</option>
			{/each}
		</select>
	</div>
	<div>
		<button>
			<Icon icon="mdi:delete" />
		</button>
	</div>
</div>
