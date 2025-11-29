<script lang="ts" generics="COL = Record<string,any>">
	import {
		type MenuListProps,
		Button,
		MenuList,
		MenuListItem,
		openWindow,
		type Props,
		Looper
	} from '@medyll/idae-slotui-svelte';
	import CreateUpdate from '$components/form/CreateUpdate.svelte';
	import { idbqlState } from '$lib/db/dbSchema';
	import { IDbCollections, IDbCollectionValues } from '$lib/db/dbFields';
	import { hydrate, type Snippet } from 'svelte';
	import type { Where } from '@medyll/idae-idbql';

	interface CollectionListProps {
		collection:     string;
		target?:        string; // html target
		data?:          COL;
		menuListProps?: MenuListProps;
		style?:         string;
		displayMode?:   'line' | 'grid';
		where?:         Where<COL>;
		children?:      Snippet;
		onclick?:       (data: COL, index: number | string) => void;
	}

	let {
		collection,
		target,
		data,
		menuListProps,
		onclick,
		style,
		where,
		children: _children,
		displayMode
	}: CollectionListProps = $props();

	let test = new IDbCollections();
	let fieldValues = new IDbCollectionValues(collection);
	let index = test.getIndexName(collection);

	let qy = $derived(where ? idbqlState[collection].where(where) : idbqlState[collection].getAll());

	function load(event: CustomEvent, indexV: number | string) {
		openCrud(event[index]);
	}

	function openCrud(id: any) {
		// mount on target, returns component
		let mounted = hydrate(CreateUpdate, {
			target: document.querySelector(`[data-target-zone="${target}"]`),
			props:  { collection: collection, dataId: id, mode: 'show' }
		});

		return mounted;
	}

	const _onclick = (data: COL, index: number | string) => {
		console.log('onclick', data, index);

		if (onclick) {
			onclick(data, index);
		} else {
			load(data, index);
		}
	};
</script>

<div class="grid grid-cols-3 gap-3 p-3">
	<Looper data={qy}>
		{#snippet loopTitle()}
			{@render _children?.()}
		{/snippet}
		{#snippet children({ item })}
			<div class="flex aspect-square flex-col rounded-2xl border border-gray-300 p-2">
				<div class="flex-1">edit</div>
				<a
					href="/collections/{fieldValues.indexValue(item)}"
					onclick={(event) => {
						event.preventDefault();
						_onclick?.(item, index);
					}}
				>
					<div class="py-3">{fieldValues.presentation(item)}</div>
					<div class="py-3">date {fieldValues.display('created_at', item)}</div>
				</a>
			</div>
		{/snippet}
	</Looper>
</div>
