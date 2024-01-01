<script lang="ts">
	import List from '$components/fragments/List.svelte';

	let className = '';
	export { className as class };

	function skeletonLine() {
		return [...Array(Math.ceil(Math.random() * 5))].map(() => '<div class="h-2  bg-gray-200 dark:bg-gray-600 rounded-md  p-1   col-span-2  animate-pulse    flex-auto" ></div>').join('');
	}
</script>

<div class={className}>
	<List class="flex flex-col gap-2" data={[...Array(4)]}>
		<div class="flex gap-2">{@html skeletonLine()}</div>
	</List>
</div>
