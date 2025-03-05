<!-- 
    Component: BookHome
    D:\boulot\python\wollama\src\components\book\BookHome.svelte
-->
<script lang="ts">
	import CollectionButton from '$components/form/CollectionButton.svelte';
	import CollectionFks from '$components/form/CollectionFks.svelte';
	import CollectionListMenu from '$components/form/CollectionListMenu.svelte';
	import CollectionReverseFks from '$components/form/CollectionReverseFks.svelte';
	import CreateUpdate from '$components/form/CreateUpdate.svelte';
	import Confirm from '$components/fragments/Confirm.svelte';
	import { type DbChapter, type DbCharacter } from '$types/db';

	let {
		id,
		collection = 'book'
	}: {
		id:          any;
		collection?: string;
	} = $props();

	let where = { bookId: { eq: id } };
</script>

<div class="flex w-full">
	<div class="p4">
		<CollectionFks {collection} collectionId={id} {where} />
		<hr />
		<CollectionReverseFks {collection} collectionId={id} {where}>
			{#snippet children(item)}
				<div class="p2 font-bold">{item.collection}</div>
				<!-- list and button create -->
				<CollectionListMenu
					{where}
					data={{} as DbChapter}
					collection={item?.collection}
					target="red"
				/>
				<!--   button create -->
				<CollectionButton mode="create" collection={item?.collection} withData={{ bookId: id }} />
				<br />
				<br />
			{/snippet}
		</CollectionReverseFks>
	</div>
	<div class="p4 flex-1">
		<!-- Book information -->
		<CreateUpdate
			{collection}
			inPlaceEdit
			dataId={id}
			mode="show"
			displayMode="vertical"
			showFields={['title', 'status', 'description']}
		/>
		<!-- characters list and button create -->
		<CollectionListMenu {where} data={{} as DbCharacter} collection={'character'} target="red" />
		<CollectionButton mode="create" collection="character" withData={{ bookId: id }} />
	</div>
</div>
