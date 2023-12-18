<script lang="ts">

	let className = '';
	export { className as class };
</script>

<div class={className}>
	<div class="h-full">
		<div class="skeletonLine" />
		<div class="skeletonLine" ></div>
		<div class="skeletonLine" />
	</div>
</div>

<style lang="postcss">
	.skeletonLine {
		@apply h-1 bg-gray-200 dark:bg-gray-600 rounded-sm col-span-2 mb-1 animate-pulse;
	}
</style>
