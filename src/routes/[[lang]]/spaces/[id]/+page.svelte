<script lang="ts">
	import { qoolie } from '$lib/db/dbQuery';
	import { page } from '$app/state';
	import FieldValue from '$components/form/FieldValue.svelte';
	import DataProvider from '$components/form/DataProvider.svelte';
	import CollectionList from '$components/form/CollectionList.svelte';

	let _data = $derived(qoolie('space').getOne(page.params.id));
</script>

<DataProvider collection="space" data={_data}>
	<FieldValue data={_data} fieldName="name" showLabel={false} />
	<FieldValue data={_data} fieldName="caption" showLabel={false} />
</DataProvider>
<CollectionList collection="chat" where={{ spaceId: page.params.id }} />