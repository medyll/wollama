<script lang="ts">
	import { qoolie } from '$lib/db/dbQuery';
	import { page } from '$app/state';
	import FieldValue from '$components/form/FieldValue.svelte';
	import DataProvider from '$components/form/DataProvider.svelte';
	import CollectionList from '$components/form/CollectionList.svelte';
	import ChatArea from '$components/chat/ChatArea.svelte';
	import { engine } from '$lib/tools/engine';

	let _data = $derived(qoolie('space').getOne(page.params.id));

	function onChatLoaded(id: number, chatPassKey?: string) {
		engine.goto(`/chat/${chatPassKey}`); 
	}
</script>

<DataProvider collection="space" data={_data}>
	<FieldValue data={_data} fieldName="name" showLabel={false} />
	<FieldValue data={_data} fieldName="caption" showLabel={false} />
</DataProvider>
<ChatArea {onChatLoaded} />
<CollectionList collection="chat" where={{ spaceId: page.params.id }} />
