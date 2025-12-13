<script lang="ts">
	import { t } from '$lib/state/i18n.svelte';
	import { uiState } from '$lib/state/ui.svelte';
	import Icon from '@iconify/svelte';
</script>

<button
	class="btn btn-ghost btn-square btn-sm {uiState.sidebarCollapsed ? 'mx-auto' : ''} "
	onclick={() => uiState.toggleSidebar()}
	aria-label={uiState.sidebarCollapsed ? t('ui.expand') : t('ui.collapse')}
	title={uiState.sidebarCollapsed ? t('ui.expand') : t('ui.collapse')}
>
	<Icon icon="lucide:panel-left" class="h-5 w-5" />
</button>
