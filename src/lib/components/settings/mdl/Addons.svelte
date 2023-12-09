<script lang="ts">
	import { t } from '$lib/i18n';
	import InfoLine from '../../ui/InfoLine.svelte';
</script>

<InfoLine title={$t('settings.title_auto')}>
	<button>on</button>
</InfoLine>
<InfoLine title={$t('settings.voice_auto_stop')}>
	<button>on</button>
</InfoLine>
<InfoLine title={$t('ui.avatar')} vertical>
	<input type="text" class="w-full" placeholder={$t('ui.set_avatar_email')}  />
</InfoLine>
