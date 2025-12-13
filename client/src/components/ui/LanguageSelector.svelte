<script lang="ts">
	import { userState } from '$lib/state/user.svelte';
	import DataSelector from '$components/ui_data/DataSelector.svelte';

	let { class: className = '' } = $props();

	$effect(() => {
		// React to locale changes and save
		// We access the property to track it
		const _ = userState.preferences.locale;
		// Save to persistence
		userState.save();
	});
</script>

<div class={className}>
	<DataSelector
		tableName="languages"
		bind:selectedId={userState.preferences.locale}
		mode="dropdown"
		class="select-sm select-ghost w-full max-w-xs"
		placeholder="Select Language"
	/>
</div>
