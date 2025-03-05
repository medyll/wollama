<script lang="ts">
	import { idbQuery } from '$lib/db/dbQuery';
	import { ui } from '$lib/stores/ui';

	let activeChat = $derived($ui.activeChatId ? idbQuery.getChat($ui.activeChatId) : {});
</script>

<!-- {#if activeChat?.createdAt} -->
<div class="p-1 py-4">
	<div class="flex-align-middle">
		<div class="flex-1 px-2 opacity-40"></div>
		<slot />
	</div>
</div>
<!-- {/if} -->
