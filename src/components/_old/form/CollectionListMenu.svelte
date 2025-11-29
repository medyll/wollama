<script lang="ts" generics="COL = Record<string,any>">
	import { type MenuListProps, Button, MenuList, MenuListItem, openWindow, type Props } from '@medyll/idae-slotui-svelte';
	import CreateUpdate from '$components/form/CreateUpdate.svelte';
	import { idbqlState } from '$lib/db/dbSchema';
	import { IDbCollections, IDbCollectionValues } from '$lib/db/dbFields';
	import { hydrate } from 'svelte';
	import type { Where } from '@medyll/idae-idbql';

	interface CollectionListMenuProps {
		collection:     string;
		target?:        string; // html target
		data?:          COL;
		menuListProps?: MenuListProps;
		style?:         string;
		where?:         Where<COL>;
		onclick?:       (event: CustomEvent, index: number) => void;
	}

	let { collection, target, data, menuListProps, onclick, style, where }: CollectionListMenuProps = $props();

	let test = new IDbCollections();
	let fieldValues = new IDbCollectionValues(collection);
	let index = test.getIndexName(collection);

	let qy = $derived(where ? idbqlState[collection].where(where) : idbqlState[collection].getAll());

	function load(event: CustomEvent, indexV: number) {
		openCrud(event[index]);
	}

	function openCrud(id: any) {
		// mount on target, returns component
		let mounted = hydrate(CreateUpdate, {
			target: document.querySelector(`[data-target-zone="${target}"]`),
			props:  { collection: collection, dataId: id, mode: 'update' }
		});

		return mounted;
	}
</script>

<MenuList {style} onclick={onclick ?? load} data={qy} {...menuListProps}>
	{#snippet children({ item })}
		<MenuListItem data={item}>{fieldValues.presentation(item)}</MenuListItem>
	{/snippet}
</MenuList>
