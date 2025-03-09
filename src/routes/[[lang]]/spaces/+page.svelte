<script lang="ts">
	import type { PageData } from './$types';
	import { qoolie } from '$lib/db/dbQuery';
	import CollectionButton from '$components/form/CollectionButton.svelte';
	import CollectionList from '$components/form/CollectionList.svelte';

	export let data: PageData;

	const spaceList = qoolie('space').getAll();
 
</script>

<CollectionList collection="space">
	<CollectionButton collection="space" mode="create" />
</CollectionList>
